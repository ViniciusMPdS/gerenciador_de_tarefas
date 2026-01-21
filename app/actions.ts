'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- TAREFAS (CRUD COMPLETO) ---

export async function criarTarefa(formData: FormData) {
  const titulo = formData.get('titulo') as string
  const prioridade = formData.get('prioridade') as string
  const projeto_id = formData.get('projetoId') as string // Atenção: no form ainda usamos projetoId no input hidden
  
  // Novos Campos
  const descricao = formData.get('descricao') as string
  const usuario_id = formData.get('usuarioId') as string || null // Se vier vazio, fica null
  const dt_vencimento = formData.get('dtVencimento') as string ? new Date(formData.get('dtVencimento') as string) : null

  if (!titulo || !projeto_id) return

  await prisma.tarefa.create({
    data: {
      titulo,
      descricao,
      prioridade: prioridade || 'MEDIA',
      status: 'PENDENTE',
      projeto_id,
      usuario_id,
      dt_vencimento
    },
  })

  revalidatePath(`/projeto/${projeto_id}`)
}

export async function editarTarefa(formData: FormData) {
  const id = formData.get('id') as string
  const projeto_id = formData.get('projetoId') as string
  
  const titulo = formData.get('titulo') as string
  const descricao = formData.get('descricao') as string
  const prioridade = formData.get('prioridade') as string
  const usuario_id = formData.get('usuarioId') as string || null
  
  // Tratamento de Data
  const dtRaw = formData.get('dtVencimento') as string
  const dt_vencimento = dtRaw ? new Date(dtRaw) : null

  await prisma.tarefa.update({
    where: { id },
    data: {
      titulo,
      descricao,
      prioridade,
      usuario_id,
      dt_vencimento,
    }
  })

  revalidatePath(`/projeto/${projeto_id}`)
}

export async function atualizarStatusTarefa(tarefaId: string, novoStatus: string, projetoId: string) {
  // Se marcou como FEITO, gravamos a data de conclusão
  const dadosUpdate: any = { status: novoStatus }
  if (novoStatus === 'FEITO') {
    dadosUpdate.dt_conclusao = new Date()
  } else {
    dadosUpdate.dt_conclusao = null // Se reabriu, limpa a data
  }

  await prisma.tarefa.update({
    where: { id: tarefaId },
    data: dadosUpdate,
  })
  revalidatePath(`/projeto/${projetoId}`)
}

export async function excluirTarefa(tarefaId: string, projetoId: string) {
  await prisma.tarefa.delete({
    where: { id: tarefaId },
  })
  revalidatePath(`/projeto/${projetoId}`)
}

// --- PROJETOS ---

export async function criarProjeto(formData: FormData) {
  const nome = formData.get('nome') as string
  const workspace_id = formData.get('workspaceId') as string 

  if (!nome) return

  let finalWorkspaceId = workspace_id
  if (!finalWorkspaceId) {
    const ws = await prisma.workspace.findFirst()
    if (ws) finalWorkspaceId = ws.id
  }

  if (!finalWorkspaceId) return 

  const novo = await prisma.projeto.create({
    data: {
      nome,
      workspace_id: finalWorkspaceId,
    }
  })

  // O redirect leva para /projeto/ID-DO-PROJETO
  // Certifique-se que sua pasta se chama app/projeto/[id] (no singular)
  redirect(`/projeto/${novo.id}`)
}

// --- COMENTÁRIOS ---

export async function adicionarComentario(formData: FormData) {
  const texto = formData.get('texto') as string
  const tarefaId = formData.get('tarefaId') as string
  const projetoId = formData.get('projetoId') as string
  const usuarioId = formData.get('usuarioId') as string // Quem está comentando

  if (!texto || !tarefaId || !usuarioId) return

  await prisma.comentario.create({
    data: {
      texto,
      tarefa_id: tarefaId,
      usuario_id: usuarioId,
    }
  })

  revalidatePath(`/projeto/${projetoId}`)
}