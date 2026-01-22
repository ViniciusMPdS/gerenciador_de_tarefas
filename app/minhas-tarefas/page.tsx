import { prisma } from '@/lib/prisma';
import TarefaViewManager from '@/components/TarefaViewManager';

export default async function MinhasTarefasPage() {
  // --- MUDANÇA AQUI ---
  // Em vez de buscar por email, pegamos o primeiro usuário que existir no banco.
  // Isso simula que você está logado como "Alguém".
  const usuarioLogado = await prisma.usuario.findFirst();

  // Se o banco estiver vazio (sem seed), avisa para rodar a seed
  if (!usuarioLogado) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h1 className="text-xl font-bold text-gray-800">Nenhum usuário encontrado</h1>
        <p className="text-gray-500 mb-4">Seu banco de dados parece estar vazio.</p>
        <div className="bg-black text-white p-4 rounded-lg font-mono text-sm">
          npx prisma db seed
        </div>
      </div>
    );
  }

  // Busca tarefas apenas deste usuário encontrado
  const tarefas = await prisma.tarefa.findMany({
    where: { 
      usuario_id: usuarioLogado.id,
      // Removi o filtro de concluída=false para você ver TUDO que é seu, 
      // mas você pode descomentar se quiser só pendentes.
      // concluida: false 
    },
    include: { 
      projeto: true, 
      usuario: true,
      coluna: true 
    },
    orderBy: { dt_vencimento: 'asc' }
  });

  const usuarios = await prisma.usuario.findMany({ orderBy: { nome: 'asc' }});
  const todasColunas = await prisma.coluna.findMany({ orderBy: { nome: 'asc' } });

  return (
    <div className="flex flex-col h-screen bg-[#F9F9F9] overflow-hidden">
      
      {/* HEADER */}
      <header className="flex-shrink-0 px-8 py-6 border-b border-gray-200 bg-white z-20">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg border border-indigo-200">
             {usuarioLogado.nome.substring(0, 2).toUpperCase()}
           </div>
           <div>
             <h1 className="text-2xl font-bold text-gray-900">Minhas Tarefas</h1>
             <p className="text-gray-500 text-sm">
               Olá, <span className="font-medium text-indigo-600">{usuarioLogado.nome}</span>. Aqui estão suas responsabilidades.
             </p>
           </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div className="flex-1 overflow-hidden p-8">
        <TarefaViewManager 
          tarefas={tarefas} 
          usuarios={usuarios} 
          todasColunas={todasColunas}
          mostrarVazias={true} 
        />
      </div>
    </div>
  );
}