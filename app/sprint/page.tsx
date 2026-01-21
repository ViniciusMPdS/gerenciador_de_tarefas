import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import TarefaViewManager from '@/components/TarefaViewManager';

type SearchParams = {
  view?: string; 
  projeto?: string; 
};

export default async function SprintPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const view = searchParams.view || 'semana'; 
  const projetoFiltro = searchParams.projeto || undefined;

  const hoje = new Date();
  let dataInicio = new Date();
  let dataFim = new Date();

  if (view === 'mes') {
    dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  } else {
    const diaSemana = hoje.getDay(); 
    dataInicio.setDate(hoje.getDate() - diaSemana);
    dataFim.setDate(hoje.getDate() + (6 - diaSemana));
  }
  
  dataInicio.setHours(0, 0, 0, 0);
  dataFim.setHours(23, 59, 59, 999);

  const tarefas = await prisma.tarefa.findMany({
    where: {
      projeto_id: projetoFiltro,
      OR: [
        { dt_vencimento: { gte: dataInicio, lte: dataFim } }, 
        { status: 'FAZENDO' } 
      ]
    },
    include: { projeto: true, usuario: true },
    orderBy: { dt_vencimento: 'asc' }
  });

  const projetos = await prisma.projeto.findMany();
  
  // NOVO: Buscamos usuários para o modal funcionar
  const usuarios = await prisma.usuario.findMany(); 

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto min-h-screen">
      <header className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sprint Geral</h1>
        <p className="text-gray-500">
          Acompanhe o que está rolando {view === 'mes' ? 'neste mês' : 'nesta semana'}.
        </p>
      </header>

      {/* BARRA DE FILTROS (Mantenha igual) */}
      <div className="flex flex-wrap gap-4 mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-center">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <Link 
            href={`/sprint?view=semana${projetoFiltro ? `&projeto=${projetoFiltro}` : ''}`}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'semana' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Semana
          </Link>
          <Link 
            href={`/sprint?view=mes${projetoFiltro ? `&projeto=${projetoFiltro}` : ''}`}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'mes' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Mês
          </Link>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <Link 
            href={`/sprint?view=${view}`} 
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${!projetoFiltro ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            Todos
          </Link>
          {projetos.map(p => (
            <Link 
              key={p.id}
              href={`/sprint?view=${view}&projeto=${p.id}`} 
              className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${projetoFiltro === p.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {p.nome}
            </Link>
          ))}
        </div>
      </div>

      {/* RESULTADOS */}
      <div className="mt-6">
        {/* Passamos todas as tarefas e usuários para o gerenciador cuidar da visualização */}
        <TarefaViewManager tarefas={tarefas} usuarios={usuarios} />
      </div>
    </div>
  );
}