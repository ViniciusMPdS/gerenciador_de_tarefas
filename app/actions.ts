'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth, signIn } from '@/auth'
import { AuthError } from 'next-auth'
import bcrypt from 'bcryptjs'
import { Recorrencia, CampoAlterado } from '@prisma/client' // <--- ADICIONADO CampoAlterado
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// --- AUTENTICAÇÃO ---
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', {
        ...Object.fromEntries(formData),
        redirectTo: '/', 
    })
  } catch (error) {
    if ((error as Error).message.includes('NEXT_REDIRECT')) {
        throw error;
    }
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin': return 'Credenciais inválidas. Verifique e-mail e senha.'
        case 'CallbackRouteError': return 'Erro ao tentar login. Usuário inativo?'
        default: return 'Algo deu errado. Tente novamente.'
      }
    }
    throw error
  }
}

// --- NOVO: Alternar Status do Projeto (Arquivar/Desarquivar) ---
export async function toggleStatusProjeto(projetoId: string) {
  const projeto = await prisma.projeto.findUnique({ where: { id: projetoId } })
  
  if (!projeto) return

  await prisma.projeto.update({
    where: { id: projetoId },
    data: { ativo: !projeto.ativo }
  })

  revalidatePath('/')
  revalidatePath('/projetos')
  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath('/minhas-tarefas')
  revalidatePath('/sprint')
}

// --- TAREFAS ---

// DTO para Criação (Tipagem Forte)
interface CriarTarefaDTO {
  titulo: string
  descricao: string
  dt_vencimento: Date | null
  projeto_id: string
  coluna_id?: string
  usuario_id: string | null
  prioridade_id: number
  dificuldade_id: number
  recorrencia?: Recorrencia
}

