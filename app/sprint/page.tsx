import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import MinhasTarefasView from '@/components/MinhasTarefasView'

type SearchParams = {
  view?: string;
}

export default async function SprintPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const view = searchParams.view || 'semana'; // 'semana' ou 'mes'

  const hoje = new Date();
  let dataInicio = new Date();
  let dataFim = new Date();

  hoje.setHours(0, 0, 0, 0);

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
  
  const dataInicioUTC = new Date(Date.UTC(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate()));
  const dataFimUTC = new Date(Date.UTC(dataFim.getFullYear(), dataFim.getMonth(), dataFim.getDate(), 23, 59, 59));

  const tarefas = await prisma.tarefa.findMany({
    where: {
      dt_vencimento: {
        gte: dataInicioUTC,
        lte: dataFimUTC
      }
    },
    orderBy: { dt_vencimento: 'asc' },
    include: {
      projeto: true,
      usuario: true, 
      coluna: true,
      comentarios: { include: { usuario: true }, orderBy: { dt_insert: 'asc' } }
    }
  })

  const projetos = await prisma.projeto.findMany({ orderBy: { nome: 'asc' } })
  const usuarios = await prisma.usuario.findMany({ orderBy: { nome: 'asc' } })

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-screen flex flex-col">
      <header className="mb-6 flex-shrink-0 flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-bold text-foreground">Sprint Geral 🚀</h1>
            <p className="text-gray-500 mt-1">
                Visão de tarefas para: <strong className="text-indigo-600 capitalize">{view}</strong> 
                <span className="text-xs ml-2 text-gray-400">
                    ({dataInicio.toLocaleDateString('pt-BR')} - {dataFim.toLocaleDateString('pt-BR')})
                </span>
            </p>
        </div>

        <div className="bg-surface border border-border p-1 rounded-lg flex shadow-sm">
            <Link 
                href="?view=semana" 
                className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${view === 'semana' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-surface/50'}`}
            >
                Semana
            </Link>
            <Link 
                href="?view=mes" 
                className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${view === 'mes' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-surface/50'}`}
            >
                Mês
            </Link>
        </div>
      </header>

      <MinhasTarefasView 
        tarefasIniciais={tarefas} 
        listaProjetos={projetos}
        usuarios={usuarios} 
        tituloPagina="Sprint Geral"
        
        // CONFIG SPRINT:
        enableCalendarNavigation={false} 
        initialCalendarDate={dataInicio}
        
        // CONFLITO RESOLVIDO: O Calendário obedece à URL da Sprint
        calendarViewMode={view === 'mes' ? 'MES' : 'SEMANA'} 
      />
    </div>
  )
}