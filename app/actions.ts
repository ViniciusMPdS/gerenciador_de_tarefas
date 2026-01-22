'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- TAREFAS ---

export async function criarTarefa(formData: FormData) {
  const titulo = formData.get('titulo') as string
  const descricao = formData.get('descricao') as string // Agora obrigatório
  const prioridade = formData.get('prioridade') as string
  const dificuldade = formData.get('dificuldade') as string // Novo
  const projetoId = formData.get('projetoId') as string
  const usuarioId = formData.get('usuarioId') as string
  const dtVencimentoStr = formData.get('dtVencimento') as string
  let colunaId = formData.get('colunaId') as string

  // VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
  if (!titulo || !descricao || !prioridade || !dificuldade || !projetoId || !usuarioId || !dtVencimentoStr) {
    // Em um cenário real, você retornaria um erro para o front exibir.
    // Por enquanto, apenas abortamos se faltar algo.
    return 
  }

  // Se não veio coluna, buscamos a primeira do projeto
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
      prioridade,
      dificuldade, // Salvando a dificuldade
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

// NOVA ACTION: Concluir com Comentário Obrigatório
export async function concluirTarefaComComentario(tarefaId: string, comentario: string, projetoId: string, usuarioId: string) {
  'use server'

  // 1. Atualiza a tarefa para concluída
  await prisma.tarefa.update({
    where: { id: tarefaId },
    data: { 
      concluida: true,
      dt_conclusao: new Date()
    }
  })

  // 2. Adiciona o comentário de encerramento
  if (comentario) {
    await prisma.comentario.create({
      data: {
        texto: `🏁 ENCERRAMENTO: ${comentario}`,
        tarefa_id: tarefaId,
        usuario_id: usuarioId // Precisamos saber quem encerrou
      }
    })
  }

  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
}

// Mantenha as outras funções (editarTarefa, moverTarefaDeColuna, etc) como estão...
// Apenas certifique-se que o editarTarefa também receba 'dificuldade' se você quiser editar depois.

export async function editarTarefa(formData: FormData) {
  const id = formData.get('id') as string
  const projeto_id = formData.get('projetoId') as string
  
  // Pegando todos os campos para edição também
  const titulo = formData.get('titulo') as string
  const descricao = formData.get('descricao') as string
  const prioridade = formData.get('prioridade') as string
  const dificuldade = formData.get('dificuldade') as string // Novo
  const usuario_id = formData.get('usuarioId') as string
  const dt_vencimento = formData.get('dtVencimento') as string ? new Date(formData.get('dtVencimento') as string) : null

  await prisma.tarefa.update({
    where: { id },
    data: {
      titulo,
      descricao,
      prioridade,
      dificuldade,
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

  if (!texto || !tarefaId || !usuarioId) return null // Retorna null se falhar

  const novoComentario = await prisma.comentario.create({
    data: {
      texto,
      tarefa_id: tarefaId,
      usuario_id: usuarioId,
    },
    // IMPORTANTE: Incluir o usuário para mostrar o nome na hora
    include: {
        usuario: true
    }
  })

  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)

  return novoComentario // <--- Retornamos o objeto criado
}

// ... Resto do arquivo (moverTarefa, excluir, atualizarData, etc) igual
export async function moverTarefaDeColuna(tarefaId: string, novaColunaId: string, projetoId: string) {
  await prisma.tarefa.update({
    where: { id: tarefaId },
    data: { coluna_id: novaColunaId }
  })
  revalidatePath(`/projeto/${projetoId}`)
}

export async function toggleConcluida(tarefaId: string, isConcluida: boolean, projetoId: string) {
  // Essa função agora serve apenas para REABRIR (false). 
  // Para concluir (true), usaremos a nova com comentário.
  await prisma.tarefa.update({
    where: { id: tarefaId },
    data: { 
        concluida: isConcluida,
        dt_conclusao: isConcluida ? new Date() : null 
    }
  })
  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
}

export async function excluirTarefa(tarefaId: string, projetoId: string) {
  await prisma.tarefa.delete({ where: { id: tarefaId } })
  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
}

export async function atualizarDataTarefa(tarefaId: string, novaData: Date, projetoId: string) {
  await prisma.tarefa.update({ where: { id: tarefaId }, data: { dt_vencimento: novaData } })
  revalidatePath(`/projeto/${projetoId}`)
  revalidatePath(`/minhas-tarefas`)
  revalidatePath(`/sprint`)
}

// ... Actions de Projeto/Workspace/Colunas iguais
export async function vincularMultiplasColunas(formData: FormData) {
    // ... código existente
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