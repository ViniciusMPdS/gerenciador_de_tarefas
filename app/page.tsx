import { prisma } from '@/lib/prisma';
import Link from 'next/link';

async function getProjetos() {
  const projetos = await prisma.projeto.findMany({
    include: { tarefas: true, workspace: true },
    orderBy: { dt_insert: 'desc' } // <--- Mudamos para dt_insert
  });
  return projetos;
}

export default async function DashboardHome() {
  const projetos = await getProjetos();
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{saudacao}, Admin</h1>
        <p className="text-gray-500">Resumo dos projetos ativos.</p>
      </header>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-rose-500 rounded-full"></span>
          Projetos Recentes
        </h2>

        {projetos.length === 0 ? (
          <div className="text-gray-500 italic">Nenhum projeto encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projetos.map((projeto) => {
              const total = projeto.tarefas.length;
              const feitos = projeto.tarefas.filter(t => t.status === 'FEITO').length;
              const progresso = total === 0 ? 0 : Math.round((feitos / total) * 100);

              return (
                <Link key={projeto.id} href={`/projeto/${projeto.id}`} className="group">
                  <article className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-rose-200 transition-all duration-300 h-full flex flex-col justify-between cursor-pointer">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-rose-50 transition-colors">
                          <span className="text-xl">📂</span>
                        </div>
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                          {projeto.workspace?.nome || 'Geral'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-rose-600 transition-colors">
                        {projeto.nome}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {projeto.descricao || "Sem descrição definida."}
                      </p>
                    </div>

                    <div className="mt-6">
                      <div className="flex justify-between text-xs font-medium text-gray-500 mb-1.5">
                        <span>Progresso</span>
                        <span>{progresso}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-rose-500 to-orange-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${progresso}%` }}
                        ></div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}