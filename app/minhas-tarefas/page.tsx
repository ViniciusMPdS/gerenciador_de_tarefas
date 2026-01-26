import { prisma } from '@/lib/prisma'
import MinhasTarefasView from '@/components/MinhasTarefasView'
import { auth } from '@/auth' // Importe o auth para pegar a sessão atual
import { redirect } from 'next/navigation'

export default async function MinhasTarefasPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
      redirect('/login')
  }

  // 1. Busca o usuário logado para saber quem ele é (Role)
  const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email }
  })

  if (!usuario) {
    return <div className="p-8">Usuário não encontrado.</div>
  }

  // 2. DEFINE O FILTRO
  // Se for OWNER (Dono), vê tudo (objeto vazio {}). 
  // Se for MEMBER, vê só as dele ({ usuario_id: ... }).
  const filtroTarefas = usuario.role === 'OWNER' 
      ? {} 
      : { usuario_id: usuario.id }

  // 3. Busca as tarefas usando o filtro
  const tarefas = await prisma.tarefa.findMany({
    where: filtroTarefas, // <--- AQUI ESTÁ A MUDANÇA
    orderBy: { dt_vencimento: 'asc' },
    include: {
      projeto: true,
      coluna: true,
      usuario: true, // Importante para ver de quem é a tarefa na "Visão de Deus"
      comentarios: { include: { usuario: true }, orderBy: { dt_insert: 'asc' } },
      prioridade: true,   // Garante trazer os dados da tabela relacional
      dificuldade: true   // Garante trazer os dados da tabela relacional
    }
  })

  // 4. Projetos (Para montar as colunas do Kanban)
  const projetos = await prisma.projeto.findMany({
    where: { workspace_id: usuario.workspace_id! },
    orderBy: { nome: 'asc' }
  })

  // 5. Busca usuários (Para você poder reatribuir no filtro)
  const usuariosDoWorkspace = await prisma.usuario.findMany({
      where: { workspace_id: usuario.workspace_id! }
  })

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <header className="mb-6 flex-shrink-0 flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-bold text-foreground">
                {usuario.role === 'OWNER' ? 'Visão Geral (Admin)' : 'Minhas Tarefas'}
            </h1>
            <p className="text-text-muted mt-1">
                {usuario.role === 'OWNER' 
                    ? 'Gerencie todas as tarefas de todos os projetos.' 
                    : 'Gerencie suas pendências e prazos.'}
            </p>
        </div>
      </header>

      <div className="flex-1 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <MinhasTarefasView 
            tarefasIniciais={tarefas} 
            listaProjetos={projetos}
            usuarios={usuariosDoWorkspace} // Passamos todos para o Admin filtrar
            colunas={[]} // No modo "Por Projeto", não precisa disso
            agrupamento="PROJETO" // Força o modo Kanban por Projeto
        />
      </div>
    </div>
  )
}