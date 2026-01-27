import { prisma } from '@/lib/prisma'
import MinhasTarefasView from '@/components/MinhasTarefasView'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function MinhasTarefasPage() {
  const session = await auth()
  
  if (!session?.user?.email) redirect('/login')

  const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email }
  })

  if (!usuario) return <div>Usuário não encontrado.</div>

  const filtroTarefas = usuario.role === 'OWNER' ? {} : { usuario_id: usuario.id }

  const tarefas = await prisma.tarefa.findMany({
    where: filtroTarefas,
    orderBy: { dt_vencimento: 'asc' },
    include: {
      projeto: true, coluna: true, usuario: true,
      comentarios: { include: { usuario: true }, orderBy: { dt_insert: 'asc' } },
      prioridade: true, dificuldade: true
    }
  })

  const projetos = await prisma.projeto.findMany({ where: { workspace_id: usuario.workspace_id! }, orderBy: { nome: 'asc' } })
  const usuariosDoWorkspace = await prisma.usuario.findMany({ where: { workspace_id: usuario.workspace_id! } })

  return (
    // MUDANÇA 1: p-0 (ZERO padding). O layout pai já deu os 4px de borda.
    <div className="flex flex-col h-full bg-background p-0">
      
      {/* MUDANÇA 2: mb-2 (Margem mínima abaixo do título) */}
      <header className="mb-2 flex-shrink-0 flex justify-between items-end px-1">
        <div>
            <h1 className="text-lg lg:text-2xl font-bold text-foreground">
                {usuario.role === 'OWNER' ? 'Visão Geral (Admin)' : 'Minhas Tarefas'}
            </h1>
            {/* Texto menor e oculto em telas muito pequenas se precisar */}
            <p className="text-[10px] lg:text-sm text-text-muted leading-tight">
                {usuario.role === 'OWNER' ? 'Gerencie todas as tarefas.' : 'Suas pendências.'}
            </p>
        </div>
      </header>

      <div className="flex-1 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <MinhasTarefasView 
            tarefasIniciais={tarefas} 
            listaProjetos={projetos}
            usuarios={usuariosDoWorkspace}
            colunas={[]}
            agrupamento="PROJETO"
        />
      </div>
    </div>
  )
}