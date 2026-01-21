import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando a seed do banco...')

  // 1. Limpar banco (Deletar filhos primeiro para não dar erro de chave estrangeira)
  await prisma.comentario.deleteMany()
  await prisma.tarefa.deleteMany()
  await prisma.projeto.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.workspace.deleteMany()

  console.log('🧹 Banco limpo.')

  // 2. Criar Workspace
  const workspace = await prisma.workspace.create({
    data: {
      nome: 'Workspace Principal',
    }
  })

  // 3. Criar Usuários (Para testar filtros e responsaveis)
  const userAdmin = await prisma.usuario.create({
    data: { nome: 'Vinicius (Admin)', email: 'vinicius@admin.com', workspace_id: workspace.id }
  })
  
  const userDev = await prisma.usuario.create({
    data: { nome: 'Carlos (Dev)', email: 'carlos@dev.com', workspace_id: workspace.id }
  })

  const userDesign = await prisma.usuario.create({
    data: { nome: 'Ana (Design)', email: 'ana@design.com', workspace_id: workspace.id }
  })

  // 4. Criar Projetos
  const projDev = await prisma.projeto.create({
    data: {
      nome: 'Desenvolvimento do SaaS',
      descricao: 'Criação da plataforma de gestão estilo Asana.',
      workspace_id: workspace.id
    }
  })

  const projMkt = await prisma.projeto.create({
    data: {
      nome: 'Marketing e Lançamento',
      descricao: 'Campanhas de redes sociais e landing page.',
      workspace_id: workspace.id
    }
  })

  // Datas Dinâmicas (Para a seed sempre funcionar independente do dia que rodar)
  const hoje = new Date()
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)
  
  const semanaQueVem = new Date(hoje)
  semanaQueVem.setDate(semanaQueVem.getDate() + 7)

  const mesPassado = new Date(hoje)
  mesPassado.setDate(mesPassado.getDate() - 10)

  // 5. Criar Tarefas (Misturando Status, Prioridades e Datas)

  // --- TAREFAS DO PROJETO DEV ---
  
  // Tarefa 1: Atrasada e Feita
  await prisma.tarefa.create({
    data: {
      titulo: 'Configurar Ambiente Docker',
      descricao: 'Configurar containers do Postgres e Node.js para garantir ambiente igual para todos.',
      status: 'FEITO',
      prioridade: 'ALTA',
      dt_vencimento: mesPassado, // Venceu mês passado
      dt_conclusao: mesPassado,
      projeto_id: projDev.id,
      usuario_id: userAdmin.id // Vinicius fez
    }
  })

  // Tarefa 2: Urgente para Hoje (Vai aparecer na Sprint Semana)
  await prisma.tarefa.create({
    data: {
      titulo: 'Corrigir Bug na Autenticação',
      descricao: 'Usuários não conseguem logar se a senha tiver caracteres especiais. Urgente!',
      status: 'FAZENDO',
      prioridade: 'ALTA',
      dt_vencimento: hoje, // Vence hoje
      projeto_id: projDev.id,
      usuario_id: userDev.id // Carlos fazendo
    }
  })

  // Tarefa 3: Para Amanhã (Vai aparecer na Sprint Semana)
  await prisma.tarefa.create({
    data: {
      titulo: 'Criar Tela de Dashboard',
      descricao: 'Implementar os gráficos de barras e a lista de projetos recentes conforme o Figma.',
      status: 'PENDENTE',
      prioridade: 'MEDIA',
      dt_vencimento: amanha,
      projeto_id: projDev.id,
      usuario_id: userDev.id
    }
  })

  // --- TAREFAS DO PROJETO MARKETING ---

  // Tarefa 4: Design (Semana que vem - Testar Sprint Mês)
  await prisma.tarefa.create({
    data: {
      titulo: 'Criar Posts para Instagram',
      descricao: 'Pack com 5 posts carrossel sobre produtividade.',
      status: 'FAZENDO',
      prioridade: 'MEDIA',
      dt_vencimento: semanaQueVem,
      projeto_id: projMkt.id,
      usuario_id: userDesign.id
    }
  })

  // Tarefa 5: Backlog (Sem data e sem dono)
  await prisma.tarefa.create({
    data: {
      titulo: 'Pesquisar Concorrentes',
      descricao: 'Levantar funcionalidades do Trello e Jira para comparação.',
      status: 'PENDENTE',
      prioridade: 'BAIXA',
      dt_vencimento: null, // Sem data
      projeto_id: projMkt.id,
      usuario_id: null // Sem dono
    }
  })

  console.log('✅ Seed finalizada com sucesso!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })