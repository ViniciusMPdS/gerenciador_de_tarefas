import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import BotaoNovoProjeto from '@/components/BotaoNovoProjeto'
import AvatarProjeto from '@/components/AvatarProjeto'

export default async function TodosProjetosPage() {
  const projetos = await prisma.projeto.findMany({
    // ORDENAÇÃO: Ativos primeiro, depois por nome
    orderBy: [
        { ativo: 'desc' }, 
        { nome: 'asc' }
    ],
    include: {
      _count: { select: { tarefas: true } }
    }
  })

  return (
    /* MUDANÇA 1: Padding responsivo 
       - p-4: Notebook pequeno
       - lg:p-12: Monitor grande
    */
    <div className="p-4 lg:p-12 max-w-7xl mx-auto min-h-screen">
      
      {/* MUDANÇA 2: Header mais compacto e responsivo */}
      <header className="mb-4 lg:mb-8 border-b border-border pb-3 lg:pb-6 flex flex-col md:flex-row md:items-center justify-between gap-2 lg:gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-foreground">Todos os Projetos</h1>
          <p className="text-xs lg:text-base text-gray-500 mt-1 lg:mt-2">Lista completa de {projetos.length} projetos.</p>
        </div>
        <BotaoNovoProjeto />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
        {projetos.map(projeto => (
          <Link 
            href={`/projeto/${projeto.id}`} 
            key={projeto.id}
            // ESTILO DINÂMICO: Se inativo, fica cinza e meio transparente
            className={`group bg-surface p-4 lg:p-6 rounded-xl border transition-all flex flex-col
                ${projeto.ativo 
                    ? 'border-border hover:border-indigo-300 hover:shadow-md' 
                    : 'border-gray-100 opacity-60 grayscale hover:grayscale-0'
                }
            `}
          >
            <div className="flex justify-between items-start mb-2 lg:mb-4">
              <AvatarProjeto 
                  projetoId={projeto.id} 
                  imagem={projeto.imagem} 
                  nome={projeto.nome}
                  tamanho="w-16 h-16" // Pode ajustar para w-16 h-16 se quiser maior
              />
              <span className="text-[10px] lg:text-xs font-medium bg-surface/50 text-gray-600 px-2 py-1 rounded-full">
                {projeto._count.tarefas} tarefas
              </span>
              {!projeto.ativo && <span className="text-[9px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded">Arquivado</span>}
            </div>
            <h3 className="text-base lg:text-lg font-bold text-foreground mb-1 group-hover:text-indigo-600 transition-colors truncate">
              {projeto.nome}
            </h3>
            <p className="text-xs lg:text-sm text-gray-500 line-clamp-2">
              {projeto.descricao || 'Sem descrição.'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}