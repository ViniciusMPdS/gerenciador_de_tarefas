const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
  const NOME_CLIENTE = process.env.CLIENT_NAME || 'Minha Empresa'
  const EMAIL_ADMIN = 'viniciusm1351@gmail.com'
  const SENHA_PADRAO = 'Vm0906.,'

  console.log(`🌱 Iniciando seed Limpo para: ${NOME_CLIENTE}...`)

  // 1. WORKSPACE
  let workspace = await prisma.workspace.findFirst()
  if (!workspace) {
    console.log(`🏢 Criando workspace...`)
    workspace = await prisma.workspace.create({
      data: { nome: NOME_CLIENTE }
    })
  }

  // --- NOVO: Popula Prioridades (1 a 3) ---
  console.log(`📊 Criando Prioridades...`)
  const prioridades = [
    { id: 1, nome: 'Baixa' },
    { id: 2, nome: 'Média' },
    { id: 3, nome: 'Alta' },
  ]
  for (const p of prioridades) {
    await prisma.opcaoPrioridade.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    })
  }

  // --- NOVO: Popula Dificuldades (1 a 5) ---
  console.log(`🧠 Criando Dificuldades...`)
  const dificuldades = [
    { id: 1, nome: 'Muito Fácil' },
    { id: 2, nome: 'Fácil' },
    { id: 3, nome: 'Média' },
    { id: 4, nome: 'Difícil' },
    { id: 5, nome: 'Muito Difícil' },
  ]
  for (const d of dificuldades) {
    await prisma.opcaoDificuldade.upsert({
      where: { id: d.id },
      update: {},
      create: d,
    })
  }

  // 2. ADMIN
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10)
  
  const admin = await prisma.usuario.upsert({
    where: { email: EMAIL_ADMIN },
    update: {
      senha: senhaHash,
      role: 'OWNER',
      ativo: true,
      workspace_id: workspace.id
    },
    create: {
      email: EMAIL_ADMIN,
      nome: 'Administrador',
      senha: senhaHash,
      role: 'OWNER',
      cargo: 'Gestor',
      ativo: true,
      workspace_id: workspace.id,
      imagem: null
    },
  })

  console.log(`✅ Seed finalizado!`)
  console.log(`Login: ${EMAIL_ADMIN}`)
  console.log(`Senha: ${SENHA_PADRAO}`)
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })