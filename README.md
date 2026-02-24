# Gerenciador de Tarefas

Sistema de gerenciamento de projetos e tarefas desenvolvido para organizar fluxos de trabalho com foco em praticidade.

## 🚀 Funcionalidades

* **Quadro Kanban:** Criação de projetos, colunas personalizadas e gestão de tarefas.
* **Dashboards:** Visualização de métricas, indicadores de desempenho e progresso dos projetos em tempo real.
* **Comentários com Anexos:** Cole prints diretamente nos comentários das tarefas usando `CTRL+V` (com visualizador nativo).
* **Gestão de Usuários:** Controle de permissões onde o perfil `OWNER` pode inativar usuários e alterar senhas da equipe.
* **Auditoria:** Histórico automático de alterações nas tarefas (datas, status, responsáveis e anexos).
* **Segurança:** Uso de UUIDs no banco de dados e senhas criptografadas.

## 💻 Tecnologias

* **Front-end:** Next.js (App Router), Tailwind CSS, Lucide Icons
* **Back-end:** Next.js Server Actions, NextAuth.js
* **Banco de Dados:** PostgreSQL (Neon Serverless) + Prisma ORM
* **Storage:** UploadThing (para imagens e anexos)

## ⚙️ Como rodar o projeto

1. **Clone o repositório e instale as dependências:**
   ```bash
   git clone https://github.com/ViniciusMPdS/gerenciador_de_tarefas.git
   cd gerenciador_de_tarefas
   npm install

2. **Configure as variáveis de ambiente:**
- Crie um arquivo .env na raiz do projeto com as chaves abaixo:
    ```
    DATABASE_URL="sua_url_do_banco_neon"
    AUTH_SECRET="seu_secret_do_nextauth"
    UPLOADTHING_TOKEN="seu_token_do_uploadthing"

3. **Prepare o Banco de Dados e inicie o app:**
    ```bash
    npx prisma db push
    npm run dev

Acesse http://localhost:3000 no navegador.
