import { prisma } from '@/lib/prisma'
import MinhasTarefasView from '@/components/MinhasTarefasView' 
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

  // 2. Busca Tarefas (CORRIGIDO)
  const tarefas = await prisma.tarefa.findMany({
    where: { projeto_id: id },
    include: { 
      usuario: true,
      coluna: true,
      // --- ADICIONADO: Trazer os dados das tabelas auxiliares ---
      prioridade: true,   
      dificuldade: true,
      // ---------------------------------------------------------
      comentarios: { include: { usuario: true }, orderBy: { dt_insert: 'asc' } } 
    },
    // --- CORRIGIDO: Ordenar pelo ID da prioridade (3=Alta vem primeiro) ---
    orderBy: { prioridade_id: 'desc' }
  })

  // 3. Busca Usuários
  const usuarios = await prisma.usuario.findMany()

  // 4. Biblioteca Geral
  const bibliotecaColunas = await prisma.coluna.findMany({ orderBy: { nome: 'asc' } })

  // 5. Colunas do Kanban
  const colunasDoKanban = projeto.colunas.map(pc => pc.coluna);

  return (
    <div className="flex flex-col h-full bg-background">
      
      {/* HEADER */}
      <header className="px-8 py-6 bg-surface border-b border-border flex justify-between items-center sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{projeto.nome}</h1>
          <p className="text-text-muted text-sm mt-1">{projeto.descricao || 'Sem descrição'}</p>
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

      {/* ÁREA DE CONTEÚDO */}
      <div className="flex-1 overflow-hidden p-8">
        
        {colunasDoKanban.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl bg-surface/50">
            <h3 className="text-lg font-medium text-foreground">Projeto Vazio</h3>
            <p className="text-text-muted mb-4">Este projeto ainda não tem etapas definidas.</p>
            <p className="text-sm text-indigo-400">Clique na engrenagem ⚙️ acima para adicionar colunas.</p>
          </div>
        ) : (
          <MinhasTarefasView 
            tarefasIniciais={tarefas}
            listaProjetos={[projeto]} 
            usuarios={usuarios}
            colunas={colunasDoKanban} 
            agrupamento="COLUNA" 
            esconderFiltroProjeto={true} 
            enableCalendarNavigation={true} 
          />
        )}

      </div>
    </div>
  )
}