import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import BtnExcluirColuna from '@/components/BtnExcluirColuna' // <--- IMPORTANTE

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

async function excluirColuna(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  
  try {
    await prisma.coluna.delete({ where: { id } })
    revalidatePath('/configuracoes/colunas')
  } catch (error) {
    console.log("Erro ao excluir (provavelmente tem vinculos)")
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
      <header className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Colunas</h1>
        <p className="text-gray-500 mt-2">
          Defina as etapas (seções) padrões que estarão disponíveis para os projetos.
        </p>
      </header>

      {/* Formulário de Criação */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Adicionar Nova Coluna</h2>
        <form action={criarColuna} className="flex gap-4">
          <input type="hidden" name="workspaceId" value={workspace.id} />
          <input 
            name="nome" 
            placeholder="Nome da coluna (Ex: Validação, Arquivado...)" 
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-rose-500"
            required
            autoComplete="off"
          />
          <button className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors">
            + Criar
          </button>
        </form>
      </div>

      {/* Lista de Colunas */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Colunas Existentes ({workspace.colunas.length})</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workspace.colunas.map(coluna => (
            <div key={coluna.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg group hover:border-indigo-300 transition-colors shadow-sm">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 text-xs font-bold border border-gray-100">
                  {coluna.nome.substring(0, 1).toUpperCase()}
                </span>
                <span className="font-medium text-gray-800">{coluna.nome}</span>
              </div>
              
              <form action={excluirColuna}>
                <input type="hidden" name="id" value={coluna.id} />
                {/* Substituímos o <button> direto pelo Componente Cliente */}
                <BtnExcluirColuna />
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}