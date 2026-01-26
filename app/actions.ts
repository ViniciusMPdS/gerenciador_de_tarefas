'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth, signIn } from '@/auth'
import { AuthError } from 'next-auth'
import bcrypt from 'bcryptjs'

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

// --- TAREFAS ---

export async function criarTarefa(formData: FormData) {
  const titulo = formData.get('titulo') as string
  const descricao = formData.get('descricao') as string 
  const prioridadeId = Number(formData.get('prioridadeId'))
  const dificuldadeId = Number(formData.get('dificuldadeId'))
  
  const projetoId = formData.get('projetoId') as string
  const usuarioId = formData.get('usuarioId') as string
  const dtVencimentoStr = formData.get('dtVencimento') as string
  let colunaId = formData.get('colunaId') as string

  if (!titulo || !descricao || !prioridadeId || !dificuldadeId || !projetoId || !usuarioId || !dtVencimentoStr) return 

  if (!colunaId) {
     const primeiraColuna = await prisma.projetoColuna.findFirst({
        where: { projeto_id: projetoId },
        orderBy: { ordem: 'asc' }
     })
     if (primeiraColuna) colunaId = primeiraColuna.coluna_id
  }

  await prisma.tarefa.create({
    data: {
      titulo,
      descricao,
      prioridade_id: prioridadeId,
      dificuldade_id: dificuldadeId,
      concluida: false,
      coluna_id: colunaId || undefined,
      projeto_id: projetoId,
      usuario_id: usuarioId,
      dt_vencimento: new Date(dtVencimentoStr)
    },
  })

  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
}

// --- NOVA FUNÇÃO DE ATUALIZAR (Para o Modal de Edição) ---
export async function atualizarTarefa(
  tarefaId: string, 
  dados: { 
    titulo: string; 
    descricao: string; 
    prioridadeId: number; 
    dificuldadeId: number; 
    usuarioId: string 
  },
  projetoId: string
) {
  const session = await auth()
  if (!session) return

  await prisma.tarefa.update({
    where: { id: tarefaId },
    data: {
      titulo: dados.titulo,
      descricao: dados.descricao,
      prioridade_id: dados.prioridadeId,
      dificuldade_id: dados.dificuldadeId,
      
      // CORREÇÃO: Usamos direto o ID. Se vier vazio, mandamos null.
      // Isso evita o conflito de tipos do Prisma.
      usuario_id: dados.usuarioId || null, 
    }
  })

  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath('/minhas-tarefas')
  revalidatePath('/')
}

export async function concluirTarefaComComentario(tarefaId: string, comentario: string, projetoId: string, usuarioId: string) {
  await prisma.tarefa.update({
    where: { id: tarefaId },
    data: { concluida: true, dt_conclusao: new Date() }
  })

  if (comentario) {
    await prisma.comentario.create({
      data: { texto: `🏁 ENCERRAMENTO: ${comentario}`, tarefa_id: tarefaId, usuario_id: usuarioId }
    })
  }
  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
}

// Essa função antiga (editarTarefa com FormData) pode ser mantida ou removida, 
// mas a nova `atualizarTarefa` acima é a que o Modal usa.
export async function editarTarefa(formData: FormData) {
  const id = formData.get('id') as string
  const projeto_id = formData.get('projetoId') as string
  const titulo = formData.get('titulo') as string
  const descricao = formData.get('descricao') as string
  
  const prioridadeId = Number(formData.get('prioridadeId'))
  const dificuldadeId = Number(formData.get('dificuldadeId'))
  
  const usuario_id = formData.get('usuarioId') as string
  const dt_vencimento = formData.get('dtVencimento') as string ? new Date(formData.get('dtVencimento') as string) : null

  await prisma.tarefa.update({
    where: { id },
    data: { 
        titulo, 
        descricao, 
        prioridade_id: prioridadeId, 
        dificuldade_id: dificuldadeId, 
        dt_vencimento, 
        usuario_id 
    }
  })
  revalidatePath(`/projeto/${projeto_id}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
}

export async function adicionarComentario(formData: FormData) {
  const texto = formData.get('texto') as string
  const tarefaId = formData.get('tarefaId') as string
  const projetoId = formData.get('projetoId') as string
  const usuarioId = formData.get('usuarioId') as string 

  if (!texto || !tarefaId || !usuarioId) return null

  const novoComentario = await prisma.comentario.create({
    data: { texto, tarefa_id: tarefaId, usuario_id: usuarioId },
    include: { usuario: true }
  })
  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
  return novoComentario
}

export async function moverTarefaDeColuna(tarefaId: string, novaColunaId: string, projetoId: string) {
  await prisma.tarefa.update({
    where: { id: tarefaId },
    data: { coluna_id: novaColunaId }
  })
  revalidatePath(`/projeto/${projetoId}`)
}

export async function toggleConcluida(tarefaId: string, isConcluida: boolean, projetoId: string) {
  await prisma.tarefa.update({
    where: { id: tarefaId },
    data: { concluida: isConcluida, dt_conclusao: isConcluida ? new Date() : null }
  })
  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
}

// --- ATUALIZADO: Excluir Tarefa (Apaga comentários antes) ---
export async function excluirTarefa(tarefaId: string, projetoId: string) {
  // Apaga comentários primeiro para não dar erro de chave estrangeira
  await prisma.comentario.deleteMany({
    where: { tarefa_id: tarefaId }
  })

  await prisma.tarefa.delete({ where: { id: tarefaId } })
  
  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
  revalidatePath('/')
}

export async function atualizarDataTarefa(tarefaId: string, novaData: Date, projetoId: string) {
  await prisma.tarefa.update({ where: { id: tarefaId }, data: { dt_vencimento: novaData } })
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

  // Verifica quem está pedindo
  const solicitante = await prisma.usuario.findUnique({ where: { email: session.user.email } })
  
  // Segurança: Se não for OWNER, não retorna nada
  if (solicitante?.role !== 'OWNER') return []

  return await prisma.usuario.findMany({
    where: { workspace_id: solicitante.workspace_id },
    orderBy: { nome: 'asc' }
  })
}

// --- ATUALIZADO: Criar Usuário com ROLE correta ---
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
  
  // LER O CARGO ESCOLHIDO NO FORMULÁRIO (MEMBER ou MANAGER)
  let role = formData.get('role') as string
  // Proteção: Se vier algo estranho, força MEMBER
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
      role: role, // <--- Agora usa a variável correta
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