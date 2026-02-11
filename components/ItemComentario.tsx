'use client'

import { useState, useTransition } from 'react'
import { excluirComentario, editarComentario } from '@/app/actions'
import ModalConfirmacao from './ModalConfirmacao' // <--- 1. IMPORTAR SEU MODAL

interface Props {
  comentario: any
  usuarioLogadoId: string
  onDeleteSuccess: (id: string) => void
}

export default function ItemComentario({ comentario, usuarioLogadoId, onDeleteSuccess }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [textoEditado, setTextoEditado] = useState(comentario.texto)
  
  // Controle do Modal
  const [showModal, setShowModal] = useState(false) // <--- 2. ESTADO DO MODAL

  const [isPending, startTransition] = useTransition()

  // IDs como String para evitar erros
  const donoId = comentario.usuario_id ? String(comentario.usuario_id) : ''
  const logadoId = usuarioLogadoId ? String(usuarioLogadoId) : ''
  const souDono = donoId === logadoId && donoId !== ''
  
  const dataCriacao = new Date(comentario.dt_insert).getTime()
  const dataEdicao = comentario.dt_update ? new Date(comentario.dt_update).getTime() : 0
  
  // Só consideramos editado se a data de edição for pelo menos 1 segundo maior que a criação
  // (Isso evita falsos positivos onde o banco salva os dois com milissegundos de diferença na criação)
  const foiEditado = dataEdicao > (dataCriacao + 1000)

  const handleSalvarEdicao = () => {
    if (textoEditado.trim() === '') return
    
    startTransition(async () => {
      try {
        await editarComentario(comentario.id, textoEditado, usuarioLogadoId)
        
        // --- ATUALIZAÇÃO VISUAL IMEDIATA ---
        comentario.texto = textoEditado 
        comentario.dt_update = new Date() // <--- ADICIONE ESTA LINHA (Atualiza a data na tela)
        
        setIsEditing(false) // Isso força o componente a recarregar e ler a nova data
      } catch (error) {
        alert("Erro ao editar.")
      }
    })
  }

  // 3. FUNÇÃO QUE O MODAL VAI CHAMAR
  const handleConfirmarExclusao = () => {
    startTransition(async () => {
      try {
        await excluirComentario(comentario.id, usuarioLogadoId)
        onDeleteSuccess(comentario.id)
        setShowModal(false) // Fecha o modal após sucesso
      } catch (error) {
        alert("Erro ao excluir.")
      }
    })
  }

  return (
    <>
      <div className="bg-surface p-3 rounded-lg border border-border hover:border-indigo-500/30 transition-all group relative">
        <div className="flex justify-between items-start mb-1">
          
          {/* CABEÇALHO */}
          <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-400 border border-indigo-500/30">
                  {comentario.usuario?.nome ? comentario.usuario.nome.substring(0,1).toUpperCase() : '?'}
              </div>
              <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                      {comentario.usuario?.nome || 'Usuário'}
                      {souDono && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1 rounded">VOCÊ</span>}
                  </span>
                  <span className="text-[9px] text-text-muted">
                      {new Date(comentario.dt_insert).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}
                      {foiEditado && <span className="ml-1 italic">(editado)</span>}
                  </span>
              </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          {souDono && !isEditing && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                      onClick={() => setIsEditing(true)} 
                      className="p-1 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded"
                      title="Editar"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </button>
                  
                  {/* 4. BOTÃO LIXEIRA AGORA SÓ ABRE O MODAL */}
                  <button 
                      onClick={() => setShowModal(true)} 
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Excluir"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
              </div>
          )}
        </div>

        {/* ÁREA DE TEXTO */}
        {isEditing ? (
          <div className="mt-2 animate-in fade-in">
              <textarea 
                  value={textoEditado}
                  onChange={(e) => setTextoEditado(e.target.value)}
                  className="w-full bg-surface-highlight/20 border border-indigo-300 rounded p-2 text-sm text-foreground focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                  rows={3}
                  autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                  <button 
                      onClick={() => { setIsEditing(false); setTextoEditado(comentario.texto) }}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                  >
                      Cancelar
                  </button>
                  <button 
                      onClick={handleSalvarEdicao}
                      disabled={isPending}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded font-medium transition-colors"
                  >
                      {isPending ? 'Salvando...' : 'Salvar'}
                  </button>
              </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 ml-8 whitespace-pre-wrap break-words leading-relaxed">
              {comentario.texto}
          </p>
        )}
      </div>

      {/* 5. AQUI ESTÁ O SEU MODAL LINDO */}
      <ModalConfirmacao 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmarExclusao} // Chama a função real
          titulo="Excluir Comentário?"
          descricao="Você tem certeza que deseja remover este comentário? Essa ação não pode ser desfeita."
          loading={isPending} // Passa o loading da transição
      />
    </>
  )
}