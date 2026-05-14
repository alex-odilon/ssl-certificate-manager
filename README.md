# SSL Certificate Manager

Plataforma interna da BSA Tech para gerenciamento centralizado de certificados SSL/TLS, chaves criptográficas e identidades digitais. Desenvolvida e mantida pelo time de DevOps.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Segurança](#segurança)
6. [Instalação](#instalação)
7. [Acesso e Gestão de Usuários](#acesso-e-gestão-de-usuários)
8. [Comandos Operacionais](#comandos-operacionais)
9. [Solução de Problemas](#solução-de-problemas)

---

## Visão Geral

O SSL Certificate Manager resolve o problema de certificados e chaves privadas espalhados por e-mails, pastas compartilhadas e dispositivos pessoais — sem controle de acesso, sem rastreabilidade e com alto risco de expiração silenciosa.

A plataforma oferece:

- Geração e armazenamento centralizado de todos os tipos de artefatos criptográficos
- Chaves privadas criptografadas em repouso (Fernet/AES-128-CBC)
- Controle de acesso por usuário com isolamento completo de arquivos
- Compartilhamento controlado entre usuários internos
- Trilha de auditoria de todas as operações sensíveis
- Interface web multilíngue (pt-BR, en, es)

**Acesso:** `https://sslmanager.bsatech.local` (rede interna / VPN)

**Solicitação de acesso:** abra um chamado no GLPI para o time de DevOps, categoria *Certificados Digitais*.

---

## Funcionalidades

### Chaves Privadas RSA / EC
- Geração de chaves RSA (2048, 3072, 4096 bits) e EC (P-256, P-384)
- Upload de chaves existentes com validação de formato PEM
- Download com descriptografia transparente
- Armazenamento criptografado em repouso

### Certificate Signing Requests (CSR)
- Formulário com todos os campos Distinguished Name (CN, O, OU, C, ST, L)
- Suporte a Subject Alternative Names (SANs) — múltiplos domínios e IPs
- Geração automática da chave privada correspondente

### Certificados Auto Assinados
- Geração de certificado + chave em uma única operação
- Configuração de validade (1 a 3650 dias)
- SANs e parâmetros completos de DN

### Arquivos PFX / PKCS#12
- Combinação de certificado + chave privada + CA bundle opcional
- Senha de 25 caracteres gerada automaticamente e armazenada criptografada
- Compatibilidade com ambientes Windows e IIS

### Pares de Chaves SSH
- Algoritmos: Ed25519, RSA (2048/4096), ECDSA (P-256/P-384)
- Suporte a passphrase opcional
- Download separado de chave pública e privada

### Validação de Arquivos
- Validação de certificados, chaves, CSRs e PFX sem armazenamento
- Informações detalhadas: validade, emissor, SANs, algoritmo, fingerprint
- Carga automática de senha para validação de PFX

### Compartilhamento de Arquivos
- Compartilhamento de qualquer arquivo com outro usuário da plataforma por e-mail
- Isolamento: cada usuário acessa apenas seus próprios arquivos e o que foi compartilhado com ele

### Dashboard
- Estatísticas em tempo real por tipo de arquivo
- Alertas de certificados próximos ao vencimento (30 dias / 7 dias)

### Administração
- Criação de usuários com senha temporária gerada automaticamente
- Ativação, desativação, troca de papel (admin / user)
- Reset de senha e desbloqueio de conta
- Bloqueio automático após 3 tentativas de login incorretas

---

## Arquitetura e Tecnologias

### Backend
- **Python 3.11** + **FastAPI** 0.104
- **PostgreSQL 15** — persistência de dados
- **SQLAlchemy 2.0** — ORM
- **Gunicorn** + **UvicornWorker** — servidor ASGI de produção
- **cryptography** + **pyOpenSSL** — operações criptográficas
- **python-jose** — JWT (HS256)
- **passlib / bcrypt** — hash de senhas
- **slowapi** — rate limiting por IP
- **Logging JSON estruturado** — todos os eventos com timestamp, nível e contexto

### Frontend
- **React 18** + **TypeScript**
- **Material-UI v5**
- **React Router v6**
- **Axios**
- **i18n** — pt-BR, en, es

### Infraestrutura
- **Docker** + **Docker Compose**
- **Nginx** — proxy reverso com TLS 1.2/1.3, HSTS, headers de segurança
- Volumes Docker persistentes para banco de dados e arquivos SSL

---

## Estrutura do Projeto

```
ssl-certificate-manager/
├── backend/
│   ├── app/
│   │   ├── main.py               # Entrypoint FastAPI, middlewares, migrations
│   │   ├── config.py             # Configuração via pydantic-settings
│   │   ├── database.py           # Sessão SQLAlchemy
│   │   ├── rate_limit.py         # Instância slowapi compartilhada
│   │   ├── logging_config.py     # Logging JSON estruturado
│   │   ├── models/
│   │   │   └── __init__.py       # Modelos SQLAlchemy (User, File, SSHKey, AuditLog…)
│   │   ├── schemas/
│   │   │   └── __init__.py       # Schemas Pydantic
│   │   ├── routers/
│   │   │   ├── auth.py           # Login, troca de senha, /me
│   │   │   ├── admin.py          # Gestão de usuários (admin only)
│   │   │   ├── keys.py           # Chaves RSA/EC
│   │   │   ├── csr.py            # CSRs
│   │   │   ├── certificates.py   # Upload/download de certificados
│   │   │   ├── app_certs.py      # Certificados auto assinados
│   │   │   ├── pfx.py            # Geração de PFX
│   │   │   ├── ssh.py            # Pares de chaves SSH
│   │   │   ├── files.py          # Listagem, tags, exclusão
│   │   │   ├── shares.py         # Compartilhamento entre usuários
│   │   │   └── validation.py     # Validação sem armazenamento
│   │   └── utils/
│   │       ├── file_crypto.py    # Criptografia Fernet de arquivos em repouso
│   │       ├── crypto.py         # Helpers criptográficos
│   │       └── audit.py          # Escrita na tabela audit_logs
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/                # Dashboard, Login, Files, Validation…
│   │   ├── components/           # Componentes reutilizáveis
│   │   ├── contexts/             # AuthContext, LanguageContext
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf                # Proxy reverso com TLS
│   └── GERAR-CERTIFICADO.md     # Guia para gerar o certificado local
├── docker-compose.yml
├── .env.example                  # Modelo de variáveis de ambiente
└── README.md
```

---

## Segurança

### Implementado

| Controle | Detalhe |
|---|---|
| Chaves em repouso | Fernet (AES-128-CBC + HMAC-SHA256) com chave derivada do `ENCRYPTION_KEY` |
| Senhas PFX | Criptografadas no banco com `ENCRYPTION_KEY` (chave separada do JWT) |
| Autenticação | JWT HS256, expiração configurável (padrão 8 horas) |
| Bloqueio de conta | Bloqueio automático após 3 tentativas incorretas; desbloqueio via admin |
| Rate limiting | 15 req/min por IP no endpoint de login (slowapi) |
| CSRF | Middleware valida header `Origin` em todos os métodos de mutação |
| Isolamento de dados | Cada usuário acessa apenas seus próprios arquivos |
| Trilha de auditoria | Tabela `audit_logs` registra criação/exclusão de usuários, desbloqueios e operações sensíveis |
| Logging estruturado | JSON com timestamp, nível, módulo, função e contexto da requisição |
| TLS | Nginx com TLS 1.2/1.3, HSTS, X-Frame-Options DENY, X-Content-Type-Options |
| `/docs` | Desabilitado por padrão em produção (`ENABLE_DOCS=false`) |
| Hashes de senha | bcrypt |

### Variáveis de ambiente obrigatórias

Copie `.env.example` para `.env` e preencha **todos** os valores antes de subir:

```bash
cp .env.example .env
```

Gere chaves seguras com:

```bash
openssl rand -hex 32   # para SECRET_KEY
openssl rand -hex 32   # para ENCRYPTION_KEY (deve ser diferente)
```

A aplicação recusa subir se `SECRET_KEY` ou `ENCRYPTION_KEY` estiverem com os valores padrão do `.env.example`.

---

## Instalação

### Pré-requisitos

- Docker 24+ e Docker Compose v2
- Git
- Acesso à rede interna (para resolver `sslmanager.bsatech.local`)

### 1. Clonar o repositório

```bash
git clone <repositorio-interno>
cd ssl-certificate-manager
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env e preencher SECRET_KEY, ENCRYPTION_KEY, ADMIN_PASSWORD, POSTGRES_PASSWORD
```

### 3. Gerar o certificado TLS local

Siga o guia completo em [nginx/GERAR-CERTIFICADO.md](nginx/GERAR-CERTIFICADO.md).

Resumo:

```bash
mkdir -p nginx/certs
# Criar nginx/certs/san.conf conforme o guia
openssl req -x509 -newkey rsa:4096 \
  -keyout nginx/certs/sslmanager.bsatech.local.key \
  -out    nginx/certs/sslmanager.bsatech.local.crt \
  -days 1095 -nodes \
  -config nginx/certs/san.conf -extensions v3_req
```

### 4. Adicionar entrada no /etc/hosts (se necessário)

```bash
sudo sh -c 'echo "127.0.0.1  sslmanager.bsatech.local" >> /etc/hosts'
```

### 5. Subir o stack

```bash
docker compose up -d --build
```

### 6. Verificar saúde da aplicação

```bash
curl -sk https://sslmanager.bsatech.local/health
# {"status":"healthy","database":"ok"}
```

---

## Acesso e Gestão de Usuários

O registro público está desabilitado. Apenas administradores criam contas.

### Solicitar acesso

Abra um chamado no **GLPI** com:
- Nome completo
- E-mail corporativo
- Justificativa / projeto relacionado

Categoria: **DevOps / Certificados Digitais**

### Primeiro acesso

As credenciais iniciais são entregues pelo time de DevOps. No primeiro login a plataforma exige a troca de senha.

### Conta do administrador padrão

Definida em `.env` pelas variáveis `ADMIN_USERNAME` / `ADMIN_PASSWORD`. Altere antes do primeiro deploy.

---

## Comandos Operacionais

### Logs

```bash
# Todos os serviços
docker compose logs -f

# Apenas backend (logs JSON estruturados)
docker compose logs -f backend
```

### Backup

```bash
# Banco de dados
docker compose exec postgres pg_dump -U sslmanager sslmanager > backup_$(date +%F).sql

# Arquivos SSL (volume)
docker run --rm \
  -v ssl-certificate-manager_ssl_files:/data \
  -v $(pwd):/backup \
  alpine tar -czf /backup/ssl_files_$(date +%F).tar.gz -C /data .
```

### Restaurar banco de dados

```bash
cat backup_YYYY-MM-DD.sql | docker compose exec -T postgres psql -U sslmanager sslmanager
```

### Rebuild após atualizações

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

### Acesso ao banco (debug)

```bash
docker compose exec postgres psql -U sslmanager sslmanager
```

---

## Solução de Problemas

### Aplicação não sobe — variáveis inseguras

```
CRITICAL: SECRET_KEY está com valor padrão inseguro. Defina uma chave segura no .env.
```

Gere valores válidos com `openssl rand -hex 32` e atualize o `.env`.

### Certificado TLS não encontrado

```
nginx: [emerg] cannot load certificate "/etc/nginx/certs/sslmanager.bsatech.local.crt"
```

Siga o [nginx/GERAR-CERTIFICADO.md](nginx/GERAR-CERTIFICADO.md) para gerar os certificados locais.

### Conta bloqueada após tentativas incorretas

Acesse com uma conta admin e desbloqueie o usuário em **Administração → Usuários → Desbloquear**.

### Erro de importação de chave privada protegida por senha

Remova a senha antes de importar:

```bash
openssl rsa -in chave_com_senha.key -out chave_sem_senha.key
```

### Container do backend reiniciando

```bash
docker compose logs backend --tail=50
```

Verifique se o PostgreSQL subiu antes (`depends_on: postgres: condition: service_healthy`) e se as variáveis do `.env` estão corretas.

---

Mantido pelo time de DevOps — BSA Tech.
Dúvidas e incidentes: GLPI, categoria **DevOps / Certificados Digitais**.
