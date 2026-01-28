import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import MinhasTarefasView from '@/components/MinhasTarefasView'

// 1. FORÇA O NEXT A RECALCULAR A PÁGINA EM CADA ACESSO
// Sem isso, ele "congela" a data do último deploy.
export const dynamic = 'force-dynamic'
export const revalidate = 0

type SearchParams = { view?: string }

export default async function SprintPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const view = searchParams.view || 'semana';

  // 2. CORREÇÃO DE FUSO HORÁRIO (A "Mágica" do Brasil)
  // O servidor Vercel está em UTC (+0). Nós queremos UTC-3.
  const now = new Date();
  const offsetBrasil = -3; 
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const dataBrasil = new Date(utc + (3600000 * offsetBrasil));

  // Agora 'hoje' é realmente hoje no Brasil, não importa onde o servidor esteja.
  const hoje = new Date(dataBrasil);
  hoje.setHours(0, 0, 0, 0);

  let dataInicio = new Date(hoje);
  let dataFim = new Date(hoje);

  if (view === 'mes') {
    dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  } else {
    const diaSemana = hoje.getDay(); 
    dataInicio = new Date(hoje);
    dataInicio.setDate(hoje.getDate() - diaSemana);
    dataFim = new Date(hoje);
    dataFim.setDate(hoje.getDate() + (6 - diaSemana));
  }
  
  // Ajuste para UTC para consulta no banco (Banco sempre espera UTC)
  const dataInicioUTC = new Date(Date.UTC(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate()));
  const dataFimUTC = new Date(Date.UTC(dataFim.getFullYear(), dataFim.getMonth(), dataFim.getDate(), 23, 59, 59));

  const tarefas = await prisma.tarefa.findMany({
    where: { dt_vencimento: { gte: dataInicioUTC, lte: dataFimUTC } },
    orderBy: { dt_vencimento: 'asc' },
    include: {
      projeto: true, usuario: true, coluna: true,
      comentarios: { include: { usuario: true }, orderBy: { dt_insert: 'asc' } }
    }
  })

  const projetos = await prisma.projeto.findMany({ orderBy: { nome: 'asc' } })
  const usuarios = await prisma.usuario.findMany({ orderBy: { nome: 'asc' } })

  return (
    <div className="p-0 w-full h-screen flex flex-col">
      <header className="mb-2 flex-shrink-0 flex justify-between items-end px-1">
        <div>
            <h1 className="text-lg lg:text-2xl font-bold text-foreground flex items-center gap-2">
              Sprint Geral 🚀
            </h1>
            <p className="text-gray-500 text-[10px] lg:text-xs mt-0.5">
                <strong className="text-indigo-600 capitalize">{view}</strong> 
                <span className="ml-2 text-gray-400">
                    ({dataInicio.toLocaleDateString('pt-BR')} - {dataFim.toLocaleDateString('pt-BR')})
                </span>
            </p>
        </div>

        <div className="bg-surface border border-border p-0.5 rounded flex shadow-sm scale-90 origin-right">
            <Link 
                href="?view=semana" 
                className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${view === 'semana' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-surface/50'}`}
            >
                Semana
            </Link>
            <Link 
                href="?view=mes" 
                className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${view === 'mes' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-surface/50'}`}
            >
                Mês
            </Link>
        </div>
      </header>

      {/* Container principal (MinhasTarefasView) */}
      <div className="flex-1 overflow-hidden border border-border rounded-lg bg-surface shadow-sm">
          <MinhasTarefasView 
            tarefasIniciais={tarefas} 
            listaProjetos={projetos}
            usuarios={usuarios} 
            tituloPagina="Sprint Geral"
            enableCalendarNavigation={false} 
            // Passamos a data calculada aqui no servidor para o componente cliente
            initialCalendarDate={dataInicio}
            calendarViewMode={view === 'mes' ? 'MES' : 'SEMANA'} 
          />
      </div>
    </div>
  )
}