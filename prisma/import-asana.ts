// prisma/import-asana.ts
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config() 

const prisma = new PrismaClient()

// --- CONFIGURAÇÕES ---
const ASANA_PROJECT_GID = '1210948147293153' 
const ASANA_PAT = process.env.ASANA_PAT
const NOME_COLUNA_DESTINO = 'ASANA' // <--- ÚNICA coluna usada

const projetosMap = new Map<string, string>() 

async function main() {
  if (!ASANA_PAT) {
    console.error('❌ Erro: ASANA_PAT não encontrado no .env')
    return
  }

  const adminUser = await prisma.usuario.findFirst({ where: { role: 'OWNER' } })
  if (!adminUser) {
    console.error('❌ Erro: Nenhum usuário OWNER encontrado.')
    return
  }
  
  console.log(`👤 Importando como: ${adminUser.nome}`)
  
  // 1. BUSCA A COLUNA "ASANA" NO BANCO
  // Você disse que ela já existe, então vamos apenas pegar o ID dela.
  let colunaAsana = await prisma.coluna.findFirst({
      where: { 
          nome: NOME_COLUNA_DESTINO, 
          workspace_id: adminUser.workspace_id! 
      }
  })

  // Trava de segurança: Se por acaso ela não existir, o script para ou cria.
  // Vou colocar para criar só pra não dar erro fatal, mas vai usar a existente se tiver.
  if (!colunaAsana) {
      console.log(`⚠️ Coluna "${NOME_COLUNA_DESTINO}" não encontrada. Criando ela...`)
      colunaAsana = await prisma.coluna.create({
          data: { nome: NOME_COLUNA_DESTINO, workspace_id: adminUser.workspace_id! }
      })
  }
  
  const COLUNA_ID_GLOBAL = colunaAsana.id
  console.log(`✅ Alvo definido: Coluna "${NOME_COLUNA_DESTINO}" (ID: ${COLUNA_ID_GLOBAL})`)

  console.log('🔄 Baixando tarefas do Asana (com paginação)...')

  try {
    let offset: string | null = null
    let hasNextPage = true
    let totalProcessado = 0

    // LOOP DE PAGINAÇÃO
    while (hasNextPage) {
        let url = `https://app.asana.com/api/1.0/projects/${ASANA_PROJECT_GID}/tasks?opt_fields=name,notes,due_on,assignee.email,memberships.section.name,completed&limit=100`
        if (offset) {
            url += `&offset=${offset}`
        }

        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${ASANA_PAT}` } })
        const data = await response.json()
        
        if (data.errors) throw new Error(JSON.stringify(data.errors))
        
        const tarefasAsana = data.data
        if (tarefasAsana.length === 0 && !offset) {
            break;
        }

        for (const t of tarefasAsana) {
            if (!t.name || t.name.trim() === '') continue

            // --- A. PROJETO (Baseado na Seção) ---
            let nomeSecao = 'Geral Importado'
            if (t.memberships && t.memberships.length > 0 && t.memberships[0].section) {
                nomeSecao = t.memberships[0].section.name
            }
            nomeSecao = nomeSecao.replace(':', '').trim()

            let projetoId = projetosMap.get(nomeSecao)

            if (!projetoId) {
                // Tenta achar projeto existente
                let projeto = await prisma.projeto.findFirst({
                    where: { nome: nomeSecao, workspace_id: adminUser.workspace_id! }
                })

                if (!projeto) {
                    process.stdout.write(`\n[Novo Projeto: ${nomeSecao}] `)
                    projeto = await prisma.projeto.create({
                        data: {
                            nome: nomeSecao,
                            descricao: `Importado do Asana`,
                            workspace_id: adminUser.workspace_id!,
                            usuario_id: adminUser.id,
                            dt_acesso: new Date()
                        }
                    })
                    
                    // VINCULA APENAS A COLUNA ASANA A ESSE PROJETO
                    await prisma.projetoColuna.create({
                        data: { projeto_id: projeto.id, coluna_id: COLUNA_ID_GLOBAL, ordem: 1 }
                    })

                } else {
                    // Se o projeto já existe, garante que a coluna ASANA está vinculada
                    const vinculo = await prisma.projetoColuna.findUnique({
                        where: { projeto_id_coluna_id: { projeto_id: projeto.id, coluna_id: COLUNA_ID_GLOBAL } }
                    })
                    if (!vinculo) {
                        await prisma.projetoColuna.create({
                           data: { projeto_id: projeto.id, coluna_id: COLUNA_ID_GLOBAL, ordem: 1 }
                       })
                    }
                }
                
                projetoId = projeto.id
                projetosMap.set(nomeSecao, projetoId)
            }

            // --- B. USUÁRIO ---
            let responsavelId = adminUser.id
            if (t.assignee && t.assignee.email) {
                const userEncontrado = await prisma.usuario.findUnique({
                     where: { email: t.assignee.email }
                })
                if (userEncontrado) {
                    responsavelId = userEncontrado.id
                }
            }

            // --- C. CRIAR TAREFA NA COLUNA "ASANA" ---
            await prisma.tarefa.create({
                data: {
                titulo: t.name,
                descricao: t.notes || '',
                concluida: t.completed,
                dt_vencimento: t.due_on ? new Date(t.due_on) : null,
                
                projeto_id: projetoId!,
                coluna_id: COLUNA_ID_GLOBAL, // <--- ÚNICO DESTINO
                usuario_id: responsavelId,
                
                prioridade_id: 2, 
                dificuldade_id: 3 
                }
            })
            process.stdout.write('.')
            totalProcessado++
        }

        if (data.next_page && data.next_page.offset) {
            offset = data.next_page.offset
        } else {
            hasNextPage = false
        }
    }

    console.log(`\n\n✅ Finalizado! Total importado: ${totalProcessado}`)
    console.log(`Todas as tarefas estão na coluna "${NOME_COLUNA_DESTINO}".`)

  } catch (error) {
    console.error('\n❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()