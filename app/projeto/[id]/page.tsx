import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BotaoNovaTarefa from '@/components/BotaoNovaTarefa';
import CardKanban from '@/components/CardKanban'; 

async function getProjetoDetalhes(id: string) {
  const projeto = await prisma.projeto.findUnique({
    where: { id },
    include: { 
      tarefas: { 
        include: { 
          usuario: true, // Dono da tarefa
          comentarios: { // <--- NOVO: Incluir comentários
            include: { usuario: true }, // Incluir quem comentou
            orderBy: { dt_insert: 'asc' } // Mais antigos primeiro
          }
        }, 
        orderBy: { dt_insert: 'desc' }
      } 
    }, 
  });
  return projeto;
}

// Nova função para buscar todos usuários do Workspace
async function getUsuariosWorkspace(workspaceId: string) {
  return await prisma.usuario.findMany({
    where: { workspace_id: workspaceId }
  })
}

export default async function ProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const projeto = await getProjetoDetalhes(id);
  if (!projeto) return notFound();

  // Buscamos os usuários para passar para o dropdown de edição
  const usuarios = await getUsuariosWorkspace(projeto.workspace_id);

  const pendentes = projeto.tarefas.filter(t => t.status === 'PENDENTE');
  const fazendo = projeto.tarefas.filter(t => t.status === 'FAZENDO');
  const feitas = projeto.tarefas.filter(t => t.status === 'FEITO');

  return (
    <div className="h-full flex flex-col bg-white min-h-screen">
      <header className="px-8 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{projeto.nome}</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Status: Ativo
            </p>
          </div>
        </div>
        
        {/* Passamos usuários para o Botão Novo também, caso queira atualizar ele depois */}
        <BotaoNovaTarefa projetoId={id} />
      </header>

      <div className="flex-1 overflow-x-auto p-8 bg-gray-50/30">
        <div className="flex h-full gap-6 min-w-max items-start">
          
          <ColunaKanban 
            titulo="A Fazer" 
            count={pendentes.length} 
            tarefas={pendentes} 
            cor="bg-gray-200"
            usuarios={usuarios} // <--- Passamos a lista
          />

          <ColunaKanban 
            titulo="Em Andamento" 
            count={fazendo.length} 
            tarefas={fazendo} 
            cor="bg-indigo-500"
            usuarios={usuarios}
          />

          <ColunaKanban 
            titulo="Concluído" 
            count={feitas.length} 
            tarefas={feitas} 
            cor="bg-green-500"
            usuarios={usuarios}
          />

        </div>
      </div>
    </div>
  );
}

// Atualize a Coluna para aceitar 'usuarios' e repassar para o Card
function ColunaKanban({ titulo, count, tarefas, cor, usuarios }: any) {
  return (
    <div className="w-80 flex flex-col h-full flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200/60 max-h-[calc(100vh-140px)]">
      
      <div className="p-3 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${cor}`}></div>
           <h3 className="font-semibold text-gray-700 text-sm">{titulo}</h3>
        </div>
        <span className="text-xs text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full font-medium">{count}</span>
      </div>

      <div className="flex-1 p-2 space-y-3 overflow-y-auto">
        {tarefas.map((tarefa: any) => (
          // <--- Passamos 'usuarios' para o Card
          <CardKanban key={tarefa.id} tarefa={tarefa} usuarios={usuarios} />
        ))}
        
        {tarefas.length === 0 && (
          <div className="text-center py-8 opacity-40 select-none">
            <p className="text-xs font-medium text-gray-400">Sem tarefas</p>
          </div>
        )}
      </div>
    </div>
  )
}