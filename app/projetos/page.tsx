import { prisma } from '@/lib/prisma'
import BotaoNovoProjeto from '@/components/BotaoNovoProjeto'
import CardProjeto from '@/components/CardProjeto' // <--- IMPORTAR O NOVO CARD

// Força atualização dos dados sempre que entrar na página
export const dynamic = 'force-dynamic'

export default async function TodosProjetosPage() {
  const projetos = await prisma.projeto.findMany({
    orderBy: [
        { ativo: 'desc' }, 
        { nome: 'asc' }
    ],
    include: {
      _count: { select: { tarefas: true } }
    }
  })

  return (
    <div className="p-4 lg:p-12 max-w-7xl mx-auto min-h-screen">
      
      <header className="mb-4 lg:mb-8 border-b border-border pb-3 lg:pb-6 flex flex-col md:flex-row md:items-center justify-between gap-2 lg:gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-foreground">Todos os Projetos</h1>
          <p className="text-xs lg:text-base text-gray-500 mt-1 lg:mt-2">Lista completa de {projetos.length} projetos.</p>
        </div>
        <BotaoNovoProjeto />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
        {projetos.map(projeto => (
            // AQUI ESTÁ A MUDANÇA: Usamos o componente em vez do Link direto
            <CardProjeto key={projeto.id} projeto={projeto} />
        ))}
      </div>
    </div>
  )
}