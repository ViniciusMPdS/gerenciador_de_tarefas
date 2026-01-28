import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DashboardTarefas from '@/components/DashboardTarefas'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

// 1. FORÇA O NEXT A NÃO FAZER CACHE (CRÍTICO PARA DATAS)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/login')
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: session.user.email }
  })
  
  // --- CORREÇÃO DE FUSO HORÁRIO (A MÁGICA) ---
  // O servidor está em UTC (+0). O Brasil está em UTC-3.
  // Vamos criar uma data "virtual" que representa a hora atual no Brasil.
  const now = new Date();
  const offsetBrasil = -3; 
  // Pega o tempo em milissegundos UTC
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  // Aplica -3 horas
  const dataBrasil = new Date(utc + (3600000 * offsetBrasil));

  // AGORA USAMOS A 'dataBrasil' PARA TUDO
  const horaAtual = dataBrasil.getHours();
  const saudacao = horaAtual < 12 ? 'Bom dia' : (horaAtual < 18 ? 'Boa tarde' : 'Boa noite');

  let minhasTarefas: any[] = []

  if (usuario) {
    // Para filtrar tarefas, queremos o começo do dia (00:00:00) no Brasil
    const hojeBrasil = new Date(dataBrasil);
    hojeBrasil.setHours(0, 0, 0, 0);

    // Converte para UTC para bater com o banco de dados (que salva em UTC)
    // Ex: 00:00 Brasil -> 03:00 UTC
    const hojeUTC = new Date(Date.UTC(hojeBrasil.getFullYear(), hojeBrasil.getMonth(), hojeBrasil.getDate(), 3, 0, 0));

    // Busca ATRASADAS (Menor que hoje 03:00 UTC)
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

    // Busca FUTURAS/HOJE (Maior ou igual a hoje 03:00 UTC)
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
    // Mantive o layout compacto que fizemos antes
    <div className="p-2 lg:p-8 max-w-full lg:max-w-7xl mx-auto min-h-screen">
      
      <header className="mb-4 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          {saudacao}, {usuario ? usuario.nome.split(' ')[0] : 'Visitante'}!
        </h1>
        <p className="text-gray-500 text-xs lg:text-sm mt-1">
           Aqui está o resumo do seu dia. 
           {/* (Opcional: Debug para ver se a hora está certa na Vercel) */}
           {/* <span className="ml-2 text-[10px] opacity-50">Brasília: {dataBrasil.toLocaleTimeString()}</span> */}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-start">
        <DashboardTarefas tarefas={minhasTarefas} usuarioNome={usuario?.nome || 'Eu'} />

        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 lg:p-5 border-b border-gray-100 flex flex-col gap-3 lg:gap-4 bg-surface/50 min-h-[80px] lg:min-h-[105px] justify-center">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm lg:text-base">📂</div>
                        <h2 className="font-bold text-foreground text-sm lg:text-base">Projetos Recentes</h2>
                    </div>
                    <Link href="/projetos" className="text-[10px] lg:text-xs font-medium text-gray-400 hover:text-indigo-600">Ver biblioteca</Link>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 lg:p-4">
                 {projetosRecentes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="text-4xl mb-2">📭</span>
                        <p className="text-xs lg:text-sm">Nenhum projeto acessado recentemente.</p>
                        <Link href="/projetos" className="text-xs text-indigo-500 mt-2 hover:underline">Ir para Biblioteca</Link>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
                        {projetosRecentes.map(projeto => (
                        <Link key={projeto.id} href={`/projeto/${projeto.id}`} className="flex flex-col justify-center p-3 lg:p-4 rounded-xl bg-surface border border-border shadow-sm hover:shadow-md hover:border-indigo-300 transition-all h-24 lg:h-28 group">
                            <div className="flex items-center gap-2 lg:gap-3 mb-1 lg:mb-2">
                                <div className="w-6 h-6 lg:w-8 lg:h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs lg:text-sm flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    {projeto.nome.substring(0, 1).toUpperCase()}
                                </div>
                                <h3 className="font-bold text-foreground text-xs lg:text-sm truncate w-full" title={projeto.nome}>{projeto.nome}</h3>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                                <p className="text-[10px] text-gray-400">
                                    {new Date(projeto.dt_acesso).toDateString() === new Date().toDateString() ? 'Hoje' : new Date(projeto.dt_acesso).toLocaleDateString()}
                                </p>
                                <span className="text-[9px] lg:text-[10px] bg-surface/50 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">{projeto._count.tarefas}</span>
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