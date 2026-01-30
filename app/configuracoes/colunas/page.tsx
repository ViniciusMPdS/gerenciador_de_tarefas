import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import ItemColuna from '@/components/ItemColuna' // <--- IMPORTAR O NOVO COMPONENTE

// --- ACTIONS ---
async function criarColuna(formData: FormData) {
  'use server'
  const nome = formData.get('nome') as string
  const workspaceId = formData.get('workspaceId') as string
  
  if (!nome || !workspaceId) return

  await prisma.coluna.create({
    data: { nome, workspace_id: workspaceId }
  })
  revalidatePath('/configuracoes/colunas')
}

// --- NOVA ACTION DE ATUALIZAR ---
async function atualizarNomeColuna(id: string, novoNome: string) {
  'use server'
  if (!id || !novoNome) return

  await prisma.coluna.update({
    where: { id },
    data: { nome: novoNome }
  })
  revalidatePath('/configuracoes/colunas')
}

async function excluirColuna(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  try {
    await prisma.coluna.delete({ where: { id } })
    revalidatePath('/configuracoes/colunas')
  } catch (error) {
    console.log("Erro ao excluir")
  }
}

// --- PÁGINA ---
export default async function GerenciarColunasPage() {
  const workspace = await prisma.workspace.findFirst({
    include: { colunas: { orderBy: { nome: 'asc' } } }
  })

  if (!workspace) return <div className="p-8">Workspace não encontrado.</div>

  return (
    <div className="p-8 md:p-12 max-w-4xl mx-auto">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-foreground">Gerenciar Colunas</h1>
        <p className="text-gray-500 mt-2">
          Clique no nome de uma coluna para editá-la.
        </p>
      </header>

      {/* Formulário de Criação (Mantido Igual) */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm mb-8">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Adicionar Nova Coluna</h2>
        <form action={criarColuna} className="flex gap-4">
          <input type="hidden" name="workspaceId" value={workspace.id} />
          <input 
            name="nome" 
            placeholder="Nome da coluna..." 
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-rose-500"
            required
            autoComplete="off"
          />
          <button className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors">
            + Criar
          </button>
        </form>
      </div>

      {/* Lista de Colunas (Atualizada) */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Colunas Existentes ({workspace.colunas.length})</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workspace.colunas.map(coluna => (
            <ItemColuna 
                key={coluna.id}
                coluna={coluna}
                atualizarAction={atualizarNomeColuna}
                excluirAction={excluirColuna}
            />
          ))}
        </div>
      </div>
    </div>
  )
}