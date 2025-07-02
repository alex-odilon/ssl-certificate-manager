# SSL Certificate Manager

Uma aplicação web completa para gerenciamento de certificados SSL/TLS, chaves privadas, CSRs e arquivos PFX.

## 🚀 Funcionalidades

- **Autenticação de Usuários**: Sistema completo de login e cadastro
- **Geração de Chave Privada**: Crie chaves RSA 2048 bits
- **Geração de CSR**: Crie Certificate Signing Requests com suporte a wildcards
- **Geração de PFX**: Combine certificados, chaves e CA bundles em arquivos PFX protegidos por senha
- **Gerenciamento de Arquivos**: 
  - Upload e download de certificados, chaves e CA bundles
  - Sistema de tags e descrições para fácil organização
  - Busca e filtros avançados
- **Validação de Arquivos**: Valide certificados, chaves, CSRs e PFX
- **Dashboard**: Visualize estatísticas e acesse ações rápidas

## 🛠️ Tecnologias

### Backend
- Python 3.11
- FastAPI
- PostgreSQL
- SQLAlchemy
- Cryptography/PyOpenSSL
- JWT Authentication

### Frontend
- React 18 com TypeScript
- Material-UI
- React Router
- Axios
- React Hook Form

## 📦 Instalação e Execução

### Pré-requisitos
- Docker e Docker Compose instalados
- Git

### Passos

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd ssl-certificate-manager
```

2. Copie o arquivo de ambiente:
```bash
cp .env.example .env
```

3. Execute com Docker Compose:
```bash
docker compose up -d
```

4. Acesse a aplicação:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🔒 Segurança

### Senhas PFX
- As senhas dos arquivos PFX são geradas automaticamente com 25 caracteres
- Contêm letras maiúsculas, minúsculas e números (sem caracteres especiais)
- São armazenadas criptografadas no banco de dados
- São exibidas apenas uma vez após a criação
- Podem ser copiadas posteriormente através da interface

### Armazenamento
- Todos os arquivos são armazenados no servidor
- As chaves privadas não são expostas diretamente
- Sistema de permissões baseado em usuários

## 📱 Interface

### Páginas Principais

1. **Login/Cadastro**: Sistema de autenticação seguro
2. **Dashboard**: Visão geral com estatísticas e ações rápidas
3. **Gerar Chave Privada**: Interface simples para criar novas chaves
4. **Gerar CSR**: Formulário completo com suporte a wildcards
5. **Gerar PFX**: Combine arquivos existentes em um PFX
6. **Meus Arquivos**: Gerencie todos os seus arquivos com filtros e busca
7. **Validação**: Valide arquivos sem armazená-los

## 🎮 Recursos Gamificados

- Interface intuitiva com tooltips explicativos
- Feedback visual para todas as ações
- Animações suaves e transições
- Dashboard com cards interativos
- Sistema de tags coloridas

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
ssl-certificate-manager/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── utils/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── App.tsx
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

### Comandos Úteis

```bash
# Logs do backend
docker compose logs -f backend

# Logs do frontend
docker compose logs -f frontend

# Reiniciar serviços
docker compose restart

# Parar tudo
docker compose down

# Limpar tudo (incluindo volumes)
docker compose down -v
```

## 📝 Notas Importantes

1. **Produção**: Altere a `SECRET_KEY` no arquivo `.env` antes de usar em produção
2. **Backup**: Faça backup regular do volume `postgres_data` e `ssl_files`
3. **HTTPS**: Em produção, use HTTPS para proteger a transmissão de dados sensíveis

## 🤝 Contribuindo

Sinta-se à vontade para abrir issues e pull requests!

## 📄 Licença

Este projeto está sob a licença MIT.