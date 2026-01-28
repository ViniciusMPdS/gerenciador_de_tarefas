import { prisma } from '@/lib/prisma'
import MinhasTarefasView from '@/components/MinhasTarefasView'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

// 1. OBRIGATÓRIO: Força a página a ser dinâmica (sem cache antigo)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MinhasTarefasPage() {
  const session = await auth()
  
  if (!session?.user?.email) redirect('/login')

  const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email }
  })

  if (!usuario) return <div>Usuário não encontrado.</div>

  // 2. CORREÇÃO DE FUSO HORÁRIO (Brasil UTC-3)
  // Garante que o calendário inicie no dia correto do Brasil
  const now = new Date();
  const offsetBrasil = -3; 
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const dataBrasil = new Date(utc + (3600000 * offsetBrasil));

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
    <div className="flex flex-col h-full bg-background p-0">
      
      <header className="mb-2 flex-shrink-0 flex justify-between items-end px-1">
        <div>
            <h1 className="text-lg lg:text-2xl font-bold text-foreground">
                {usuario.role === 'OWNER' ? 'Visão Geral (Admin)' : 'Minhas Tarefas'}
            </h1>
            <p className="text-[10px] lg:text-sm text-text-muted leading-tight">
                {usuario.role === 'OWNER' ? 'Gerencie todas as tarefas.' : 'Suas pendências.'}
            </p>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        <MinhasTarefasView 
            tarefasIniciais={tarefas} 
            listaProjetos={projetos}
            usuarios={usuariosDoWorkspace}
            colunas={[]}
            agrupamento="PROJETO"
            // 3. Passamos a data corrigida para o calendário iniciar certo
            initialCalendarDate={dataBrasil}
        />
      </div>
    </div>
  )
}