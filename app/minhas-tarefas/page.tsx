import { prisma } from '@/lib/prisma'
import MinhasTarefasView from '@/components/MinhasTarefasView'

export default async function MinhasTarefasPage() {
  const usuario = await prisma.usuario.findFirst()

  if (!usuario) {
    return <div className="p-8">Usuário não encontrado.</div>
  }

  // 1. Busca TODAS as tarefas do usuário (Pendentes E Concluídas)
  const tarefas = await prisma.tarefa.findMany({
    where: {
      usuario_id: usuario.id,
    },
    orderBy: { dt_vencimento: 'asc' },
    include: {
      projeto: true,
      coluna: true,
      // ADICIONE ESTA LINHA:
      comentarios: { include: { usuario: true }, orderBy: { dt_insert: 'asc' } }
    }
  })

  // 2. Projetos
  const projetos = await prisma.projeto.findMany({
    orderBy: { nome: 'asc' }
  })

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-screen flex flex-col">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-900">Minhas Tarefas</h1>
        <p className="text-gray-500 mt-1">Gerencie suas pendências em Lista ou Quadro.</p>
      </header>

      <MinhasTarefasView 
        tarefasIniciais={tarefas} 
        listaProjetos={projetos}
        usuarios={[]} 
      />
    </div>
  )
}