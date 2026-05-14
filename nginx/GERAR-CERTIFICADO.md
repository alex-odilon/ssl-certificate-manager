# Geração de Certificado Auto Assinado — sslmanager.bsatech.local

## Pré-requisitos

- `openssl` instalado (Linux/macOS: já vem instalado; Windows: instale via [Win32/Win64 OpenSSL](https://slproweb.com/products/Win32OpenSSL.html) ou use WSL)
- Executar os comandos a partir da raiz do projeto

---

## Passo 1 — Criar a pasta de certificados

```bash
mkdir -p nginx/certs
```

---

## Passo 2 — Criar o arquivo de configuração SAN

Crie o arquivo `nginx/certs/san.conf` com o conteúdo abaixo.
O bloco `[alt_names]` define os nomes alternativos (Subject Alternative Names) aceitos pelo certificado.

```ini
[req]
default_bits       = 4096
prompt             = no
default_md         = sha256
distinguished_name = dn
x509_extensions    = v3_req

[dn]
C  = BR
ST = São Paulo
L  = São Paulo
O  = BSA Tech
OU = TI
CN = sslmanager.bsatech.local

[v3_req]
subjectAltName = @alt_names
keyUsage       = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = sslmanager.bsatech.local
DNS.2 = localhost
IP.1  = 127.0.0.1
```

> Ajuste `C`, `ST`, `L`, `O`, `OU` conforme necessário.

---

## Passo 3 — Gerar chave privada e certificado

```bash
openssl req -x509 -newkey rsa:4096 \
  -keyout nginx/certs/sslmanager.bsatech.local.key \
  -out    nginx/certs/sslmanager.bsatech.local.crt \
  -days   1095 \
  -nodes \
  -config nginx/certs/san.conf \
  -extensions v3_req
```

| Parâmetro | Significado |
|-----------|-------------|
| `-x509`   | Gera certificado auto assinado (sem CSR separado) |
| `-newkey rsa:4096` | Cria nova chave RSA de 4096 bits |
| `-nodes`  | Sem senha na chave privada (necessário para o nginx ler sem interação) |
| `-days 1095` | Validade de 3 anos |
| `-extensions v3_req` | Aplica os SANs definidos em `san.conf` |

Após executar você verá dois arquivos em `nginx/certs/`:
- `sslmanager.bsatech.local.crt` — certificado público
- `sslmanager.bsatech.local.key` — chave privada (manter seguro, nunca commitar)

---

## Passo 4 — Verificar o certificado gerado

```bash
openssl x509 -in nginx/certs/sslmanager.bsatech.local.crt -text -noout | grep -A5 "Subject Alternative"
```

A saída deve mostrar:
```
X509v3 Subject Alternative Names:
    DNS:sslmanager.bsatech.local, DNS:localhost, IP Address:127.0.0.1
```

---

## Passo 5 — Adicionar o domínio ao arquivo hosts

Para que o navegador resolva `sslmanager.bsatech.local` para a máquina local:

**Linux / macOS:**
```bash
sudo sh -c 'echo "127.0.0.1  sslmanager.bsatech.local" >> /etc/hosts'
```

**Windows** (execute o Bloco de Notas como Administrador e edite):
```
C:\Windows\System32\drivers\etc\hosts
```
Adicione a linha:
```
127.0.0.1  sslmanager.bsatech.local
```

---

## Passo 6 — Confiar no certificado (opcional, mas recomendado)

Sem este passo o navegador exibirá aviso de "certificado não confiável".

**macOS:**
```bash
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain \
  nginx/certs/sslmanager.bsatech.local.crt
```

**Linux — Rocky / RHEL / AlmaLinux / CentOS:**
```bash
sudo cp nginx/certs/sslmanager.bsatech.local.crt /etc/pki/ca-trust/source/anchors/
sudo update-ca-trust extract
# verificar:
trust list | grep sslmanager
```

**Linux — Ubuntu / Debian:**
```bash
sudo cp nginx/certs/sslmanager.bsatech.local.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

**Windows:**
Clique duplo no arquivo `.crt` → "Instalar Certificado" → "Computador Local" → "Autoridades de Certificação Raiz Confiáveis".

---

## Passo 7 — Subir o stack com nginx

Certifique-se de que o serviço nginx está no `docker-compose.yml` e suba:

```bash
docker compose up -d --build
```

Acesse: **https://sslmanager.bsatech.local**

---

## Renovar o certificado

O certificado expira em 3 anos. Para renovar, basta repetir o **Passo 3**:

```bash
openssl req -x509 -newkey rsa:4096 \
  -keyout nginx/certs/sslmanager.bsatech.local.key \
  -out    nginx/certs/sslmanager.bsatech.local.crt \
  -days   1095 -nodes \
  -config nginx/certs/san.conf \
  -extensions v3_req

docker compose restart nginx
```

---

## Arquivos gerados (não commitar)

Adicione ao `.gitignore`:

```
nginx/certs/*.key
nginx/certs/*.crt
```