export async function criarTarefa(data: CriarTarefaDTO) {
  // Validação básica
  if (!data.titulo || !data.projeto_id) return 

  let colunaId = data.coluna_id

  // Se não veio coluna, pega a primeira do projeto
  if (!colunaId) {
     const primeiraColuna = await prisma.projetoColuna.findFirst({
        where: { projeto_id: data.projeto_id },
        orderBy: { ordem: 'asc' }
     })
     if (primeiraColuna) colunaId = primeiraColuna.coluna_id
  }

  const novaTarefa = await prisma.tarefa.create({
    data: {
      titulo: data.titulo,
      descricao: data.descricao,
      prioridade_id: data.prioridade_id,
      dificuldade_id: data.dificuldade_id,
      concluida: false,
      coluna_id: colunaId || undefined,
      projeto_id: data.projeto_id,
      usuario_id: data.usuario_id || null,
      dt_vencimento: data.dt_vencimento,
      recorrencia: data.recorrencia || 'NAO'
    },
  })

  // LOG: Criação da tarefa (Opcional, mas bom para histórico completo)
  const session = await auth()
  if (session?.user?.email) {
      const userLog = await prisma.usuario.findUnique({ where: { email: session.user.email } })
      if (userLog) {
          await prisma.historicoTarefa.create({
              data: {
                  tarefa_id: novaTarefa.id,
                  usuario_id: userLog.id,
                  campo: 'CRIACAO',
                  valor_novo: novaTarefa.titulo
              }
          })
      }
  }

  revalidatePath(`/projeto/${data.projeto_id}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
}

// DTO para Atualização
interface AtualizarTarefaDTO {
  titulo: string
  descricao: string
  dt_vencimento: Date | null
  prioridade_id: number
  dificuldade_id: number
  usuario_id: string | null
  coluna_id?: string
  recorrencia?: Recorrencia
}

// ATUALIZADO COM SISTEMA DE LOGS INTELIGENTE
export async function atualizarTarefa(
  tarefaId: string, 
  data: AtualizarTarefaDTO,
  projetoId: string
) {
  const session = await auth()
  if (!session?.user?.email) return

  // 1. Identifica quem está alterando
  const quemAlterou = await prisma.usuario.findUnique({ where: { email: session.user.email } })
  if (!quemAlterou) return

  // 2. Busca o estado ATUAL (Antigo) da tarefa
  const tarefaAntiga = await prisma.tarefa.findUnique({
      where: { id: tarefaId },
      include: { prioridade: true, dificuldade: true, usuario: true, coluna: true }
  })
  if (!tarefaAntiga) return

  // 3. Atualiza no Banco
  const tarefaNova = await prisma.tarefa.update({
    where: { id: tarefaId },
    data: {
      titulo: data.titulo,
      descricao: data.descricao,
      prioridade_id: data.prioridade_id,
      dificuldade_id: data.dificuldade_id,
      usuario_id: data.usuario_id || null, 
      dt_vencimento: data.dt_vencimento,
      coluna_id: data.coluna_id,
      recorrencia: data.recorrencia
    }
  })

  // 4. COMPARAÇÕES PARA O LOG (Histórico)
  const logsParaCriar = []

  // Título
  if (tarefaAntiga.titulo !== data.titulo) {
      logsParaCriar.push({ campo: CampoAlterado.TITULO, antigo: tarefaAntiga.titulo, novo: data.titulo })
  }
  // Descrição (Checa se mudou algo significativo)
  if ((tarefaAntiga.descricao || '') !== (data.descricao || '')) {
      logsParaCriar.push({ campo: CampoAlterado.DESCRICAO, antigo: null, novo: 'Alterada' })
  }
  // Vencimento (Comparação de Datas)
  const dataAntigaISO = tarefaAntiga.dt_vencimento?.toISOString()
  const dataNovaISO = data.dt_vencimento?.toISOString()
  if (dataAntigaISO !== dataNovaISO) {
      logsParaCriar.push({ 
          campo: CampoAlterado.DT_VENCIMENTO, 
          antigo: tarefaAntiga.dt_vencimento ? tarefaAntiga.dt_vencimento.toLocaleDateString('pt-BR') : 'Sem data', 
          novo: data.dt_vencimento ? data.dt_vencimento.toLocaleDateString('pt-BR') : 'Sem data' 
      })
  }
  // Prioridade
  if (tarefaAntiga.prioridade_id !== data.prioridade_id) {
      logsParaCriar.push({ campo: CampoAlterado.PRIORIDADE, antigo: tarefaAntiga.prioridade.nome, novo: data.prioridade_id.toString() })
  }
  // Responsável
  if (tarefaAntiga.usuario_id !== data.usuario_id) {
      logsParaCriar.push({ 
          campo: CampoAlterado.RESPONSAVEL, 
          antigo: tarefaAntiga.usuario?.nome || 'Sem dono', 
          novo: data.usuario_id ? 'Novo Responsável' : 'Sem dono' 
      })
  }
  // Coluna (Etapa)
  if (tarefaAntiga.coluna_id !== data.coluna_id) {
     // Aqui teríamos que buscar o nome da nova coluna, vamos salvar o ID ou simplificar
     logsParaCriar.push({ 
         campo: CampoAlterado.COLUNA, 
         antigo: tarefaAntiga.coluna?.nome || 'N/A', 
         novo: 'Nova Etapa' 
     })
  }

  // 5. Salva os logs em lote
  if (logsParaCriar.length > 0) {
      await prisma.historicoTarefa.createMany({
          data: logsParaCriar.map(log => ({
              tarefa_id: tarefaId,
              usuario_id: quemAlterou.id,
              campo: log.campo,
              valor_antigo: log.antigo,
              valor_novo: log.novo,
              dt_evento: new Date()
          }))
      })
  }

  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath('/minhas-tarefas')
  revalidatePath('/')
}

export async function concluirTarefaComComentario(tarefaId: string, comentario: string, projetoId: string, usuarioId: string) {
  const tarefaOriginal = await prisma.tarefa.findUnique({ where: { id: tarefaId } });
  
  await prisma.tarefa.update({
    where: { id: tarefaId },
    data: { concluida: true, dt_conclusao: new Date() }
  })

  // LOG DE CONCLUSÃO
  await prisma.historicoTarefa.create({
      data: {
          tarefa_id: tarefaId,
          usuario_id: usuarioId,
          campo: 'CONCLUSAO',
          valor_novo: 'Comentário: ' + comentario
      }
  })

  if (comentario) {
    await prisma.comentario.create({
      data: { texto: `🏁 ENCERRAMENTO: ${comentario}`, tarefa_id: tarefaId, usuario_id: usuarioId }
    })
  }

  // --- LÓGICA DE RECORRÊNCIA ---
  if (tarefaOriginal && tarefaOriginal.recorrencia !== 'NAO' && tarefaOriginal.dt_vencimento) {
      const novaData = new Date(tarefaOriginal.dt_vencimento)
      
      if (tarefaOriginal.recorrencia === 'DIARIAMENTE') novaData.setDate(novaData.getDate() + 1)
      else if (tarefaOriginal.recorrencia === 'SEMANALMENTE') novaData.setDate(novaData.getDate() + 7)
      else if (tarefaOriginal.recorrencia === 'MENSALMENTE') novaData.setMonth(novaData.getMonth() + 1)

      await prisma.tarefa.create({
          data: {
              titulo: tarefaOriginal.titulo,
              descricao: tarefaOriginal.descricao,
              projeto_id: tarefaOriginal.projeto_id,
              usuario_id: tarefaOriginal.usuario_id,
              prioridade_id: tarefaOriginal.prioridade_id,
              dificuldade_id: tarefaOriginal.dificuldade_id,
              coluna_id: tarefaOriginal.coluna_id,
              recorrencia: tarefaOriginal.recorrencia, 
              dt_vencimento: novaData,
              concluida: false
          }
      })
  }

  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
}

// Mantido para compatibilidade
export async function editarTarefa(formData: FormData) {
  // ... (código legado, mantido igual se ainda usar) ...
  // Recomendado migrar para atualizarTarefa para ter logs
}

export async function adicionarComentario(tarefaId: string, texto: string) {
  const session = await auth()
  if (!session?.user?.email) return null
  
  const usuario = await prisma.usuario.findUnique({ where: { email: session.user.email } })
  if (!texto || !tarefaId || !usuario) return null

  const novoComentario = await prisma.comentario.create({
    data: { 
        texto, 
        tarefa_id: tarefaId, 
        usuario_id: usuario.id 
    },
    include: { usuario: true }
  })
  
  revalidatePath('/')
  revalidatePath('/minhas-tarefas')
  revalidatePath('/sprint')
  
  return novoComentario
}

// ATUALIZADO COM LOG DE COLUNA
export async function moverTarefaDeColuna(tarefaId: string, novaColunaId: string, projetoId: string) {
  const session = await auth()
  
  // 1. Busca tarefa para saber onde ela estava
  const tarefaAntiga = await prisma.tarefa.findUnique({ 
      where: { id: tarefaId },
      include: { coluna: true }
  })

  if (!tarefaAntiga) return

  // 2. Só move e loga se a coluna for diferente (Evita log duplicado ao soltar no mesmo lugar)
  if (tarefaAntiga.coluna_id !== novaColunaId) {
      
      await prisma.tarefa.update({
        where: { id: tarefaId },
        data: { coluna_id: novaColunaId }
      })

      // 3. Cria Log se tiver usuário na sessão
      if (session?.user?.email) {
          const quemMoveu = await prisma.usuario.findUnique({ where: { email: session.user.email } })
          if (quemMoveu) {
              const novaColunaNome = await prisma.coluna.findUnique({ where: { id: novaColunaId }})

              await prisma.historicoTarefa.create({
                  data: {
                      tarefa_id: tarefaId,
                      usuario_id: quemMoveu.id,
                      campo: 'COLUNA',
                      valor_antigo: tarefaAntiga.coluna?.nome || 'N/A',
                      valor_novo: novaColunaNome?.nome || 'Nova Coluna'
                  }
              })
          }
      }
  }

  revalidatePath(`/projeto/${projetoId}`)
}

// ATUALIZADO COM LOG DE REABERTURA/CONCLUSÃO
export async function toggleConcluida(tarefaId: string, isConcluida: boolean, projetoId: string) {
  const session = await auth()

  // 1. Atualiza
  const tarefaAtualizada = await prisma.tarefa.update({
    where: { id: tarefaId },
    data: { concluida: isConcluida, dt_conclusao: isConcluida ? new Date() : null }
  })

  // 2. Log
  if (session?.user?.email) {
      const quemFez = await prisma.usuario.findUnique({ where: { email: session.user.email } })
      if (quemFez) {
          await prisma.historicoTarefa.create({
              data: {
                  tarefa_id: tarefaId,
                  usuario_id: quemFez.id,
                  campo: isConcluida ? 'CONCLUSAO' : 'REABERTURA', // <--- Usa o ENUM se tiver ou string se compatível
                  valor_novo: isConcluida ? 'Concluída via Checkbox' : 'Reaberta'
              }
          })
      }
  }

  // 3. Recorrência
  if (isConcluida && tarefaAtualizada.recorrencia !== 'NAO' && tarefaAtualizada.dt_vencimento) {
      const novaData = new Date(tarefaAtualizada.dt_vencimento)
      
      if (tarefaAtualizada.recorrencia === 'DIARIAMENTE') novaData.setDate(novaData.getDate() + 1)
      else if (tarefaAtualizada.recorrencia === 'SEMANALMENTE') novaData.setDate(novaData.getDate() + 7)
      else if (tarefaAtualizada.recorrencia === 'MENSALMENTE') novaData.setMonth(novaData.getMonth() + 1)

      await prisma.tarefa.create({
          data: {
              titulo: tarefaAtualizada.titulo,
              descricao: tarefaAtualizada.descricao,
              projeto_id: tarefaAtualizada.projeto_id,
              usuario_id: tarefaAtualizada.usuario_id,
              prioridade_id: tarefaAtualizada.prioridade_id,
              dificuldade_id: tarefaAtualizada.dificuldade_id,
              coluna_id: tarefaAtualizada.coluna_id,
              recorrencia: tarefaAtualizada.recorrencia,
              dt_vencimento: novaData,
              concluida: false
          }
      })
  }

  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
}

export async function excluirTarefa(tarefaId: string, projetoId: string) {
  // Apaga comentários e históricos
  await prisma.comentario.deleteMany({ where: { tarefa_id: tarefaId } })
  await prisma.historicoTarefa.deleteMany({ where: { tarefa_id: tarefaId } }) // Limpa histórico

  await prisma.tarefa.delete({ where: { id: tarefaId } })
  
  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
  revalidatePath('/')
}

// ATUALIZADO COM LOG DE DATA
export async function atualizarDataTarefa(tarefaId: string, novaData: Date, projetoId: string) {
  const session = await auth()
  
  const tarefaAntiga = await prisma.tarefa.findUnique({ where: { id: tarefaId } })

  await prisma.tarefa.update({ where: { id: tarefaId }, data: { dt_vencimento: novaData } })

  // Log
  if (session?.user?.email && tarefaAntiga) {
      const quemFez = await prisma.usuario.findUnique({ where: { email: session.user.email } })
      if (quemFez) {
          await prisma.historicoTarefa.create({
              data: {
                  tarefa_id: tarefaId,
                  usuario_id: quemFez.id,
                  campo: 'DT_VENCIMENTO',
                  valor_antigo: tarefaAntiga.dt_vencimento?.toLocaleDateString('pt-BR'),
                  valor_novo: novaData.toLocaleDateString('pt-BR')
              }
          })
      }
  }

  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
}

export async function getColunasDoWorkspace() {
  const session = await auth()
  if (!session?.user?.email) return []

  const usuario = await prisma.usuario.findUnique({ where: { email: session.user.email } })
  if (!usuario?.workspace_id) return []

  return await prisma.coluna.findMany({
    where: { workspace_id: usuario.workspace_id },
    orderBy: { nome: 'asc' }
  })
}

export async function criarProjeto(formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) return
  
  const usuario = await prisma.usuario.findUnique({ where: { email: session.user.email } })
  if (!usuario) return

  const nome = formData.get('nome') as string
  const descricao = formData.get('descricao') as string
  
  const colunasSelecionadasIds = formData.getAll('colunas') as string[]

  const novoProjeto = await prisma.projeto.create({
    data: {
      nome,
      descricao,
      workspace_id: usuario.workspace_id!, 
      usuario_id: usuario.id,
      dt_acesso: new Date()
    }
  })

  if (colunasSelecionadasIds.length > 0) {
      let ordem = 1
      for (const colunaId of colunasSelecionadasIds) {
          await prisma.projetoColuna.create({
              data: {
                  projeto_id: novoProjeto.id,
                  coluna_id: colunaId,
                  ordem: ordem++ 
              }
          })
      }
  }

  revalidatePath('/')
  revalidatePath('/projetos')
}

export async function criarColuna(formData: FormData) {
  const nome = formData.get('nome') as string
  const workspaceId = formData.get('workspaceId') as string
  if (!nome || !workspaceId) return
  await prisma.coluna.create({ data: { nome, workspace_id: workspaceId } })
  revalidatePath('/configuracoes/colunas')
}

export async function excluirColuna(formData: FormData) {
  const id = formData.get('id') as string
  try {
    await prisma.coluna.delete({ where: { id } })
    revalidatePath('/configuracoes/colunas')
  } catch (error) { console.log("Erro ao excluir") }
}

export async function vincularMultiplasColunas(formData: FormData) {
    const projetoId = formData.get('projetoId') as string
    const colunasIds = formData.getAll('colunasIds') as string[]
    if (!projetoId || colunasIds.length === 0) return
    
    const ultimaColuna = await prisma.projetoColuna.findFirst({
        where: { projeto_id: projetoId },
        orderBy: { ordem: 'desc' }
    })
    let proximaOrdem = (ultimaColuna?.ordem || 0) + 1
    
    for (const colId of colunasIds) {
        const existe = await prisma.projetoColuna.findUnique({
             where: { projeto_id_coluna_id: { projeto_id: projetoId, coluna_id: colId } }
        })
        if (!existe) {
            await prisma.projetoColuna.create({
                data: { projeto_id: projetoId, coluna_id: colId, ordem: proximaOrdem }
            })
            proximaOrdem++
        }
    }
    revalidatePath(`/projeto/${projetoId}`)
}

export async function desvincularColunaDoProjeto(formData: FormData) {
    const projetoId = formData.get('projetoId') as string
    const colunaId = formData.get('colunaId') as string
    await prisma.projetoColuna.deleteMany({
      where: { projeto_id: projetoId, coluna_id: colunaId }
    })
    revalidatePath(`/projeto/${projetoId}`)
}

export async function getProjetosRecentesSidebar() {
    return await prisma.projeto.findMany({
      orderBy: { dt_acesso: 'desc' },
      take: 10
    })
}

export async function getUsuariosDoWorkspace() {
  const session = await auth()
  if (!session?.user?.email) return []

  const solicitante = await prisma.usuario.findUnique({ where: { email: session.user.email } })
  
  if (solicitante?.role !== 'OWNER') return []

  return await prisma.usuario.findMany({
    where: { workspace_id: solicitante.workspace_id },
    orderBy: { nome: 'asc' }
  })
}

export async function criarNovoUsuario(formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) return { erro: 'Sem permissão' }

  const solicitante = await prisma.usuario.findUnique({ where: { email: session.user.email } })
  
  if (solicitante?.role !== 'OWNER') {
    return { erro: 'Apenas administradores podem criar usuários.' }
  }

  const nome = formData.get('nome') as string
  const email = formData.get('email') as string
  const senha = formData.get('senha') as string
  const cargo = formData.get('cargo') as string
  let role = formData.get('role') as string
  if (role !== 'MANAGER') role = 'MEMBER'

  const existe = await prisma.usuario.findUnique({ where: { email } })
  if (existe) return { erro: 'E-mail já cadastrado.' }

  const senhaHash = await bcrypt.hash(senha, 10)

  await prisma.usuario.create({
    data: {
      nome,
      email,
      senha: senhaHash,
      cargo: cargo || 'Colaborador',
      role: role, 
      ativo: true,
      workspace_id: solicitante.workspace_id!
    }
  })

  revalidatePath('/configuracoes/usuarios')
  return { sucesso: true }
}

export async function toggleStatusUsuario(usuarioAlvoId: string) {
  const session = await auth()
  if (!session?.user?.email) return

  const solicitante = await prisma.usuario.findUnique({ where: { email: session.user.email } })
  if (solicitante?.role !== 'OWNER') return

  const alvo = await prisma.usuario.findUnique({ where: { id: usuarioAlvoId } })
  if (!alvo) return

  if (alvo.id === solicitante.id) return 

  await prisma.usuario.update({
    where: { id: usuarioAlvoId },
    data: { ativo: !alvo.ativo }
  })

  revalidatePath('/configuracoes/usuarios')
}

export async function reordenarColunas(projetoId: string, colunasIds: string[]) {
  try {
    await prisma.$transaction(
      colunasIds.map((colunaId, index) => 
        prisma.projetoColuna.update({
          where: {
            projeto_id_coluna_id: {
              projeto_id: projetoId,
              coluna_id: colunaId
            }
          },
          data: { ordem: index + 1 }
        })
      )
    )
    revalidatePath(`/projeto/${projetoId}`)
  } catch (error) {
    console.error("Erro ao reordenar colunas:", error)
  }
}


export async function salvarAnexoNoBanco(dados: {
    nome: string,
    url: string,
    key: string,
    tamanho: number,
    tarefaId: string
}) {
    'use server' // Garante que roda no servidor
    
    const novoAnexo = await prisma.anexo.create({
        data: {
            nome: dados.nome,
            url: dados.url,
            key: dados.key,
            tamanho: dados.tamanho,
            tarefa_id: dados.tarefaId
        }
    })

    // Atualiza a tela para aparecer o anexo novo
    revalidatePath('/') 

    return novoAnexo
}

export async function excluirAnexo(anexoId: string) {
    'use server'

    const session = await auth() // Precisa pegar quem está apagando

    // 1. Busca dados antes de apagar (para saber o nome e a key)
    const anexo = await prisma.anexo.findUnique({
        where: { id: anexoId },
        include: { tarefa: true } // Para pegar o ID do projeto/tarefa
    })

    if (!anexo) return

    // 2. Apaga da Nuvem (UploadThing)
    try {
        await utapi.deleteFiles(anexo.key)
    } catch (error) {
        console.error("Erro storage:", error)
    }

    // 3. Apaga do Banco
    await prisma.anexo.delete({ where: { id: anexoId } })

    // 4. [NOVO] Gera o Log de Auditoria
    if (session?.user?.email) {
        const usuario = await prisma.usuario.findUnique({ where: { email: session.user.email } })
        
        if (usuario) {
            await prisma.historicoTarefa.create({
                data: {
                    tarefa_id: anexo.tarefa_id,
                    usuario_id: usuario.id,
                    campo: 'ANEXO_REMOVIDO',
                    valor_antigo: anexo.nome, // Salva o nome do arquivo que morreu
                    valor_novo: 'Excluído'
                }
            })
        }
    }
    
    revalidatePath('/')
}

export async function atualizarImagemProjeto(projetoId: string, novaUrlImagem: string) {
    'use server'
    
    // 1. Busca a imagem ANTIGA antes de atualizar
    const projetoAntigo = await prisma.projeto.findUnique({
        where: { id: projetoId },
        select: { imagem: true }
    })

    // 2. Se existia uma imagem antiga, vamos apagá-la do Storage
    if (projetoAntigo?.imagem) {
        try {
            // A URL do UploadThing geralmente é assim: https://utfs.io/f/CHAVE-DO-ARQUIVO
            // Precisamos pegar só a parte final (a CHAVE)
            const keyAntiga = projetoAntigo.imagem.split('/f/')[1]

            if (keyAntiga) {
                await utapi.deleteFiles(keyAntiga)
            }
        } catch (error) {
            console.error("Erro ao apagar logo antiga:", error)
            // Não paramos o fluxo aqui, pois o importante é atualizar a nova
        }
    }

    // 3. Atualiza o banco com a NOVA imagem
    await prisma.projeto.update({
        where: { id: projetoId },
        data: { imagem: novaUrlImagem }
    })
    
    revalidatePath('/projetos')
    revalidatePath('/')
    revalidatePath(`/projeto/${projetoId}`)
}