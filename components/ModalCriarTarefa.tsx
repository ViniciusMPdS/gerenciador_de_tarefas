'use client'

import { useState } from 'react'
import { criarTarefa } from '@/app/actions'

interface Props {
  projetoId: string
  colunas: any[] // Colunas disponíveis neste projeto
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

          {/* Título */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
            <input 
              name="titulo" 
              required 
              placeholder="O que precisa ser feito?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {/* SELETOR DE COLUNA (OBRIGATÓRIO) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Etapa / Coluna <span className="text-red-500">*</span></label>
            <select 
              name="colunaId" 
              required 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione uma etapa...</option>
              {colunas.map(col => (
                <option key={col.id} value={col.id}>{col.nome}</option>
              ))}
            </select>
            {colunas.length === 0 && <p className="text-[10px] text-red-500 mt-1">Configure as etapas do projeto primeiro.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Prazo */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prazo</label>
              <input type="date" name="dtVencimento" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Responsável</label>
              <select name="usuarioId" className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm">
                <option value="">Ninguém</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
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