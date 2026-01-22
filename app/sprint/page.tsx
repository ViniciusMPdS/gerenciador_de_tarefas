import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import TarefaViewManager from '@/components/TarefaViewManager';
import FiltroSprint from '@/components/FiltroSprint';

type SearchParams = {
  view?: string; 
  projetos?: string; 
  usuarios?: string; 
  status?: string;   
};

export default async function SprintPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const view = searchParams.view || 'semana';
  
  const projetosIds = searchParams.projetos ? searchParams.projetos.split(',') : undefined;
  const usuariosIds = searchParams.usuarios ? searchParams.usuarios.split(',') : undefined;
  const statusFiltro = searchParams.status || 'TODOS';

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

  const whereClause: any = {
    projeto_id: projetosIds ? { in: projetosIds } : undefined,
    usuario_id: usuariosIds ? { in: usuariosIds } : undefined,
  }

  if (statusFiltro === 'FEITO') {
    whereClause.concluida = true;
  } else if (statusFiltro === 'PENDENTE') {
    whereClause.concluida = false;
  }

  if (statusFiltro === 'TODOS' || statusFiltro === 'PENDENTE') {
      whereClause.dt_vencimento = { 
        gte: dataInicio, 
        lte: dataFim 
      };
  }

  const tarefas = await prisma.tarefa.findMany({
    where: whereClause,
    include: { 
      projeto: true, 
      usuario: true,
      coluna: true 
    },
    orderBy: { dt_vencimento: 'asc' }
  });

  const projetos = await prisma.projeto.findMany({ orderBy: { nome: 'asc' }});
  const usuarios = await prisma.usuario.findMany({ orderBy: { nome: 'asc' }});
  
  // Buscamos todas as colunas para manter a consistência visual (Mapeamento, Expedição...)
  const todasColunas = await prisma.coluna.findMany({ orderBy: { nome: 'asc' } });

  return (
    // MUDANÇA 1: h-screen e flex-col para travar a altura na tela
    <div className="flex flex-col h-screen bg-[#F9F9F9] overflow-hidden">
      
      {/* HEADER (Fixo) */}
      <header className="flex-shrink-0 px-8 py-6 border-b border-gray-200 bg-white flex justify-between items-end z-20">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 mb-1">Sprint Geral</h1>
           <p className="text-gray-500 text-sm">
             Visão global das tarefas {view === 'mes' ? 'do mês' : 'da semana'}.
           </p>
        </div>
        
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <Link href="?view=semana" className={`px-3 py-1 text-xs font-medium rounded transition-all ${view === 'semana' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Semana</Link>
          <Link href="?view=mes" className={`px-3 py-1 text-xs font-medium rounded transition-all ${view === 'mes' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Mês</Link>
        </div>
      </header>

      {/* FILTROS (Fixo) */}
      <div className="flex-shrink-0 px-8 py-4 bg-gray-50/50 border-b border-gray-200 z-10">
        <FiltroSprint projetos={projetos} usuarios={usuarios} />
      </div>

      {/* ÁREA DE CONTEÚDO (Flex-1 para ocupar o resto e overflow-hidden para o scroll ser interno) */}
      <div className="flex-1 overflow-hidden p-8">
        <TarefaViewManager 
          tarefas={tarefas} 
          usuarios={usuarios} 
          todasColunas={todasColunas}
          mostrarVazias={true} // Se quiser ver todas as colunas mesmo vazias na sprint
        />
      </div>
    </div>
  );
}