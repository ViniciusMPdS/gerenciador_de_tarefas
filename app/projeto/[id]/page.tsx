import { prisma } from '@/lib/prisma'
import MinhasTarefasView from '@/components/MinhasTarefasView' // Usamos o componente universal
import ModalConfigProjeto from '@/components/ModalConfigProjeto'
import ModalCriarTarefa from '@/components/ModalCriarTarefa' 

export default async function ProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Touch
  await prisma.projeto.update({
    where: { id },
    data: { dt_acesso: new Date() }
  })

  // 1. Busca Projeto e Colunas
  const projeto = await prisma.projeto.findUnique({
    where: { id },
    include: {
      colunas: {
        include: { coluna: true },
        orderBy: { ordem: 'asc' }
      }
    }
  })

  if (!projeto) return <div>Projeto não encontrado</div>

  // 2. Busca Tarefas
  const tarefas = await prisma.tarefa.findMany({
    where: { projeto_id: id },
    include: { usuario: true, coluna: true }, // Inclui coluna para o filtro funcionar
    orderBy: { prioridade: 'desc' }
  })

  // 3. Busca Usuários
  const usuarios = await prisma.usuario.findMany()

  // 4. Biblioteca Geral (Para o modal de config)
  const bibliotecaColunas = await prisma.coluna.findMany({ orderBy: { nome: 'asc' } })

  // 5. Colunas do Kanban (As etapas desse projeto)
  const colunasDoKanban = projeto.colunas.map(pc => pc.coluna);

  return (
    <div className="flex flex-col h-full bg-[#F9F9F9]">
      
      {/* HEADER */}
      <header className="px-8 py-6 bg-white border-b border-gray-200 flex justify-between items-center sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{projeto.nome}</h1>
          <p className="text-gray-500 text-sm mt-1">{projeto.descricao || 'Sem descrição'}</p>
        </div>

        <div className="flex items-center gap-3">
          <ModalConfigProjeto 
            projeto={projeto} 
            colunasDisponiveis={bibliotecaColunas} 
            colunasDoProjeto={projeto.colunas}     
          />

          <ModalCriarTarefa 
             projetoId={projeto.id}
             colunas={colunasDoKanban} 
             usuarios={usuarios}
          />
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO (UNIVERSAL) */}
      <div className="flex-1 overflow-hidden p-8">
        
        {colunasDoKanban.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <h3 className="text-lg font-medium text-gray-700">Projeto Vazio</h3>
            <p className="text-gray-500 mb-4">Este projeto ainda não tem etapas definidas.</p>
            <p className="text-sm text-indigo-600">Clique na engrenagem ⚙️ acima para adicionar colunas.</p>
          </div>
        ) : (
          /* AQUI ESTÁ A MÁGICA: Reutilizamos o componente da Sprint/Minhas Tarefas */
          <MinhasTarefasView 
            tarefasIniciais={tarefas}
            listaProjetos={[projeto]} // Passamos só ele, mas o filtro será escondido
            usuarios={usuarios}
            colunas={colunasDoKanban} // Passamos as colunas para o Kanban desenhar
            
            // CONFIGURAÇÕES ESPECÍFICAS PARA PÁGINA DE PROJETO:
            agrupamento="COLUNA" // Kanban agrupa por Etapas, não Projetos
            esconderFiltroProjeto={true} // Esconde o dropdown de projeto
            
            // Calendário e Filtros já vêm "de brinde"
            enableCalendarNavigation={true} 
          />
        )}

      </div>
    </div>
  )
}