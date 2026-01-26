'use client'

import { useState } from 'react'
import Link from 'next/link'
import ModalTarefa from './ModalTarefa'

interface ItemProps {
  tarefa: any
  usuarios: any[] // Precisamos da lista de usuários para o modal funcionar
}

export default function ItemListaTarefa({ tarefa, usuarios }: ItemProps) {
  const [showModal, setShowModal] = useState(false)

  // Status visual
  const isDone = tarefa.status === 'FEITO'
  const isDoing = tarefa.status === 'FAZENDO'

  return (
    <>
      <div 
        onClick={() => setShowModal(true)} // <--- A MÁGICA: Clicou na linha, abre o modal
        className="bg-surface p-4 rounded-xl border border-border shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
      >
        
        <div className="flex items-center gap-4">
          {/* Bolinha de Status */}
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
            isDone ? 'bg-green-500' : 
            isDoing ? 'bg-indigo-500 animate-pulse' : 'bg-gray-300'
          }`} title={tarefa.status}></div>
          
          <div>
            <h4 className={`font-medium text-foreground ${isDone ? 'line-through text-gray-400' : ''}`}>
              {tarefa.titulo}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                📂 {tarefa.projeto?.nome || 'Sem projeto'}
              </span>
              {tarefa.dt_vencimento && (
                <span className={`text-xs flex items-center gap-1 ${new Date(tarefa.dt_vencimento) < new Date() && !isDone ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                  📅 {new Date(tarefa.dt_vencimento).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
            {/* Avatar do Responsável */}
            {tarefa.usuario ? (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 border border-white shadow-sm" title={tarefa.usuario.nome}>
                {tarefa.usuario.nome.slice(0, 2).toUpperCase()}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface/50 flex items-center justify-center text-xs text-gray-400 border border-border border-dashed">
                ?
              </div>
            )}
            
            {/* Link para abrir o projeto específico se quiser sair da modal */}
            <Link 
              href={`/projeto/${tarefa.projeto_id}`} 
              onClick={(e) => e.stopPropagation()} // Impede de abrir o modal se clicar no link
              className="text-xs text-indigo-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 px-2 py-1 rounded"
            >
              Ir para Quadro
            </Link>
        </div>
      </div>

      {/* O MODAL */}
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