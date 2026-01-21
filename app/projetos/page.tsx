import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { criarProjeto } from '@/app/actions' // Importamos a ação

async function getDados() {
  const projetos = await prisma.projeto.findMany({ include: { workspace: true, tarefas: true } })
  const workspace = await prisma.workspace.findFirst() // Precisamos de um ID pra criar
  return { projetos, workspaceId: workspace?.id }
}

export default async function ProjetosPage() {
  const { projetos, workspaceId } = await getDados()

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Projetos</h1>
          <p className="text-gray-500 mt-1">Gerencie todos os seus quadros aqui.</p>
        </div>
        
        {/* Formulário Simples para Criar Projeto */}
        <form action={criarProjeto} className="flex gap-2">
          <input type="hidden" name="workspaceId" value={workspaceId || ''} />
          <input 
            name="nome" 
            placeholder="Nome do novo projeto..." 
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
            required 
          />
          <button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Criar
          </button>
        </form>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projetos.map(projeto => (
          <Link key={projeto.id} href={`/projeto/${projeto.id}`} className="group">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:border-rose-200 h-40 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-lg group-hover:text-rose-600 transition-colors">{projeto.nome}</h3>
                <p className="text-xs text-gray-400 mt-1">{projeto.workspace?.nome}</p>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-4 border-gray-50">
                <span>{projeto.tarefas.length} tarefas</span>
                <span className="text-indigo-600 font-medium">Abrir Quadro →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}