import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function Home() {
  const totalProjetos = await prisma.projeto.count()
  const totalTarefas = await prisma.tarefa.count()
  const tarefasConcluidas = await prisma.tarefa.count({ where: { concluida: true } })
  
  // MUDANÇA: Pegamos apenas os 6 últimos mexidos (dt_update)
  const projetosRecentes = await prisma.projeto.findMany({
    orderBy: { dt_update: 'desc' }, // O segredo: ordenado por modificação
    take: 6, // Limite de 6
    include: {
      _count: { select: { tarefas: true } }
    }
  })

  const usuario = await prisma.usuario.findFirst()

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto min-h-screen">
      
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Bem-vindo de volta{usuario ? `, ${usuario.nome}` : ''}.</p>
      </header>

      {/* Cards de Estatística (Mantidos) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Projetos</p>
             <h3 className="text-3xl font-bold text-gray-800 mt-1">{totalProjetos}</h3>
           </div>
           <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl">📂</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Tarefas</p>
             <h3 className="text-3xl font-bold text-gray-800 mt-1">{totalTarefas}</h3>
           </div>
           <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">📝</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Concluídas</p>
             <h3 className="text-3xl font-bold text-emerald-600 mt-1">{tarefasConcluidas}</h3>
           </div>
           <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">✅</div>
        </div>
      </div>

      {/* Projetos Recentes */}
      <section>
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            ⏱️ Acessados Recentemente
            </h2>
            <Link href="/projetos" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                Ver todos os projetos →
            </Link>
        </div>

        {projetosRecentes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <p className="text-gray-500">Nenhum projeto encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projetosRecentes.map(projeto => (
              <Link 
                href={`/projeto/${projeto.id}`} 
                key={projeto.id}
                className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {projeto.nome.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {new Date(projeto.dt_update).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {projeto.nome}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}