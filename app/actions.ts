'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- TAREFAS ---

export async function criarTarefa(formData: FormData) {
  const titulo = formData.get('titulo') as string
  const prioridade = formData.get('prioridade') as string
  const projeto_id = formData.get('projetoId') as string
  
  // Novos campos do Schema
  const descricao = formData.get('descricao') as string
  const usuario_id = formData.get('usuarioId') as string || null
  const dt_vencimento = formData.get('dtVencimento') as string ? new Date(formData.get('dtVencimento') as string) : null
  
  // Tenta pegar a coluna (se a página enviou) ou pega a primeira disponível do projeto
  let coluna_id = formData.get('colunaId') as string

  if (!titulo || !projeto_id) return

  // Se não veio coluna, buscamos a primeira do projeto para colocar lá
  if (!coluna_id) {
     const primeiraColuna = await prisma.projetoColuna.findFirst({
        where: { projeto_id },
        orderBy: { ordem: 'asc' }
     })
     if (primeiraColuna) coluna_id = primeiraColuna.coluna_id
  }

  await prisma.tarefa.create({
    data: {
      titulo,
      descricao,
      prioridade: prioridade || 'MEDIA',
      concluida: false, // Padrão
      coluna_id: coluna_id || undefined, // Se não tiver coluna, fica null (backlog)
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
  const dt_vencimento = formData.get('dtVencimento') as string ? new Date(formData.get('dtVencimento') as string) : null
  const usuario_id = formData.get('usuarioId') as string || null

  await prisma.tarefa.update({
    where: { id },
    data: {
      titulo,
      descricao,
      prioridade,
      dt_vencimento,
      usuario_id
    }
  })

  revalidatePath(`/projeto/${projeto_id}`)
}

// Atualizada para Mover de Coluna
export async function moverTarefaDeColuna(tarefaId: string, novaColunaId: string, projetoId: string) {
  await prisma.tarefa.update({
    where: { id: tarefaId },
    data: { coluna_id: novaColunaId }
  })
  revalidatePath(`/projeto/${projetoId}`)
}

// Atualizada para Marcar Checkbox (Concluída)
export async function toggleConcluida(tarefaId: string, isConcluida: boolean, projetoId: string) {
  await prisma.tarefa.update({
    where: { id: tarefaId },
    data: { 
        concluida: isConcluida,
        dt_conclusao: isConcluida ? new Date() : null 
    }
  })
  revalidatePath(`/projeto/${projetoId}`)
}

export async function excluirTarefa(tarefaId: string, projetoId: string) {
  await prisma.tarefa.delete({
    where: { id: tarefaId },
  })
  revalidatePath(`/projeto/${projetoId}`)
}

export async function adicionarComentario(formData: FormData) {
  const texto = formData.get('texto') as string
  const tarefaId = formData.get('tarefaId') as string
  const projetoId = formData.get('projetoId') as string
  const usuarioId = formData.get('usuarioId') as string 

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

// --- WORKSPACE & PROJETOS ---

export async function atualizarWorkspace(formData: FormData) {
  const id = formData.get('id') as string
  const nome = formData.get('nome') as string

  if (!id || !nome) return

  await prisma.workspace.update({ where: { id }, data: { nome } })
  revalidatePath('/')
}

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
    data: { nome, workspace_id: finalWorkspaceId }
  })
  
  // Redireciona
  redirect(`/projeto/${novo.id}`)
}

// --- VINCULAR COLUNAS AO PROJETO ---

export async function vincularColunaAoProjeto(formData: FormData) {
  const projetoId = formData.get('projetoId') as string
  const colunaId = formData.get('colunaId') as string

  if (!projetoId || !colunaId) return

  // 1. Descobre a última ordem para colocar no final
  const ultimaColuna = await prisma.projetoColuna.findFirst({
    where: { projeto_id: projetoId },
    orderBy: { ordem: 'desc' }
  })
  const novaOrdem = (ultimaColuna?.ordem || 0) + 1

  // 2. Cria o vínculo
  await prisma.projetoColuna.create({
    data: {
      projeto_id: projetoId,
      coluna_id: colunaId,
      ordem: novaOrdem
    }
  })

  revalidatePath(`/projeto/${projetoId}`)
}

export async function desvincularColunaDoProjeto(formData: FormData) {
  const projetoId = formData.get('projetoId') as string
  const colunaId = formData.get('colunaId') as string

  // Remove o vínculo
  await prisma.projetoColuna.deleteMany({
    where: {
      projeto_id: projetoId,
      coluna_id: colunaId
    }
  })

  revalidatePath(`/projeto/${projetoId}`)
}

// --- BULK ACTION (Adicionar Vários) ---

export async function vincularMultiplasColunas(formData: FormData) {
  const projetoId = formData.get('projetoId') as string
  // O getAll pega todos os checkboxes marcados com o name="colunasIds"
  const colunasIds = formData.getAll('colunasIds') as string[]

  if (!projetoId || colunasIds.length === 0) return

  // 1. Descobre qual é a última ordem atual para começar a adicionar depois dela
  const ultimaColuna = await prisma.projetoColuna.findFirst({
    where: { projeto_id: projetoId },
    orderBy: { ordem: 'desc' }
  })
  
  let proximaOrdem = (ultimaColuna?.ordem || 0) + 1

  // 2. Cria todos os vínculos de uma vez (Loop)
  for (const colId of colunasIds) {
    // Verifica se já não existe para evitar duplicata (segurança extra)
    const existe = await prisma.projetoColuna.findUnique({
      where: {
        projeto_id_coluna_id: { projeto_id: projetoId, coluna_id: colId }
      }
    })

    if (!existe) {
      await prisma.projetoColuna.create({
        data: {
          projeto_id: projetoId,
          coluna_id: colId,
          ordem: proximaOrdem
        }
      })
      proximaOrdem++ // Incrementa para o próximo ficar na ordem certa
    }
  }

  revalidatePath(`/projeto/${projetoId}`)
}