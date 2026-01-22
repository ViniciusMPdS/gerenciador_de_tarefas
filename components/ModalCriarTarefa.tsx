'use client'

import { useState } from 'react'
import { criarTarefa } from '@/app/actions'

interface Props {
  projetoId: string
  colunas: any[] 
  usuarios: any[]
}

export default function ModalCriarTarefa({ projetoId, colunas, usuarios }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
      >
        <span>+</span> Nova Tarefa
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Nova Tarefa</h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form 
          action={async (formData) => {
            setIsSaving(true)
            await criarTarefa(formData)
            setIsSaving(false)
            setIsOpen(false)
          }} 
          className="p-6 space-y-4"
        >
          <input type="hidden" name="projetoId" value={projetoId} />

          {/* Título (Obrigatório) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título *</label>
            <input 
              name="titulo" 
              required 
              placeholder="O que precisa ser feito?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {/* Descrição (Obrigatório) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição *</label>
            <textarea 
              name="descricao" 
              required 
              rows={3}
              placeholder="Detalhes da tarefa..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Prioridade (Obrigatório) */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridade *</label>
                <select name="prioridade" required className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm">
                    <option value="BAIXA">🟢 Baixa</option>
                    <option value="MEDIA">🟠 Média</option>
                    <option value="ALTA">🔴 Alta</option>
                </select>
            </div>

            {/* Dificuldade (Obrigatório - NOVO) */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dificuldade *</label>
                <select name="dificuldade" required className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm">
                    <option value="FACIL">🌱 Fácil</option>
                    <option value="MEDIA">⚖️ Média</option>
                    <option value="DIFICIL">🔥 Difícil</option>
                </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Coluna (Obrigatório) */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Etapa *</label>
                <select name="colunaId" required className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm">
                <option value="">Selecione...</option>
                {colunas.map(col => (
                    <option key={col.id} value={col.id}>{col.nome}</option>
                ))}
                </select>
            </div>

            {/* Prazo (Obrigatório) */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prazo *</label>
              <input type="date" name="dtVencimento" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Responsável (Obrigatório) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Responsável *</label>
            <select name="usuarioId" required className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm">
                <option value="">Selecione quem fará...</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
            </select>
          </div>

          <div className="flex justify-end pt-2 gap-2">
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving || colunas.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Criando...' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}