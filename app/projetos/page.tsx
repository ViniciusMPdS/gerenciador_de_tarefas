import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import BotaoNovoProjeto from '@/components/BotaoNovoProjeto'

export default async function TodosProjetosPage() {
  // Busca TODOS, ordenados por nome
  const projetos = await prisma.projeto.findMany({
    orderBy: { nome: 'asc' },
    include: {
      _count: { select: { tarefas: true } }
    }
  })

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto min-h-screen">
      <header className="mb-8 border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Todos os Projetos</h1>
          <p className="text-gray-500 mt-2">Lista completa de {projetos.length} projetos.</p>
        </div>
        <BotaoNovoProjeto />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projetos.map(projeto => (
          <Link 
            href={`/projeto/${projeto.id}`} 
            key={projeto.id}
            className="group bg-surface p-6 rounded-xl border border-border hover:border-indigo-300 hover:shadow-md transition-all flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-surface/50 flex items-center justify-center text-gray-500 font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {projeto.nome.substring(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-medium bg-surface/50 text-gray-600 px-2 py-1 rounded-full">
                {projeto._count.tarefas} tarefas
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-indigo-600 transition-colors truncate">
              {projeto.nome}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2">
              {projeto.descricao || 'Sem descrição.'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}