import { PrismaClient } from '@prisma/client'

// Na v6, basta instanciar vazio. Ele lê o .env automaticamente.
const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // Limpa o banco (ordem importa por causa das chaves estrangeiras)
  await prisma.tarefa.deleteMany()
  await prisma.projeto.deleteMany()
  await prisma.membroWorkspace.deleteMany()
  await prisma.workspace.deleteMany()
  await prisma.usuario.deleteMany()

  // Cria dados
  const usuario = await prisma.usuario.create({
    data: {
      nome: 'Admin',
      email: 'admin@admin.com',
      senha: '123'
    }
  })

  console.log(`Usuário criado: ${usuario.email}`)

  const workspace = await prisma.workspace.create({
    data: {
      nome: 'Workspace Principal',
      membros: {
        create: {
            usuario_id: usuario.id,
            papel: 'ADMIN'
        }
      }
    }
  })

  await prisma.projeto.create({
    data: {
      nome: 'Projeto Inicial',
      workspace_id: workspace.id,
      tarefas: {
        create: [
          { titulo: 'Ajustar Prisma', status: 'FEITO', prioridade: 'ALTA' },
          { titulo: 'Testar Seed', status: 'FAZENDO', prioridade: 'ALTA' }
        ]
      }
    }
  })

  console.log('Seed finalizado com sucesso!')
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