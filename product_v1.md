# SSL Certificate Manager — Roadmap para V1 Estável (Uso Interno)

> **Veredicto:** O projeto está funcional como POC/demo, mas **não está pronto para produção interna**.  
> Existem bugs que impedem o uso, falhas de segurança que podem expor chaves privadas dos devs e lacunas de qualidade que tornam a manutenção frágil.  
> Este documento lista tudo que precisa ser feito, na ordem correta de execução.

---

## Índice

1. [Diagnóstico Atual](#1-diagnóstico-atual)
2. [Etapa 0 — Pré-requisitos e Setup](#etapa-0--pré-requisitos-e-setup)
3. [Etapa 1 — Bugs Críticos (Bloqueia tudo)](#etapa-1--bugs-críticos-bloqueia-tudo)
4. [Etapa 2 — Segurança Obrigatória](#etapa-2--segurança-obrigatória)
5. [Etapa 3 — Qualidade e Resiliência](#etapa-3--qualidade-e-resiliência)
6. [Etapa 4 — Funcionalidades Faltantes (V1)](#etapa-4--funcionalidades-faltantes-v1)
7. [Etapa 5 — Infraestrutura de Produção](#etapa-5--infraestrutura-de-produção)
8. [Etapa 6 — Testes e Validação Final](#etapa-6--testes-e-validação-final)
9. [Checklist Final de Go/No-Go](#checklist-final-de-gono-go)
10. [Estimativa de Esforço](#estimativa-de-esforço)

---

## 1. Diagnóstico Atual

### O que funciona
- Geração de chaves RSA/EC
- Geração e download de CSRs
- Geração de PFX
- Geração de SSH key pairs
- Geração de certificados self-signed
- Upload de certificados e chaves
- Login com JWT
- Gerenciamento de usuários pelo admin
- Troca de idioma (pt-BR, en, es) — i18n completo
- Docker Compose básico funcional

### O que está quebrado
- Compartilhamento de arquivos: usuário destinatário não consegue fazer download
- `/docs` do FastAPI exposta publicamente (revela toda a API)
- Backend rodando com `--reload` (modo dev) mesmo em "produção"
- Migrations silenciosamente falham sem log de erro
- Logs com `print()` em vez de logging estruturado
- Senhas padrão fracas sem obrigatoriedade de troca no deploy

### Riscos graves de segurança
- Chaves privadas salvas em disco sem criptografia
- Mesmo `SECRET_KEY` usado para assinar JWT **e** criptografar senhas PFX
- Sem rate limiting no login (brute force trivial)
- Sem refresh token (usuário perde sessão a cada 30 min)
- Sem HTTPS no docker-compose
- Documentação da API (`/docs`, `/redoc`) acessível por qualquer pessoa na rede
- Sem bloqueio de conta após tentativas de senha incorretas

---

## Etapa 0 — Pré-requisitos e Setup

> Fazer antes de qualquer desenvolvimento. Base para todo o resto.

### 0.1 Criar arquivo `.env.example` e `.env` de produção
```bash
# .env.example — commitar no git
SECRET_KEY=CHANGE_ME_generate_with_openssl_rand_hex_32
ENCRYPTION_KEY=CHANGE_ME_generate_with_openssl_rand_hex_32
ADMIN_EMAIL=admin@bsatech.io
ADMIN_USERNAME=admin
ADMIN_PASSWORD=CHANGE_ME_strong_password
DATABASE_URL=postgresql://sslmanager:CHANGE_ME@postgres:5432/sslmanager
POSTGRES_PASSWORD=CHANGE_ME
CORS_ORIGINS=https://ssl-manager.bsatech.io
ACCESS_TOKEN_EXPIRE_MINUTES=480
ENABLE_DOCS=false
```
- `.env` nunca deve entrar no git → verificar `.gitignore`
- Adicionar validação no startup: se `SECRET_KEY == "your-secret-key-here-change-in-production"`, **recusar subir**

### 0.2 Validação de config no startup (`main.py`)
```python
INSECURE_DEFAULTS = [
    "your-secret-key-here-change-in-production",
    "admin123",
    "sslmanager123",
]
if settings.SECRET_KEY in INSECURE_DEFAULTS:
    raise RuntimeError("FATAL: SECRET_KEY não foi configurado. Configure o .env antes de subir em produção.")
if settings.ADMIN_PASSWORD in INSECURE_DEFAULTS:
    raise RuntimeError("FATAL: ADMIN_PASSWORD não foi configurado. Configure o .env.")
```

### 0.3 Adicionar Alembic para migrations
- Remover `_run_migrations()` manual do `main.py` que silencia falhas
- Instalar Alembic e gerar migration inicial com o schema atual
- Todas as novas colunas via migrations versionadas

```bash
pip install alembic
alembic init alembic
alembic revision --autogenerate -m "initial_schema"
```

### 0.4 Separar chaves de criptografia
```python
# config.py — adicionar campo separado
ENCRYPTION_KEY: str = ""  # Usada SOMENTE para criptografar arquivos/senhas PFX
SECRET_KEY: str = ""      # Usada SOMENTE para assinar JWT
```
- Isso permite trocar `SECRET_KEY` (invalida tokens) sem quebrar os PFXs
- Permite trocar `ENCRYPTION_KEY` com migration dos dados existentes

---

## Etapa 1 — Bugs Críticos (Bloqueia tudo)

> Estes itens precisam ser corrigidos antes de qualquer uso, mesmo interno.

### 1.1 Corrigir download de arquivos compartilhados
**Problema:** `GET /api/shares/shared-with-me` lista arquivos compartilhados, mas não há endpoint de download para o destinatário.  
**Correção:** Criar `GET /api/shares/download/{file_id}` que valida se o usuário é destinatário do compartilhamento e retorna o arquivo.

```python
@router.get("/download/{file_id}")
async def download_shared_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    share = db.query(SharedFile).filter(
        SharedFile.file_id == file_id,
        SharedFile.shared_with_user_id == current_user.id,
    ).first()
    if not share:
        raise HTTPException(status_code=404, detail="Arquivo compartilhado não encontrado.")
    file = db.query(File).filter(File.id == file_id).first()
    return FileResponse(file.file_path, filename=file.custom_name)
```

### 1.2 Esconder `/docs` e `/redoc` em produção
**Problema:** Qualquer pessoa na rede interna pode ver toda a API, schemas e autenticar no Swagger.  
**Correção:** Em `main.py`, habilitar docs apenas se variável de ambiente `ENABLE_DOCS=true`:

```python
app = FastAPI(
    title="SSL Certificate Manager",
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
    openapi_url="/openapi.json" if settings.ENABLE_DOCS else None,
)
```

### 1.3 Remover `--reload` do comando de produção
**Problema:** `docker-compose.yml` usa `uvicorn ... --reload`, que é modo desenvolvimento.  
**Correção:**
```yaml
# docker-compose.yml (produção)
command: gunicorn app.main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 60

# docker-compose.dev.yml (desenvolvimento)
command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Separar em dois arquivos: `docker-compose.yml` (prod) e `docker-compose.dev.yml` (dev).

### 1.4 Corrigir role validation no banco
**Problema:** Coluna `role` é `VARCHAR` sem constraint — qualquer string é aceita.  
**Migration Alembic:**
```sql
ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('admin', 'user'));
```
**Schema:** Validar no Pydantic:
```python
from typing import Literal
class UserAdminCreate(BaseModel):
    role: Literal['admin', 'user'] = 'user'
```

### 1.5 Corrigir tratamento de tags inconsistente
**Problema:** Tags às vezes salvas como JSON string, às vezes como lista, causando erros silenciosos.  
**Correção:** Padronizar em todos os routers:
```python
tags_json = json.dumps(data.tags) if data.tags else "[]"

def parse_tags(tags_str: str | None) -> list:
    if not tags_str:
        return []
    try:
        return json.loads(tags_str)
    except (json.JSONDecodeError, TypeError):
        return []
```

### 1.6 Health check verificar conectividade real
**Problema:** `/health` retorna 200 mesmo se o banco estiver fora.  
**Correção:**
```python
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "ok"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")
```

### 1.7 Verificar e corrigir import duplicado em `certificates.py`
```python
import aiofiles  # manter apenas uma vez
```

---

## Etapa 2 — Segurança Obrigatória

> Sem estes itens, o sistema não deve ter chaves privadas reais.  
> Para uso interno com devs, estes são **não-negociáveis**.

### 2.1 CRÍTICO: Criptografar chaves privadas em disco
**Problema:** Private keys (SSL, SSH) salvas como plain text. Se o servidor for comprometido, **todas as chaves dos devs estão expostas**.

**Solução mínima viável — criptografia com Fernet antes de salvar:**
```python
# backend/app/utils/file_crypto.py
from cryptography.fernet import Fernet
from app.config import settings

def get_fernet() -> Fernet:
    import hashlib, base64
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.ENCRYPTION_KEY.encode()).digest())
    return Fernet(key)

def encrypt_file(content: bytes) -> bytes:
    return get_fernet().encrypt(content)

def decrypt_file(content: bytes) -> bytes:
    return get_fernet().decrypt(content)
```

### 2.2 Rate Limiting no login
**Problema:** Brute force sem limite.  
**Solução:** Adicionar `slowapi` (rate limiter para FastAPI):
```bash
pip install slowapi
```
```python
# main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# auth.py
@router.post("/token", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, ...):
```

### 2.3 Bloqueio de conta após tentativas incorretas
**Problema:** Um atacante (ou erro do usuário) pode tentar senhas indefinidamente sem consequências de lockout.  
**Solução:** Bloquear conta após 3 tentativas incorretas consecutivas. Apenas admin pode desbloquear, gerando uma nova senha automática.

**Modelo — adicionar colunas:**
```python
# models/__init__.py
failed_login_attempts = Column(Integer, default=0, nullable=False)
login_locked = Column(Boolean, default=False, nullable=False)
```

**Auth router — lógica de lockout:**
```python
@router.post("/token")
async def login(form_data, db):
    user = db.query(User).filter(User.username == form_data.username).first()

    if user and user.login_locked:
        raise HTTPException(403, "Conta bloqueada por excesso de tentativas. Contate o administrador.")

    if not user or not verify_password(form_data.password, user.hashed_password):
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            remaining = max(0, 3 - user.failed_login_attempts)
            if user.failed_login_attempts >= 3:
                user.login_locked = True
                db.commit()
                raise HTTPException(403, "Conta bloqueada por excesso de tentativas. Contate o administrador.")
            db.commit()
            if remaining == 1:
                detail = "Senha incorreta. Esta é sua última tentativa."
            else:
                detail = f"Senha incorreta. Você tem {remaining} tentativa(s) restante(s)."
            raise HTTPException(401, detail)
        raise HTTPException(401, "Usuário ou senha incorretos.")

    # Login bem-sucedido — zerar contador
    user.failed_login_attempts = 0
    user.last_login = datetime.utcnow()
    db.commit()
```

**Admin router — endpoint de desbloqueio:**
```python
@router.post("/users/{user_id}/unlock")
async def unlock_user(user_id: int, admin=..., db=...):
    user = db.query(User).filter(User.id == user_id).first()
    new_password = secrets.token_urlsafe(12)
    user.login_locked = False
    user.failed_login_attempts = 0
    user.is_active = True
    user.hashed_password = get_password_hash(new_password)
    user.force_password_change = True
    db.commit()
    return {"generated_password": new_password, "message": "Usuário desbloqueado."}
```

**Frontend — Login.tsx:**
- Após 1ª falha: exibir mensagem do backend com contador ("Restam 2 tentativas")
- Após 2ª falha: "Esta é sua última tentativa"
- Após 3ª falha (403): exibir "Conta bloqueada. Entre em contato com o administrador"
- Desabilitar formulário enquanto conta estiver bloqueada

**Frontend — UserManagement.tsx:**
- Exibir chip "Bloqueado (login)" quando `login_locked = true`
- Botão de desbloqueio que chama `POST /api/admin/users/{id}/unlock`
- Dialog pós-desbloqueio exibindo nova senha gerada (igual ao create user)

### 2.4 Refresh Token
**Problema:** JWT expira em 30 min → usuário perde sessão trabalhando.  
**Solução:** Implementar refresh token com expiração longa (8h ou 24h):
```python
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    force_password_change: bool = False
    role: str = "user"
    expires_in: int
```

### 2.5 HTTPS obrigatório
**Problema:** Frontend e backend comunicam por HTTP.  
**Solução:** Adicionar Nginx como reverse proxy com TLS no docker-compose.  
Ver Etapa 5.1 para configuração completa.

### 2.6 Proteção de CSRF
**Problema:** Requests cross-site podem ser forjados.  
**Solução mínima:** Validar `Origin` header nas mutations (POST/PUT/DELETE):
```python
@app.middleware("http")
async def csrf_protection(request: Request, call_next):
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        origin = request.headers.get("Origin", "")
        allowed = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
        if origin and origin not in allowed:
            return JSONResponse(status_code=403, content={"detail": "CSRF protection triggered."})
    return await call_next(request)
```

### 2.7 Log de auditoria básico
**Problema:** Nenhum registro de quem fez o quê. GDPR e segurança interna exigem isso.  
**Solução:** Criar tabela `AuditLog` e registrar ações críticas:

```python
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    resource_type = Column(String, nullable=True)
    resource_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

Registrar no mínimo:
- Login (sucesso e falha, incluindo bloqueio)
- Download de arquivo
- Delete de arquivo
- Criação/remoção de usuário
- Compartilhamento de arquivo
- Troca de senha
- Desbloqueio de conta

### 2.8 Logging estruturado e descritivo
**Problema:** `print()` espalhado pelo código sem contexto. Logs não estruturados são difíceis de buscar, filtrar e correlacionar em produção.

**Solução:** Logging JSON com campos padronizados em todos os serviços.

```python
# backend/app/logging_config.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "service": "ssl-manager-backend",
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry, ensure_ascii=False)

def configure_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    root.handlers.clear()
    root.addHandler(handler)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
```

**Substituir todos os `print()` por logger com contexto rico:**
```python
# Ruim:
print(f"Migration note: {exc}")

# Bom:
logger.warning("Migration skipped", extra={"migration": stmt, "reason": str(exc)})

# Ruim:
print(f"[startup] Default admin user created: {settings.ADMIN_USERNAME!r}")

# Bom:
logger.info("Default admin created", extra={"username": settings.ADMIN_USERNAME})
```

**Padrão de log em cada ação de usuário:**
```python
logger.info("User login", extra={
    "event": "user.login",
    "user_id": user.id,
    "username": user.username,
    "ip": request.client.host,
    "success": True,
})

logger.warning("Login failed - account locked", extra={
    "event": "user.login_locked",
    "username": form_data.username,
    "ip": request.client.host,
})
```

**Configurar no docker-compose para logs legíveis por ferramentas:**
```yaml
backend:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "5"
```

Isso permite usar `docker logs sslmanager-backend | jq .` para filtrar e `docker logs --since 1h` para análise temporal.

### 2.9 Não expor stack traces ao cliente
**Problema:** `except Exception as e: raise HTTPException(detail=str(e))` expõe internals.  
**Correção em todos os routers:**
```python
except Exception as e:
    logger.error("Internal error", exc_info=True, extra={"context": "..."})
    raise HTTPException(status_code=500, detail="Erro interno do servidor. Contate o administrador.")
```

### 2.10 Validação de conteúdo no upload de arquivos
**Problema:** Upload aceita qualquer arquivo com extensão `.pem`, sem verificar se é PEM válido.  
**Correção:**
```python
def is_valid_pem(content: bytes) -> bool:
    text = content.decode('utf-8', errors='ignore')
    return "-----BEGIN" in text and "-----END" in text
```

---

## Etapa 3 — Qualidade e Resiliência

### 3.1 Cobertura de testes mínima
O projeto tem apenas 2 testes (health check e root). Para V1 interno estável:

**Testes obrigatórios a criar:**
```
tests/
  test_auth.py           — login, token, refresh, rate limit, bloqueio, unlock
  test_admin.py          — criar/editar/deletar/desbloquear usuário (admin)
  test_files.py          — upload, download, delete, tags
  test_certificates.py   — geração, validação, download
  test_keys.py           — geração RSA/EC, download
  test_csr.py            — geração CSR
  test_pfx.py            — geração PFX, decrypt senha
  test_shares.py         — compartilhar, listar, download por destinatário
  test_permissions.py    — user não acessa arquivo de outro user
```

Meta mínima: **60% de cobertura** nos routers críticos (auth, certificates, keys, admin).

### 3.2 Error handling consistente
```python
@app.exception_handler(404)
async def not_found(request, exc):
    return JSONResponse(status_code=404, content={"detail": "Recurso não encontrado."})

@app.exception_handler(500)
async def server_error(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Erro interno."})
```

### 3.3 Separar docker-compose de dev e produção
```
docker-compose.yml          — produção (gunicorn, sem bind mounts, sem --reload)
docker-compose.dev.yml      — desenvolvimento (--reload, bind mounts)
```
Uso:
```bash
# Dev
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Produção
docker-compose up
```

### 3.4 Resource limits nos containers
```yaml
backend:
  deploy:
    resources:
      limits:
        memory: 512M
        cpus: '1.0'
      reservations:
        memory: 256M
```

### 3.5 Backup automático do banco
```bash
# Backup manual
docker exec sslmanager-postgres pg_dump -U sslmanager sslmanager | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip -c backup_20260513.sql.gz | docker exec -i sslmanager-postgres psql -U sslmanager sslmanager
```

---

## Etapa 4 — Funcionalidades Faltantes (V1)

### 4.1 Download de arquivo compartilhado (já citado no bug 1.1)
Já descrito acima — é bloqueador de uso.

### 4.2 Visualizador de detalhes do certificado na listagem
**O que falta:** Ao clicar num certificado, mostrar: Subject, Issuer, SANs, validity dates, fingerprint, se autoassinado.

### 4.3 Validar se CSR casa com chave privada
```python
@router.post("/match-key-csr")
async def validate_key_csr_match(key_id: int, csr_id: int, ...):
    # Extrair public key do CSR e da chave privada, comparar
```

### 4.4 Notificação de certificados expirando
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job("cron", hour=8)
async def notify_expiring_certs():
    # Buscar certs expirando em 30 dias, enviar email para owner
```

### 4.5 Busca avançada de arquivos
Filtros por: tipo, data de criação, data de expiração, tags específicas, dono.

### 4.6 Operações em lote (bulk)
Selecionar múltiplos arquivos e: deletar todos, adicionar tag em todos.

### 4.7 Perfil do usuário
Usuário ver/editar seu próprio email, nome completo, ver histórico de ações.

### 4.8 Endpoint de geração de chave pública a partir de privada
Dado uma chave privada existente no sistema, extrair a chave pública.

---

## Etapa 5 — Infraestrutura de Produção

> Domínio de produção: `ssl-manager.bsatech.io`

### 5.1 Nginx como reverse proxy

```nginx
# nginx/nginx.conf
server {
    listen 80;
    server_name ssl-manager.bsatech.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ssl-manager.bsatech.io;

    ssl_certificate     /etc/nginx/certs/ssl-manager.bsatech.io.crt;
    ssl_certificate_key /etc/nginx/certs/ssl-manager.bsatech.io.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 5M;

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5.2 Criação do certificado self-signed para `ssl-manager.bsatech.io`

**Opção A — usando a própria ferramenta (recomendado):**
1. Subir o sistema inicialmente via HTTP na rede interna
2. Logar como admin → ir em "Certificados de Aplicação"
3. Preencher: CN = `ssl-manager.bsatech.io`, SANs = `ssl-manager.bsatech.io`, `localhost`
4. Gerar e fazer download do certificado (`.crt`) e da chave privada (`.key`)
5. Colocar os arquivos em `nginx/certs/`
6. Reiniciar com Nginx habilitado

**Opção B — via OpenSSL na linha de comando:**
```bash
# Criar diretório para certificados
mkdir -p nginx/certs && cd nginx/certs

# Gerar chave privada
openssl genrsa -out ssl-manager.bsatech.io.key 4096

# Criar arquivo de configuração para SAN
cat > san.conf << 'EOF'
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C  = BR
ST = São Paulo
L  = São Paulo
O  = BSATech
OU = DevOps
CN = ssl-manager.bsatech.io

[v3_req]
subjectAltName = @alt_names
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = ssl-manager.bsatech.io
DNS.2 = localhost
IP.1  = 127.0.0.1
EOF

# Gerar certificado self-signed válido por 3 anos
openssl req -x509 -newkey rsa:4096 \
  -keyout ssl-manager.bsatech.io.key \
  -out ssl-manager.bsatech.io.crt \
  -days 1095 \
  -nodes \
  -config san.conf \
  -extensions v3_req

# Verificar o certificado gerado
openssl x509 -in ssl-manager.bsatech.io.crt -text -noout | grep -A5 "Subject Alternative Name"
```

**Configurar DNS local (no servidor ou roteador da empresa):**
```
ssl-manager.bsatech.io → IP do servidor onde o docker roda
```

Ou adicionar ao `/etc/hosts` das máquinas dos devs:
```
192.168.X.X  ssl-manager.bsatech.io
```

**Instalar o certificado como CA confiável nas máquinas dos devs:**
```bash
# macOS
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain ssl-manager.bsatech.io.crt

# Ubuntu/Debian
sudo cp ssl-manager.bsatech.io.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates

# Windows (PowerShell admin)
Import-Certificate -FilePath "ssl-manager.bsatech.io.crt" `
  -CertStoreLocation Cert:\LocalMachine\Root
```

### 5.3 Docker Compose de produção final

```yaml
# docker-compose.yml
services:
  postgres:
    container_name: sslmanager-postgres
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-sslmanager}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-sslmanager}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - sslmanager-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-sslmanager}"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  backend:
    container_name: sslmanager-backend
    build: ./backend
    restart: unless-stopped
    command: gunicorn app.main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 60
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-sslmanager}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-sslmanager}
      SECRET_KEY: ${SECRET_KEY}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_USERNAME: ${ADMIN_USERNAME}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      CORS_ORIGINS: ${CORS_ORIGINS:-https://ssl-manager.bsatech.io}
      ENABLE_DOCS: ${ENABLE_DOCS:-false}
      ACCESS_TOKEN_EXPIRE_MINUTES: ${ACCESS_TOKEN_EXPIRE_MINUTES:-480}
    volumes:
      - ssl_files:/app/ssl_files
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - sslmanager-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  frontend:
    container_name: sslmanager-frontend
    build: ./frontend
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - sslmanager-network

  nginx:
    container_name: sslmanager-nginx
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    depends_on:
      - backend
      - frontend
    networks:
      - sslmanager-network
    logging:
      driver: "json-file"
      options:
        max-size: "5m"
        max-file: "3"

volumes:
  postgres_data:
  ssl_files:

networks:
  sslmanager-network:
    driver: bridge
```

### 5.4 Secrets management
Para V1 interno:
- Usar arquivo `.env` não commitado no git
- Garantir `.gitignore` inclui `.env`, `*.key`, `nginx/certs/`
- Gerar secrets com `openssl rand -hex 32`

```bash
# Gerar SECRET_KEY
openssl rand -hex 32

# Gerar ENCRYPTION_KEY (separada)
openssl rand -hex 32
```

### 5.5 Backup e recuperação
```bash
# Backup do banco
docker exec sslmanager-postgres pg_dump -U sslmanager sslmanager \
  | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup dos arquivos SSL
docker run --rm -v ssl_files:/data -v $(pwd):/backup alpine \
  tar czf /backup/ssl_files_$(date +%Y%m%d).tar.gz /data

# Restore do banco
gunzip -c backup_20260513.sql.gz \
  | docker exec -i sslmanager-postgres psql -U sslmanager sslmanager
```

### 5.6 Monitoramento básico
- Uptime check externo apontando para `https://ssl-manager.bsatech.io/health`
- Alerta por email se `/health` retornar 503
- `restart: unless-stopped` em todos os containers

---

## Etapa 6 — Testes e Validação Final

### 6.1 Testes manuais antes do go-live

**Fluxo de autenticação:**
- [ ] Login com credenciais corretas → redireciona para dashboard
- [ ] Login com senha errada → contador aparece ("Restam 2 tentativas")
- [ ] 2ª tentativa errada → "Última tentativa"
- [ ] 3ª tentativa errada → "Conta bloqueada. Contate o administrador"
- [ ] Admin desbloqueia usuário → nova senha gerada exibida
- [ ] Usuário desbloqueado loga com nova senha → forçado a trocar
- [ ] Token expira → frontend força re-login
- [ ] Admin cria usuário → usuário consegue logar → força troca de senha

**Fluxo de arquivos:**
- [ ] Upload de certificado `.crt` válido → aparece na listagem
- [ ] Upload de arquivo inválido → erro descritivo
- [ ] Download de certificado → arquivo correto
- [ ] Delete de arquivo → some da listagem e do disco
- [ ] Usuário A não consegue ver/baixar arquivo de Usuário B

**Fluxo de compartilhamento:**
- [ ] Admin compartilha arquivo com Usuário A
- [ ] Usuário A vê na aba "Arquivos Compartilhados"
- [ ] Usuário A consegue fazer download do arquivo compartilhado
- [ ] Admin revoga compartilhamento → Usuário A não vê mais

**Fluxo de geração:**
- [ ] Gerar par RSA 2048 → download da chave privada funciona
- [ ] Gerar CSR → download do CSR funciona
- [ ] Gerar PFX com certificado + chave → download funciona
- [ ] Gerar certificado self-signed → aparece na listagem
- [ ] Gerar SSH key pair → download da chave privada e pública funciona

**Segurança:**
- [ ] Acessar `/docs` → deve retornar 404 (em produção)
- [ ] Acessar API sem token → 401
- [ ] Usuário comum tentar `/api/admin/users` → 403
- [ ] Logs via `docker logs sslmanager-backend | jq .` — estruturados e legíveis

### 6.2 Testes automatizados
```bash
pytest tests/ -v --cov=app --cov-report=term-missing
# Meta: >= 60% coverage
```

---

## Checklist Final de Go/No-Go

### Bloqueia o go-live (todos devem estar ✅)

**Bugs críticos:**
- [ ] Download de arquivos compartilhados funciona
- [ ] `/docs` e `/redoc` inacessíveis em produção
- [ ] Backend sem `--reload` (gunicorn)
- [ ] Role com validação via Literal
- [ ] Tags com handling consistente

**Segurança:**
- [ ] Bloqueio de conta após 3 tentativas incorretas ativo
- [ ] Admin consegue desbloquear conta e gerar nova senha
- [ ] Chaves privadas criptografadas em disco
- [ ] `SECRET_KEY` e `ENCRYPTION_KEY` separados e gerados aleatoriamente
- [ ] `ADMIN_PASSWORD` forte e não-padrão
- [ ] Rate limiting no login ativo
- [ ] HTTPS configurado (Nginx com TLS para ssl-manager.bsatech.io)
- [ ] Audit log registrando login, download, delete, bloqueio, desbloqueio
- [ ] Stack traces não retornam ao cliente
- [ ] `.env` fora do git

**Infraestrutura:**
- [ ] Docker Compose de produção sem bind mounts de desenvolvimento
- [ ] Backup manual testado e restaurado com sucesso
- [ ] `/health` verificando conectividade com banco
- [ ] Uptime monitoring configurado
- [ ] Logs estruturados em JSON

**Qualidade:**
- [ ] Logging estruturado (sem `print()` no código)
- [ ] Testes cobrem fluxos críticos de auth e file operations

### Pode ir após o go-live (V1.1 / backlog)

- [ ] Refresh token
- [ ] Notificação de certificados expirando por email
- [ ] Bulk operations (seleção múltipla)
- [ ] Perfil do usuário
- [ ] Validação de match CSR ↔ chave privada
- [ ] Busca avançada com filtros
- [ ] 2FA (autenticação de dois fatores)
- [ ] Integração com vault de secrets
- [ ] LDAP/SSO para autenticação corporativa
- [ ] API keys para automação

---

## Estimativa de Esforço

| Etapa | Descrição | Esforço estimado |
|-------|-----------|-----------------|
| Etapa 0 | Pré-requisitos e setup | 1 dia |
| Etapa 1 | Bugs críticos | 2–3 dias |
| Etapa 2 | Segurança obrigatória | 5–6 dias |
| Etapa 3 | Qualidade e resiliência | 3–4 dias |
| Etapa 4 | Funcionalidades faltantes V1 | 4–6 dias |
| Etapa 5 | Infraestrutura de produção | 2–3 dias |
| Etapa 6 | Testes e validação | 2–3 dias |
| **Total** | | **~3–4 semanas** (desenvolvedor dedicado) |

---

## Prioridade de execução recomendada

```
Semana 1: Etapa 0 + Etapa 1 + Etapa 2 (2.1, 2.2, 2.3, 2.8, 2.9)
Semana 2: Etapa 2 (restante) + Etapa 3 + Etapa 5
Semana 3: Etapa 4 + Etapa 6 (testes e validação)
```

A ordem garante que os riscos de segurança mais graves (chaves expostas, brute force, lockout) sejam resolvidos primeiro.
