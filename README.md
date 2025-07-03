# SSL Certificate Manager 🔐

Uma aplicação web completa e moderna para gerenciamento de certificados SSL/TLS, chaves privadas, CSRs e arquivos PFX com interface intuitiva e gamificada.

## 🌟 Características Principais

- **Interface Moderna**: Dark theme com Material-UI e animações suaves
- **Totalmente Dockerizada**: Setup completo com um único comando
- **Segurança em Primeiro Lugar**: Autenticação JWT, senhas criptografadas
- **100% em Português**: Interface completamente localizada

## 🚀 Funcionalidades

### 🔑 Gerenciamento de Chaves Privadas
- ✅ Geração de chaves RSA 2048 bits
- ✅ Importação de chaves existentes (sem senha)
- ✅ Validação automática
- ✅ Download seguro

### 📜 Certificate Signing Requests (CSR)
- ✅ Geração com formulário intuitivo
- ✅ Suporte a certificados wildcard (*.dominio.com)
- ✅ Geração automática de chave privada correspondente
- ✅ Campos opcionais (email agora é opcional)

### 📦 Arquivos PFX/PKCS12
- ✅ Geração automatizada combinando certificado + chave + CA bundle
- ✅ Senhas seguras geradas automaticamente (25 caracteres)
- ✅ Visualização de senhas com proteção
- ✅ Sistema de cópia de senha com um clique

### 📋 Importação e Organização
- ✅ Upload de certificados e CA bundles via drag & drop
- ✅ Sistema de tags para organização
- ✅ Descrições personalizadas
- ✅ Busca avançada com filtros

### 🔍 Validação de Arquivos
- ✅ Validação sem armazenamento
- ✅ Suporte para arquivos existentes ou upload
- ✅ Detecção automática de tipo de arquivo
- ✅ Carregamento automático de senha para PFX
- ✅ Informações detalhadas sobre certificados

### 📊 Dashboard Inteligente
- ✅ Estatísticas em tempo real
- ✅ **Alertas de certificados expirando**
- ✅ Cards interativos com navegação direta
- ✅ Ações rápidas

### 🗂️ Gerenciamento de Arquivos
- ✅ Visualização por tipo com abas
- ✅ Busca por nome, descrição ou tags
- ✅ Download individual
- ✅ Exclusão com confirmação
- ✅ Contadores por tipo de arquivo

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.11** com **FastAPI**
- **PostgreSQL** para persistência
- **SQLAlchemy** ORM
- **Cryptography** e **PyOpenSSL**
- **JWT** para autenticação
- **Uvicorn** ASGI server

### Frontend
- **React 18** com **TypeScript**
- **Material-UI v5** para componentes
- **React Router v6** para navegação
- **Axios** para requisições HTTP
- **React Hook Form** para formulários
- **React Dropzone** para upload
- **React Toastify** para notificações

### Infraestrutura
- **Docker** e **Docker Compose**
- **Nginx** (opcional para produção)
- Volumes persistentes para dados

## 📦 Instalação e Execução

### Pré-requisitos
- Docker e Docker Compose instalados
- Git
- Porta 3000 (frontend) e 8000 (backend) livres

