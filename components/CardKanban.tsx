'use client'

import { useState } from 'react'
import { atualizarStatusTarefa, excluirTarefa } from '@/app/actions'
import ModalTarefa from './ModalTarefa' // Importa a Modal

interface CardProps {
  tarefa: any
  usuarios: any[] // Recebe a lista de usuários
}

export default function CardKanban({ tarefa, usuarios }: CardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false) // Controle da modal

  const handleStatusChange = async (novoStatus: string) => {
    setIsLoading(true)
    await atualizarStatusTarefa(tarefa.id, novoStatus, tarefa.projeto_id)
    setIsLoading(false)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() // Impede que abra a modal ao clicar na lixeira
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      setIsLoading(true)
      await excluirTarefa(tarefa.id, tarefa.projeto_id)
      setIsLoading(false)
    }
  }

  const dataFormatada = tarefa.dt_vencimento 
    ? new Date(tarefa.dt_vencimento).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})
    : null

  // Iniciais do Usuário
  const iniciaisUsuario = tarefa.usuario 
    ? tarefa.usuario.nome.slice(0, 2).toUpperCase() 
    : null

  return (
    <>
      <div 
        onClick={() => setShowModal(true)} // Abre a modal ao clicar
        className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative cursor-pointer hover:border-indigo-200 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        
        <div className="flex justify-between items-start mb-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide border ${
            tarefa.prioridade === 'ALTA' ? 'bg-red-50 text-red-600 border-red-100' : 
            tarefa.prioridade === 'MEDIA' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
            'bg-green-50 text-green-600 border-green-100'
          }`}>
            {tarefa.prioridade}
          </span>
          
          <button 
            onClick={handleDelete}
            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-10"
          >
            🗑️
          </button>
        </div>

        <p className="text-gray-800 font-medium text-sm mb-3 leading-snug">
          {tarefa.titulo}
        </p>

        {/* Footer com Data e Usuário */}
        <div className="flex justify-between items-end mt-2">
          <div className="flex items-center gap-2">
             {dataFormatada && (
              <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                <span>📅</span> {dataFormatada}
              </div>
            )}
          </div>

          {iniciaisUsuario && (
            <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700" title={tarefa.usuario.nome}>
              {iniciaisUsuario}
            </div>
          )}
        </div>

        {/* Seletor de Status (Mini) */}
        <div className="mt-3 pt-2 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
           <select 
            value={tarefa.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full text-[10px] bg-transparent text-gray-400 hover:text-gray-600 outline-none cursor-pointer text-right"
          >
            <option value="PENDENTE">Mover para: A Fazer</option>
            <option value="FAZENDO">Mover para: Fazendo</option>
            <option value="FEITO">Mover para: Concluído</option>
          </select>
        </div>
      </div>

      {/* RENDERIZA A MODAL SE ESTIVER ABERTA */}
      {showModal && (
        <ModalTarefa 
          tarefa={tarefa} 
          usuarios={usuarios} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  )
}