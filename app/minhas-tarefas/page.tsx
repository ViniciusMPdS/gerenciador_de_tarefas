import { prisma } from '@/lib/prisma';
import TarefaViewManager from '@/components/TarefaViewManager';

async function getMinhasTarefas() {
  const tarefas = await prisma.tarefa.findMany({
    // REMOVI O "WHERE NOT FEITO" para que as tarefas concluídas apareçam na coluna certa
    include: { projeto: true, usuario: true }, 
    orderBy: { prioridade: 'desc' }
  });
  return tarefas;
}

export default async function MinhasTarefasPage() {
  const tarefas = await getMinhasTarefas();
  
  // Buscamos usuários para o modal funcionar
  const usuarios = await prisma.usuario.findMany();
  
  const dataHoje = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  });

  // Cálculo rápido para o cabeçalho (apenas pendentes visualmente)
  const pendentesCount = tarefas.filter(t => t.status !== 'FEITO').length;

  return (
    // CORREÇÃO VISUAL 1: Mudado de max-w-5xl para max-w-7xl (mais largo para caber o Kanban)
    <div className="p-8 md:p-12 max-w-7xl mx-auto min-h-screen">
      
      <header className="mb-8 flex items-end justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Tarefas</h1>
          <p className="text-gray-500 capitalize">{dataHoje}</p>
        </div>
        <div className="text-sm text-gray-400">
          {pendentesCount} tarefas pendentes
        </div>
      </header>

      {/* CORREÇÃO VISUAL 2: Removi a div branca (card) que estava apertando o Kanban.
          Agora ele fica solto no fundo cinza, igual na Sprint. */}
      <div className="mt-6">
          <TarefaViewManager 
            tarefas={tarefas} 
            usuarios={usuarios} 
          />
      </div>
    </div>
  );
}