### Passo a Passo

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd ssl-certificate-manager
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite .env e altere a SECRET_KEY para produção
```

3. **Inicie a aplicação**
```bash
docker compose up -d
```

4. **Acesse a aplicação**
- Frontend: http://localhost:3000
- API: http://localhost:8000
- Documentação da API: http://localhost:8000/docs

## 🎯 Como Usar

### 1. Criar uma Conta
- Acesse http://localhost:3000
- Clique em "Não tem uma conta? Cadastre-se"
- Preencha email, usuário e senha

### 2. Fluxo Típico de Uso

#### Gerar um Certificado SSL:
1. **Gere ou importe uma chave privada**
   - Menu → "Gerar Chave Privada"
   - Ou importe uma existente (deve estar sem senha)

2. **Crie um CSR**
   - Menu → "Gerar CSR"
   - Preencha os dados da organização
   - Escolha entre certificado normal ou wildcard

3. **Envie o CSR para uma CA**
   - Faça download do CSR gerado
   - Envie para sua Autoridade Certificadora

4. **Importe o certificado recebido**
   - Menu → "Meus Arquivos" → "Importar Arquivo"
   - Importe o certificado (.crt)
   - Importe o CA Bundle/Intermediate

5. **Gere o PFX final**
   - Menu → "Gerar PFX"
   - Selecione certificado, CA bundle e chave privada
   - A senha será gerada automaticamente

### 3. Recursos Especiais

#### 🚨 Monitoramento de Validade
- O dashboard exibe alertas automáticos para certificados próximos do vencimento
- Certificados com menos de 30 dias aparecem em destaque
- Tags "URGENTE" para menos de 7 dias

#### 🔐 Gerenciamento de Senhas PFX
- Senhas são geradas com 25 caracteres (letras e números)
- Armazenadas de forma criptografada
- Podem ser copiadas com um clique
- Carregamento automático na validação

#### 🏷️ Organização com Tags
- Adicione tags aos seus arquivos
- Busque rapidamente por tags
- Útil para ambientes com muitos certificados

## 🔒 Segurança

### Recursos de Segurança
- ✅ Autenticação JWT com expiração configurável
- ✅ Senhas hasheadas com bcrypt
- ✅ Isolamento por usuário (cada usuário vê apenas seus arquivos)
- ✅ Validação de entrada em todos os endpoints
- ✅ Proteção contra injeção SQL via ORM
- ✅ CORS configurado

### Recomendações para Produção
1. **Altere a SECRET_KEY** no arquivo .env
2. **Use HTTPS** com certificado válido
3. **Configure um proxy reverso** (Nginx/Apache)
4. **Faça backup regular** dos volumes Docker
5. **Monitore logs** de acesso e erros
6. **Atualize dependências** regularmente

## 📝 Comandos Úteis

### Docker Compose
```bash
# Iniciar em modo detached
docker compose up -d

# Ver logs
docker compose logs -f

# Parar aplicação
docker compose down

# Limpar tudo (CUIDADO: apaga dados!)
docker compose down -v
```

### Backup
```bash
# Backup do banco de dados
docker compose exec postgres pg_dump -U sslmanager sslmanager > backup.sql

# Backup dos arquivos SSL
docker run --rm -v ssl-certificate-manager_ssl_files:/data -v $(pwd):/backup alpine tar -czf /backup/ssl_files_backup.tar.gz -C /data .
```

### Desenvolvimento
```bash
# Acessar container do backend
docker compose exec backend bash

# Acessar banco de dados
docker compose exec postgres psql -U sslmanager

# Rebuild após mudanças
docker compose build
docker compose up -d
```

## 🐛 Solução de Problemas

### Erro ao importar chave privada
- **Problema**: "A chave privada está protegida por senha"
- **Solução**: Remova a senha com:
  ```bash
  openssl rsa -in chave_com_senha.key -out chave_sem_senha.key
  ```

### Erro de CORS
- **Problema**: Bloqueio de CORS no navegador
- **Solução**: Verifique se está acessando por http://localhost:3000

### Container não inicia
- **Problema**: Portas em uso
- **Solução**: 
  ```bash
  # Verificar portas em uso
  sudo lsof -i :3000
  sudo lsof -i :8000
  ```

## 📊 Estrutura do Projeto

```
ssl-certificate-manager/
├── backend/
│   ├── app/
│   │   ├── main.py           # Aplicação FastAPI
│   │   ├── models.py         # Modelos SQLAlchemy
│   │   ├── schemas.py        # Schemas Pydantic
│   │   ├── routers/          # Endpoints da API
│   │   └── utils/            # Funções auxiliares
│   ├── requirements.txt      # Dependências Python
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           # Páginas React
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── contexts/        # Context API
│   │   └── App.tsx          # Componente principal
│   ├── package.json         # Dependências Node
│   └── Dockerfile
├── docker-compose.yml       # Orquestração dos containers
├── .env.example            # Exemplo de variáveis
└── README.md               # Este arquivo
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autor

- Alex Odilon - [@alex-odilon](https://github.com/alex-odilon)

## 🙏 Agradecimentos

- [FastAPI](https://fastapi.tiangolo.com/) pela excelente framework
- [Material-UI](https://mui.com/) pelos componentes React
- [Docker](https://www.docker.com/) pela containerização
- Comunidade open source pelos pacotes utilizados

---

Feito com ❤️ e ☕ por Alex Odilon