import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config()

const prisma = new PrismaClient()

// --- CONFIGURAÇÕES ---
const ASANA_PROJECT_GID_SPRINT = '1210948147293153' // ID do Projeto SPRINT
const ASANA_PAT = process.env.ASANA_PAT

// Caches para evitar ficar consultando o banco toda hora
const projetosCache = new Map<string, string>() // Nome do Projeto -> ID no Banco
const colunasCache = new Map<string, string>()  // Nome da Coluna -> ID no Banco
const vinculoCache = new Set<string>()          // "ProjetoID-ColunaID" para saber se já vinculou

async function main() {
  if (!ASANA_PAT) {
    console.error('❌ Erro: ASANA_PAT não encontrado no .env')
    return
  }

  // 1. Pega o usuário ADMIN/OWNER para ser o dono dos projetos
  const adminUser = await prisma.usuario.findFirst({ where: { role: 'OWNER' } })
  if (!adminUser) {
    console.error('❌ Erro: Nenhum usuário OWNER encontrado.')
    return
  }

  console.log(`👤 Importando como: ${adminUser.nome}`)
  console.log('🔄 Baixando tarefas do Asana...')

  try {
    let offset: string | null = null
    let hasNextPage = true
    let totalProcessado = 0

    while (hasNextPage) {
      // ATENÇÃO: Adicionei 'memberships.project.name' e 'memberships.project.gid' na requisição
      let url = `https://app.asana.com/api/1.0/projects/${ASANA_PROJECT_GID_SPRINT}/tasks?opt_fields=name,notes,due_on,assignee.email,memberships.section.name,memberships.project.name,memberships.project.gid,completed&limit=100`
      
      if (offset) url += `&offset=${offset}`

      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${ASANA_PAT}` } })
      const data = await response.json()

      if (data.errors) throw new Error(JSON.stringify(data.errors))

      const tarefasAsana = data.data
      if (tarefasAsana.length === 0 && !offset) break;

      for (const t of tarefasAsana) {
        if (!t.name || t.name.trim() === '') continue

        // --- LÓGICA PRINCIPAL ---
        
        // 1. Encontrar o "Projeto Secundário" (que NÃO é o Sprint)
        // O array memberships traz todos os projetos que a tarefa pertence.
        let membershipAlvo = t.memberships.find((m: any) => m.project.gid !== ASANA_PROJECT_GID_SPRINT)

        // Se a tarefa só está na Sprint e em nenhum outro lugar, usamos um fallback ou pulamos
        if (!membershipAlvo) {
            // Opcional: Se quiser importar mesmo assim, descomente abaixo e defina um nome padrão
            // membershipAlvo = { project: { name: 'Tarefas Avulsas Sprint' }, section: { name: 'Backlog' } }
            continue; // Pula tarefas que não têm projeto secundário
        }

        const nomeProjetoReal = membershipAlvo.project.name
        // Se não tiver seção, chamamos de "Geral" ou "A Fazer"
        const nomeColunaReal = membershipAlvo.section ? membershipAlvo.section.name : 'Geral'

        // --- A. RESOLVER PROJETO (Find or Create) ---
        let projetoId = projetosCache.get(nomeProjetoReal)

        if (!projetoId) {
            let projeto = await prisma.projeto.findFirst({
                where: { nome: nomeProjetoReal, workspace_id: adminUser.workspace_id! }
            })

            if (!projeto) {
                process.stdout.write(`\n[Novo Projeto: ${nomeProjetoReal}] `)
                projeto = await prisma.projeto.create({
                    data: {
                        nome: nomeProjetoReal,
                        descricao: `Importado do Asana (Original)`,
                        workspace_id: adminUser.workspace_id!,
                        usuario_id: adminUser.id,
                        dt_acesso: new Date()
                    }
                })
            }
            projetoId = projeto.id
            projetosCache.set(nomeProjetoReal, projetoId)
        }

        // --- B. RESOLVER COLUNA/ETAPA (Find or Create) ---
        // Verifica se essa coluna já existe no Workspace (reaproveitamento de colunas com mesmo nome)
        let colunaId = colunasCache.get(nomeColunaReal)
        
        if (!colunaId) {
            let coluna = await prisma.coluna.findFirst({
                where: { nome: nomeColunaReal, workspace_id: adminUser.workspace_id! }
            })

            if (!coluna) {
                coluna = await prisma.coluna.create({
                    data: { nome: nomeColunaReal, workspace_id: adminUser.workspace_id! }
                })
            }
            colunaId = coluna.id
            colunasCache.set(nomeColunaReal, colunaId)
        }

        // --- C. VINCULAR COLUNA AO PROJETO ---
        // Garante que o projeto tem essa coluna visível na ordem correta
        const chaveVinculo = `${projetoId}-${colunaId}`
        if (!vinculoCache.has(chaveVinculo)) {
            const vinculoExistente = await prisma.projetoColuna.findUnique({
                where: { projeto_id_coluna_id: { projeto_id: projetoId, coluna_id: colunaId } }
            })

            if (!vinculoExistente) {
                // Pega a última ordem para adicionar no final
                const ultimaColuna = await prisma.projetoColuna.findFirst({
                    where: { projeto_id: projetoId },
                    orderBy: { ordem: 'desc' }
                })
                const novaOrdem = ultimaColuna ? ultimaColuna.ordem + 1 : 1

                await prisma.projetoColuna.create({
                    data: { 
                        projeto_id: projetoId, 
                        coluna_id: colunaId, 
                        ordem: novaOrdem 
                    }
                })
            }
            vinculoCache.add(chaveVinculo)
        }

        // --- D. USUÁRIO RESPONSÁVEL ---
        let responsavelId = adminUser.id
        if (t.assignee && t.assignee.email) {
            const userEncontrado = await prisma.usuario.findUnique({
                where: { email: t.assignee.email }
            })
            if (userEncontrado) responsavelId = userEncontrado.id
        }

        // --- E. CRIAR A TAREFA ---
        await prisma.tarefa.create({
            data: {
                titulo: t.name,
                descricao: t.notes || '',
                concluida: t.completed,
                dt_vencimento: t.due_on ? new Date(t.due_on) : null,
                
                projeto_id: projetoId,
                coluna_id: colunaId, // Agora usa a coluna correta (Mapeamento, Varanda, etc)
                usuario_id: responsavelId,
                
                prioridade_id: 2, 
                dificuldade_id: 3
            }
        })

        process.stdout.write('.')
        totalProcessado++
      }

      // Paginação
      if (data.next_page && data.next_page.offset) {
          offset = data.next_page.offset
      } else {
          hasNextPage = false
      }
    }

    console.log(`\n\n✅ Finalizado! Total importado: ${totalProcessado}`)

  } catch (error) {
    console.error('\n❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()