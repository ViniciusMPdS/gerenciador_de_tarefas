'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth, signIn } from '@/auth'
import { AuthError } from 'next-auth'
import bcrypt from 'bcryptjs'
import { Recorrencia, CampoAlterado } from '@prisma/client'
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
  if (!data.titulo || !data.projeto_id) return 

  let colunaId = data.coluna_id

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

export async function atualizarTarefa(
  tarefaId: string, 
  data: AtualizarTarefaDTO,
  projetoId: string
) {
  const session = await auth()
  if (!session?.user?.email) return

  const quemAlterou = await prisma.usuario.findUnique({ where: { email: session.user.email } })
  if (!quemAlterou) return

  const tarefaAntiga = await prisma.tarefa.findUnique({
      where: { id: tarefaId },
      include: { prioridade: true, dificuldade: true, usuario: true, coluna: true }
  })
  if (!tarefaAntiga) return

  await prisma.tarefa.update({
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

  const logsParaCriar = []

  if (tarefaAntiga.titulo !== data.titulo) {
      logsParaCriar.push({ campo: CampoAlterado.TITULO, antigo: tarefaAntiga.titulo, novo: data.titulo })
  }
  if ((tarefaAntiga.descricao || '') !== (data.descricao || '')) {
      logsParaCriar.push({ campo: CampoAlterado.DESCRICAO, antigo: null, novo: 'Alterada' })
  }
  const dataAntigaISO = tarefaAntiga.dt_vencimento?.toISOString()
  const dataNovaISO = data.dt_vencimento?.toISOString()
  if (dataAntigaISO !== dataNovaISO) {
      logsParaCriar.push({ 
          campo: CampoAlterado.DT_VENCIMENTO, 
          antigo: tarefaAntiga.dt_vencimento ? tarefaAntiga.dt_vencimento.toLocaleDateString('pt-BR') : 'Sem data', 
          novo: data.dt_vencimento ? data.dt_vencimento.toLocaleDateString('pt-BR') : 'Sem data' 
      })
  }
  if (tarefaAntiga.prioridade_id !== data.prioridade_id) {
      logsParaCriar.push({ campo: CampoAlterado.PRIORIDADE, antigo: tarefaAntiga.prioridade.nome, novo: data.prioridade_id.toString() })
  }
  if (tarefaAntiga.usuario_id !== data.usuario_id) {
      logsParaCriar.push({ 
          campo: CampoAlterado.RESPONSAVEL, 
          antigo: tarefaAntiga.usuario?.nome || 'Sem dono', 
          novo: data.usuario_id ? 'Novo Responsável' : 'Sem dono' 
      })
  }
  if (tarefaAntiga.coluna_id !== data.coluna_id) {
     logsParaCriar.push({ 
         campo: CampoAlterado.COLUNA, 
         antigo: tarefaAntiga.coluna?.nome || 'N/A', 
         novo: 'Nova Etapa' 
     })
  }

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

export async function editarTarefa(formData: FormData) {
}

export async function adicionarComentario(tarefaId: string, texto: string, imagemUrl?: string | null) {
  const session = await auth()
  if (!session?.user?.email) return null
  
  const usuario = await prisma.usuario.findUnique({ where: { email: session.user.email } })
  if (!texto && !imagemUrl) return null // Impede comentário vazio
  if (!tarefaId || !usuario) return null

  const novoComentario = await prisma.comentario.create({
    data: { 
        texto: texto || "", // Garante string vazia se for só imagem
        tarefa_id: tarefaId, 
        usuario_id: usuario.id,
        imagemUrl: imagemUrl || null
    },
    include: { usuario: true }
  })
  
  revalidatePath('/')
  revalidatePath('/minhas-tarefas')
  revalidatePath('/sprint')
  
  return novoComentario
}

export async function excluirComentario(comentarioId: string, usuarioSolicitanteId: string) {
  'use server'

  const comentario = await prisma.comentario.findUnique({
    where: { id: comentarioId },
    include: { usuario: true }
  })

  if (!comentario) {
    throw new Error("Comentário não encontrado.")
  }

  const ehDono = comentario.usuario_id === usuarioSolicitanteId
  const ehAdmin = false 

  if (!ehDono && !ehAdmin) {
    throw new Error("Você não tem permissão para excluir este comentário.")
  }

  await prisma.comentario.delete({
    where: { id: comentarioId }
  })

  revalidatePath('/')
  return true
}

export async function editarComentario(comentarioId: string, novoTexto: string, usuarioSolicitanteId: string) {
  'use server'

  const comentario = await prisma.comentario.findUnique({
    where: { id: comentarioId }
  })

  if (!comentario) {
    throw new Error("Comentário não encontrado.")
  }

  if (comentario.usuario_id !== usuarioSolicitanteId) {
    throw new Error("Apenas o autor pode editar o comentário.")
  }

  await prisma.comentario.update({
    where: { id: comentarioId },
    data: { 
      texto: novoTexto,
      dt_update: new Date()
    }
  })

  revalidatePath('/')
  return true
}

export async function moverTarefaDeColuna(tarefaId: string, novaColunaId: string, projetoId: string) {
  const session = await auth()
  
  const tarefaAntiga = await prisma.tarefa.findUnique({ 
      where: { id: tarefaId },
      include: { coluna: true }
  })

  if (!tarefaAntiga) return

  if (tarefaAntiga.coluna_id !== novaColunaId) {
      
      await prisma.tarefa.update({
        where: { id: tarefaId },
        data: { coluna_id: novaColunaId }
      })

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

export async function toggleConcluida(tarefaId: string, isConcluida: boolean, projetoId: string) {
  const session = await auth()

  const tarefaAtualizada = await prisma.tarefa.update({
    where: { id: tarefaId },
    data: { concluida: isConcluida, dt_conclusao: isConcluida ? new Date() : null }
  })

  if (session?.user?.email) {
      const quemFez = await prisma.usuario.findUnique({ where: { email: session.user.email } })
      if (quemFez) {
          await prisma.historicoTarefa.create({
              data: {
                  tarefa_id: tarefaId,
                  usuario_id: quemFez.id,
                  campo: isConcluida ? 'CONCLUSAO' : 'REABERTURA',
                  valor_novo: isConcluida ? 'Concluída via Checkbox' : 'Reaberta'
              }
          })
      }
  }

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
  await prisma.comentario.deleteMany({ where: { tarefa_id: tarefaId } })
  await prisma.historicoTarefa.deleteMany({ where: { tarefa_id: tarefaId } })

  await prisma.tarefa.delete({ where: { id: tarefaId } })
  
  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
  revalidatePath('/')
}

export async function atualizarDataTarefa(tarefaId: string, novaData: Date, projetoId: string) {
  const session = await auth()
  
  const tarefaAntiga = await prisma.tarefa.findUnique({ where: { id: tarefaId } })

  await prisma.tarefa.update({ where: { id: tarefaId }, data: { dt_vencimento: novaData } })

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

// --- BUSCA COLUNAS DA EQUIPE ---
export async function getColunasDaEquipe(equipeId: string) {
  if (!equipeId) return []
  return await prisma.coluna.findMany({
    where: { equipe_id: equipeId },
    orderBy: { nome: 'asc' }
  })
}

// --- CRIA COLUNA VINCULADA À EQUIPE ---
export async function criarColuna(formData: FormData) {
  const nome = formData.get('nome') as string
  const workspaceId = formData.get('workspaceId') as string
  const equipeId = formData.get('equipeId') as string // <--- Pega a Equipe

  if (!nome || !workspaceId || !equipeId) return

  await prisma.coluna.create({ 
      data: { 
          nome, 
          workspace_id: workspaceId,
          equipe_id: equipeId // <--- Salva no banco vinculado à Equipe
      } 
  })
  // Revalida a página da equipe atual
  revalidatePath(`/equipe/${equipeId}/configuracoes/colunas`)
}

export async function criarProjeto(formData: FormData) {
  // --- 1. PEGA O USUÁRIO E WORKSPACE LOGADO COM SEGURANÇA ---
  const session = await auth()
  if (!session?.user?.email) return 

  const usuarioLogado = await prisma.usuario.findUnique({
      where: { email: session.user.email }
  })
  if (!usuarioLogado) return

  const usuarioId = usuarioLogado.id
  const workspaceId = usuarioLogado.workspace_id
  // ---------------------------------------------------------

  const nome = formData.get('nome') as string
  const descricao = formData.get('descricao') as string
  const equipeId = formData.get('equipeId') as string
  
  // --- CAMPOS ONBLOX ---
  const isTemplateOnblox = formData.get('isTemplateOnblox') === 'true'
  
  // Inteligência do ERP (Se for Outro, pega o campo de texto)
  const erpSelect = formData.get('erpSelect') as string
  const erpPersonalizado = formData.get('erpPersonalizado') as string
  const erpFinal = erpSelect === 'Outro' ? erpPersonalizado : erpSelect

  const dadosAcesso = formData.get('dadosAcesso') as string
  const pacoteOnblox = formData.get('pacote_onblox') as string
  const tipoIntegracao = formData.get('tipo_integracao') as string
  
  // Status e Pausa
  const statusCliente = formData.get('status_cliente') as string || 'EM_ANDAMENTO'
  const motivoPausa = formData.get('motivo_pausa') as string

  // Agora só verificamos o Nome, pois o resto nós garantimos via servidor!
  if (!nome) return

  // 1. Cria o Projeto
  const projeto = await prisma.projeto.create({
      data: {
          nome,
          descricao,
          workspace_id: workspaceId,
          usuario_id: usuarioId,
          equipe_id: equipeId || null,
          ...(isTemplateOnblox && {
              fase_macro: 'MODELAGEM', 
              erp: erpFinal,
              dados_acesso: dadosAcesso,
              pacote_onblox: pacoteOnblox,
              tipo_integracao: tipoIntegracao,
              status_cliente: statusCliente,
              motivo_pausa: statusCliente === 'PAUSADO' ? motivoPausa : null
          })
      }
  })

  // 2. Se for uma Implantação Onblox, injeta as Colunas Padrão automaticamente!
  if (isTemplateOnblox && equipeId) {
      const colunasPadrao = [
          { nome: 'MODELAGEM', cor: '#3b82f6' }, // Azul
          { nome: 'CADASTROS BASICOS', cor: '#8b5cf6' }, // Roxo
          { nome: 'GO LIVE DE PROCESSOS', cor: '#10b981' }, // Verde
          { nome: 'ATIVIDADES DIA A DIA', cor: '#f59e0b' } // Laranja
      ]

      let ordem = 1;
      for (const col of colunasPadrao) {
          // A. Verifica se essa coluna já existe na biblioteca desta equipe
          let colunaDb = await prisma.coluna.findFirst({
              where: { nome: col.nome, equipe_id: equipeId, workspace_id: workspaceId }
          })

          // B. Se não existir, cadastra na biblioteca da equipe
          if (!colunaDb) {
              colunaDb = await prisma.coluna.create({
                  data: {
                      nome: col.nome,
                      cor: col.cor,
                      workspace_id: workspaceId,
                      equipe_id: equipeId
                  }
              })
          }

          // C. Vincula a coluna ao Projeto Novo na ordem correta
          await prisma.projetoColuna.create({
              data: {
                  projeto_id: projeto.id,
                  coluna_id: colunaDb.id,
                  ordem: ordem
              }
          })
          ordem++;
      }
  }

  // Atualiza as telas
  if (equipeId) {
      revalidatePath(`/equipe/${equipeId}`)
  } else {
      revalidatePath('/')
  }
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

export async function getProjetosRecentesSidebar(equipeId: string) {
    if (!equipeId) return []
    
    return await prisma.projeto.findMany({
      where: { 
          equipe_id: equipeId,
          ativo: true 
      },
      orderBy: { dt_acesso: 'desc' },
      take: 9
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

// --- NOVA FUNÇÃO: ALTERAR SENHA (OWNER) ---
export async function alterarSenhaUsuario(usuarioId: string, novaSenha: string) {
  const session = await auth()
  
  // 1. Verificação de Segurança
  const solicitante = await prisma.usuario.findUnique({ where: { email: session?.user?.email || '' } })
  if (solicitante?.role !== 'OWNER') {
      throw new Error("Apenas o OWNER pode alterar senhas.")
  }

  // 2. Validação
  if (!novaSenha || novaSenha.trim() === '') {
      throw new Error("A senha não pode ser vazia.")
  }

  // 3. Hash
  const hashedPassword = await bcrypt.hash(novaSenha, 10)

  // 4. Update
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { senha: hashedPassword }
  })

  revalidatePath('/configuracoes/usuarios')
  return { success: true }
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
    'use server'
    
    const novoAnexo = await prisma.anexo.create({
        data: {
            nome: dados.nome,
            url: dados.url,
            key: dados.key,
            tamanho: dados.tamanho,
            tarefa_id: dados.tarefaId
        }
    })

    revalidatePath('/') 
    return novoAnexo
}

export async function excluirAnexo(anexoId: string) {
    'use server'

    const session = await auth() 

    const anexo = await prisma.anexo.findUnique({
        where: { id: anexoId },
        include: { tarefa: true } 
    })

    if (!anexo) return

    try {
        await utapi.deleteFiles(anexo.key)
    } catch (error) {
        console.error("Erro storage:", error)
    }

    await prisma.anexo.delete({ where: { id: anexoId } })

    if (session?.user?.email) {
        const usuario = await prisma.usuario.findUnique({ where: { email: session.user.email } })
        
        if (usuario) {
            await prisma.historicoTarefa.create({
                data: {
                    tarefa_id: anexo.tarefa_id,
                    usuario_id: usuario.id,
                    campo: 'ANEXO_REMOVIDO',
                    valor_antigo: anexo.nome,
                    valor_novo: 'Excluído'
                }
            })
        }
    }
    
    revalidatePath('/')
}

export async function atualizarImagemProjeto(projetoId: string, novaUrlImagem: string) {
    'use server'
    
    const projetoAntigo = await prisma.projeto.findUnique({
        where: { id: projetoId },
        select: { imagem: true }
    })

    if (projetoAntigo?.imagem) {
        try {
            const keyAntiga = projetoAntigo.imagem.split('/f/')[1]

            if (keyAntiga) {
                await utapi.deleteFiles(keyAntiga)
            }
        } catch (error) {
            console.error("Erro ao apagar logo antiga:", error)
        }
    }

    await prisma.projeto.update({
        where: { id: projetoId },
        data: { imagem: novaUrlImagem }
    })
    
    revalidatePath('/projetos')
    revalidatePath('/')
    revalidatePath(`/projeto/${projetoId}`)
}


export async function criarEquipe(formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) return // Retorno vazio (void) para satisfazer o TS

  const usuarioLogado = await prisma.usuario.findUnique({ where: { email: session.user.email } })
  if (usuarioLogado?.role !== 'OWNER') return // Retorno vazio (void)

  const nome = formData.get('nome') as string
  if (!nome) return // Retorno vazio (void)

  // Cria a equipe
  const novaEquipe = await prisma.equipe.create({
      data: {
          nome,
          workspace_id: usuarioLogado.workspace_id!
      }
  })

  // Já vincula o criador (OWNER) como LIDER desta nova equipe
  await prisma.equipeUsuario.create({
      data: {
          equipe_id: novaEquipe.id,
          usuario_id: usuarioLogado.id,
          role: 'LIDER'
      }
  })

  revalidatePath('/configuracoes/equipes')
  revalidatePath('/', 'layout') // Atualiza a Topbar globalmente
}

// --- GESTÃO DE DETALHES DA EQUIPE ---

export async function atualizarNomeEquipe(equipeId: string, novoNome: string) {
  if (!equipeId || !novoNome) return
  await prisma.equipe.update({
      where: { id: equipeId },
      data: { nome: novoNome }
  })
  revalidatePath('/configuracoes/equipes')
  revalidatePath('/', 'layout')
}

export async function adicionarMembroEquipe(formData: FormData) {
  const equipeId = formData.get('equipeId') as string
  const usuarioId = formData.get('usuarioId') as string

  if (!equipeId || !usuarioId) return

  const existe = await prisma.equipeUsuario.findFirst({
      where: { equipe_id: equipeId, usuario_id: usuarioId }
  })

  if (!existe) {
      await prisma.equipeUsuario.create({
          data: { equipe_id: equipeId, usuario_id: usuarioId, role: 'MEMBER' }
      })
  }
  revalidatePath(`/configuracoes/equipes/${equipeId}`)
}

export async function removerMembroEquipe(formData: FormData) {
  const equipeId = formData.get('equipeId') as string
  const usuarioId = formData.get('usuarioId') as string

  await prisma.equipeUsuario.deleteMany({
      where: { equipe_id: equipeId, usuario_id: usuarioId }
  })
  revalidatePath(`/configuracoes/equipes/${equipeId}`)
}


// --- GESTÃO DE PROJETOS (EDITAR / EXCLUIR) ---

export async function editarProjeto(formData: FormData) {
  const id = formData.get('id') as string
  const nome = formData.get('nome') as string
  const descricao = formData.get('descricao') as string
  const equipeId = formData.get('equipeId') as string
  
  // --- CAMPOS ONBLOX ---
  const erp = formData.get('erp') as string
  const dadosAcesso = formData.get('dadosAcesso') as string
  const pacoteOnblox = formData.get('pacote_onblox') as string
  const tipoIntegracao = formData.get('tipo_integracao') as string
  
  // Status e Pausa
  const statusCliente = formData.get('status_cliente') as string
  const motivoPausa = formData.get('motivo_pausa') as string

  if (!id || !nome) return

  await prisma.projeto.update({
      where: { id },
      data: {
          nome,
          descricao,
          // Atualiza os campos Onblox (se vierem vazios, não tem problema)
          erp,
          dados_acesso: dadosAcesso,
          pacote_onblox: pacoteOnblox,
          tipo_integracao: tipoIntegracao,
          status_cliente: statusCliente,
          // Se o status não for PAUSADO, ele limpa o motivo da pausa
          motivo_pausa: statusCliente === 'PAUSADO' ? motivoPausa : null
      }
  })

  if (equipeId) {
      revalidatePath(`/equipe/${equipeId}/projeto/${id}`)
  }
}

export async function excluirProjetoCompleto(projetoId: string) {
  // 1. Busca todas as tarefas do projeto para limpar as dependências
  const tarefas = await prisma.tarefa.findMany({ 
      where: { projeto_id: projetoId }, 
      select: { id: true } 
  })
  const tarefaIds = tarefas.map(t => t.id)

  // 2. Limpa tudo em cascata para não dar erro no banco
  if (tarefaIds.length > 0) {
      await prisma.comentario.deleteMany({ where: { tarefa_id: { in: tarefaIds } } })
      await prisma.historicoTarefa.deleteMany({ where: { tarefa_id: { in: tarefaIds } } })
      await prisma.anexo.deleteMany({ where: { tarefa_id: { in: tarefaIds } } })
      await prisma.tarefa.deleteMany({ where: { projeto_id: projetoId } })
  }

  // 3. Limpa as colunas vinculadas e finalmente o projeto
  await prisma.projetoColuna.deleteMany({ where: { projeto_id: projetoId } })
  await prisma.projeto.delete({ where: { id: projetoId } })

  revalidatePath('/', 'layout')
  return { success: true }
}

// --- EXCLUSÃO DE EQUIPA (ZONA DE PERIGO) ---

export async function excluirEquipe(equipeId: string) {
  const session = await auth()
  if (!session?.user?.email) return { erro: 'Sem permissão' }

  const usuarioLogado = await prisma.usuario.findUnique({ where: { email: session.user.email } })
  if (usuarioLogado?.role !== 'OWNER') return { erro: 'Apenas admins podem excluir equipas' }

  // 1. Procura todos os projetos desta equipa
  const projetos = await prisma.projeto.findMany({ 
      where: { equipe_id: equipeId }, 
      select: { id: true } 
  })
  const projetosIds = projetos.map(p => p.id)

  // 2. Se houver projetos, limpa tudo o que está dentro deles
  if (projetosIds.length > 0) {
      const tarefas = await prisma.tarefa.findMany({ 
          where: { projeto_id: { in: projetosIds } }, 
          select: { id: true } 
      })
      const tarefasIds = tarefas.map(t => t.id)

      if (tarefasIds.length > 0) {
          await prisma.comentario.deleteMany({ where: { tarefa_id: { in: tarefasIds } } })
          await prisma.historicoTarefa.deleteMany({ where: { tarefa_id: { in: tarefasIds } } })
          await prisma.anexo.deleteMany({ where: { tarefa_id: { in: tarefasIds } } })
          await prisma.tarefa.deleteMany({ where: { projeto_id: { in: projetosIds } } })
      }

      await prisma.projetoColuna.deleteMany({ where: { projeto_id: { in: projetosIds } } })
      await prisma.projeto.deleteMany({ where: { equipe_id: equipeId } })
  }

  // 3. Apaga as colunas (etapas) exclusivas da equipa
  await prisma.coluna.deleteMany({ where: { equipe_id: equipeId } })

  // 4. Remove os utilizadores da equipa
  await prisma.equipeUsuario.deleteMany({ where: { equipe_id: equipeId } })

  // 5. Finalmente, apaga a equipa
  await prisma.equipe.delete({ where: { id: equipeId } })

  revalidatePath('/configuracoes/equipes')
  revalidatePath('/', 'layout')
  
  return { sucesso: true }
}

// ==========================================
// MOTOR DE TEMPLATES (PACOTES DE TAREFAS)
// ==========================================

export async function criarPacoteTemplate(formData: FormData) {
  const equipe_id = formData.get('equipeId') as string
  const nome = formData.get('nome') as string
  const descricao = formData.get('descricao') as string

  if (!equipe_id || !nome) return

  await prisma.pacoteTemplate.create({
      data: { equipe_id, nome, descricao }
  })
  revalidatePath(`/configuracoes/equipes/${equipe_id}`)
}

export async function excluirPacoteTemplate(formData: FormData) {
  const pacote_id = formData.get('pacoteId') as string
  const equipe_id = formData.get('equipeId') as string

  if (!pacote_id) return

  // Como colocamos onDelete: Cascade no schema, apagar o pacote já apaga as tarefas dele!
  await prisma.pacoteTemplate.delete({
      where: { id: pacote_id }
  })
  revalidatePath(`/configuracoes/equipes/${equipe_id}`)
}

export async function adicionarTarefaTemplate(formData: FormData) {
  const pacote_id = formData.get('pacoteId') as string
  const equipe_id = formData.get('equipeId') as string
  const titulo = formData.get('titulo') as string
  const descricao = formData.get('descricao') as string

  if (!pacote_id || !titulo) return

  await prisma.tarefaTemplate.create({
      data: { pacote_id, titulo, descricao }
  })
  revalidatePath(`/configuracoes/equipes/${equipe_id}`)
}

export async function removerTarefaTemplate(formData: FormData) {
  const tarefa_id = formData.get('tarefaId') as string
  const equipe_id = formData.get('equipeId') as string

  if (!tarefa_id) return

  await prisma.tarefaTemplate.delete({
      where: { id: tarefa_id }
  })
  revalidatePath(`/configuracoes/equipes/${equipe_id}`)
}

// ==========================================
// INJEÇÃO DE PACOTES (O BOTÃO MÁGICO)
// ==========================================

export async function importarPacoteTarefas(formData: FormData) {
  const pacoteId = formData.get('pacoteId') as string
  const projetoId = formData.get('projetoId') as string
  const colunaId = formData.get('colunaId') as string
  const equipeId = formData.get('equipeId') as string

  // --- NOVOS CAMPOS (Todos Opcionais) ---
  const usuarioId = formData.get('usuarioId') as string
  const dtVencimento = formData.get('dtVencimento') as string
  const prioridadeId = formData.get('prioridadeId') as string
  const dificuldadeId = formData.get('dificuldadeId') as string

  if (!pacoteId || !projetoId || !colunaId) return

  const tarefasTemplate = await prisma.tarefaTemplate.findMany({
      where: { pacote_id: pacoteId }
  })

  if (tarefasTemplate.length === 0) return

  // Prepara as tarefas fundindo o que vem do Template com o que você escolheu no Modal
  const novasTarefas = tarefasTemplate.map(t => ({
      titulo: t.titulo,
      descricao: t.descricao,
      projeto_id: projetoId,
      coluna_id: colunaId,
      // Se escolheu um usuário no modal, aplica para todas. Se não, deixa sem ninguém (null)
      usuario_id: usuarioId ? usuarioId : null,
      // Se escolheu uma data, aplica para todas.
      dt_vencimento: dtVencimento ? new Date(dtVencimento) : null,
      // Se escolheu prioridade/dificuldade no modal, sobreescreve a do template
      prioridade_id: prioridadeId ? parseInt(prioridadeId) : t.prioridade_id,
      dificuldade_id: dificuldadeId ? parseInt(dificuldadeId) : t.dificuldade_id,
  }))

  await prisma.tarefa.createMany({
      data: novasTarefas
  })

  revalidatePath(`/equipe/${equipeId}/projeto/${projetoId}`)
}

export async function editarTarefaTemplate(formData: FormData) {
  const tarefa_id = formData.get('tarefaId') as string
  const equipe_id = formData.get('equipeId') as string
  const titulo = formData.get('titulo') as string
  const descricao = formData.get('descricao') as string

  if (!tarefa_id || !titulo) return

  await prisma.tarefaTemplate.update({
      where: { id: tarefa_id },
      data: { titulo, descricao }
  })
  revalidatePath(`/configuracoes/equipes/${equipe_id}`)
}


export async function atualizarFaseMacro(formData: FormData) {
  const projetoId = formData.get('projetoId') as string
  const novaFase = formData.get('novaFase') as string
  const equipeId = formData.get('equipeId') as string

  if (!projetoId || !novaFase) return

  await prisma.projeto.update({
      where: { id: projetoId },
      data: { fase_macro: novaFase }
  })
  
  revalidatePath(`/equipe/${equipeId}/portfolio`)
}