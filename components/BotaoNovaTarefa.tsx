'use client' // Isso habilita a interatividade (clicks)

import { useState } from 'react'
import { criarTarefa } from '../app/actions' // Importamos a lógica que criamos no passo 1

export default function BotaoNovaTarefa({ projetoId }: { projetoId: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* O Botão que já existia, agora com onClick */}
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
      >
        <span>+</span> Adicionar Tarefa
      </button>

      {/* O MODAL (Janela que abre) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
            
            <h2 className="text-xl font-bold text-gray-800 mb-4">Nova Tarefa</h2>
            
            <form action={async (formData) => {
                await criarTarefa(formData) // Chama o servidor
                setIsOpen(false) // Fecha o modal
            }}>
              {/* ID do projeto escondido para o servidor saber onde salvar */}
              <input type="hidden" name="projetoId" value={projetoId} />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input 
                    name="titulo"
                    type="text" 
                    placeholder="Ex: Criar protótipo da tela..." 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <select name="prioridade" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none">
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium shadow-md transition-all"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}