'use client'

import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (comentario: string) => void
  isSaving: boolean
}

export default function ModalConclusao({ isOpen, onClose, onConfirm, isSaving }: Props) {
  const [comentario, setComentario] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-2">Concluir Tarefa</h3>
          <p className="text-sm text-gray-500 mb-4">
            Para finalizar esta tarefa, é obrigatório deixar um comentário de encerramento.
          </p>

          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Ex: Finalizado conforme solicitado, arquivos enviados..."
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none h-32"
            autoFocus
          />

          <div className="flex justify-end gap-2 mt-4">
            <button 
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-500 hover:bg-surface/50 rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => onConfirm(comentario)}
              disabled={!comentario.trim() || isSaving}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              {isSaving ? 'Concluindo...' : 'Concluir Tarefa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}