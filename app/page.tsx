import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DashboardTarefas from '@/components/DashboardTarefas'
import { auth } from '@/auth' // Importe o auth
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()

  // Se não tiver sessão (por segurança), manda pro login
  if (!session?.user?.email) {
    redirect('/login')
  }

  // BUSCA O USUÁRIO PELO EMAIL DA SESSÃO
  const usuario = await prisma.usuario.findUnique({
    where: { email: session.user.email }
  })
  
  const saudacao = new Date().getHours() < 12 ? 'Bom dia' : 'Boa tarde'
  
  let minhasTarefas: any[] = []

  if (usuario) {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    // --- CORREÇÃO DE FUSO NO SERVIDOR (PRISMA) ---
    // O Prisma envia datas em UTC. Se filtrarmos pela meia-noite local (Brasil),
    // estamos filtrando por 03:00 UTC, perdendo tudo que está marcado como 00:00 UTC (Tarefas de hoje).
    // Solução: Criamos uma data que representa a meia-noite UTC absoluta do dia de hoje.
    const hojeUTC = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));

    // 1. Busca ATRASADAS (Estritamente menores que hoje UTC)
    const atrasadas = await prisma.tarefa.findMany({
      where: { 
        usuario_id: usuario.id,
        concluida: false,
        dt_vencimento: { lt: hojeUTC } 
      },
      take: 50, 
      orderBy: { dt_vencimento: 'asc' },
      include: { projeto: true }
    })

    // 2. Busca FUTURAS (Maiores ou iguais a hoje UTC - Isso inclui o 00:00:00 de hoje)
    const futuras = await prisma.tarefa.findMany({
      where: { 
        usuario_id: usuario.id,
        concluida: false,
        dt_vencimento: { gte: hojeUTC } 
      },
      take: 50, 
      orderBy: { dt_vencimento: 'asc' },
      include: { projeto: true }
    })

    minhasTarefas = [...atrasadas, ...futuras]
  }

  const projetosRecentes = await prisma.projeto.findMany({
    orderBy: { dt_acesso: 'desc' },
    take: 6,
    include: { _count: { select: { tarefas: true } } }
  })

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {saudacao}, {usuario ? usuario.nome.split(' ')[0] : 'Visitante'}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">Aqui está o resumo do seu dia.</p>
      </header>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* ESQUERDA: WIDGET DE TAREFAS */}
        <DashboardTarefas tarefas={minhasTarefas} usuarioNome={usuario?.nome || 'Eu'} />

        {/* DIREITA: WIDGET DE PROJETOS RECENTES */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-[500px]">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex flex-col gap-4 bg-surface/50/50 min-h-[105px] justify-center">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                           📂
                        </div>
                        <h2 className="font-bold text-foreground">Projetos Recentes</h2>
                    </div>
                    <Link href="/projetos" className="text-xs font-medium text-gray-400 hover:text-indigo-600">Ver biblioteca</Link>
                </div>
            </div>

            {/* Conteúdo Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                 
                 {projetosRecentes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="text-4xl mb-2">📭</span>
                        <p className="text-sm">Nenhum projeto acessado recentemente.</p>
                        <Link href="/projetos" className="text-xs text-indigo-500 mt-2 hover:underline">Ir para Biblioteca</Link>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {projetosRecentes.map(projeto => (
                        <Link 
                            key={projeto.id} 
                            href={`/projeto/${projeto.id}`}
                            className="flex flex-col justify-center p-4 rounded-xl bg-surface border border-border shadow-sm hover:shadow-md hover:border-indigo-300 transition-all h-28 group"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    {projeto.nome.substring(0, 1).toUpperCase()}
                                </div>
                                <h3 className="font-bold text-foreground text-sm truncate w-full" title={projeto.nome}>{projeto.nome}</h3>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                                <p className="text-[10px] text-gray-400">
                                    {new Date(projeto.dt_acesso).toDateString() === new Date().toDateString() 
                                        ? 'Acessado hoje' 
                                        : new Date(projeto.dt_acesso).toLocaleDateString()}
                                </p>
                                <span className="text-[10px] bg-surface/50 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                                    {projeto._count.tarefas} tarefas
                                </span>
                            </div>
                        </Link>
                        ))}
                    </div>
                 )}
            </div>
        </div>

      </div>
    </div>
  )
}