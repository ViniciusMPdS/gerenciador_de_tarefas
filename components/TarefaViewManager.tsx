'use client'

import { useState } from 'react'
import CardKanban from './CardKanban'
import ItemListaTarefa from './ItemListaTarefa'

interface Props {
  tarefas: any[]
  usuarios: any[]
}

export default function TarefaViewManager({ tarefas, usuarios }: Props) {
  const [view, setView] = useState<'LISTA' | 'QUADRO'>('LISTA')

  // Filtra as tarefas para o modo Quadro
  const pendentes = tarefas.filter(t => t.status === 'PENDENTE')
  const fazendo = tarefas.filter(t => t.status === 'FAZENDO')
  const feitas = tarefas.filter(t => t.status === 'FEITO')

  return (
    <div>
      {/* Botões de Alternância (Toggle) */}
      <div className="flex items-center justify-between mb-6">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setView('LISTA')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
              view === 'LISTA' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>☰</span> Lista
          </button>
          <button
            onClick={() => setView('QUADRO')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
              view === 'QUADRO' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>☷</span> Quadro
          </button>
        </div>
        
        <div className="text-xs text-gray-400">
          {tarefas.length} tarefas mostradas
        </div>
      </div>

      {/* RENDERIZAÇÃO CONDICIONAL */}
      
      {view === 'LISTA' ? (
        // --- MODO LISTA ---
        <div className="space-y-3">
          {tarefas.length === 0 && <p className="text-gray-400 text-sm text-center py-10">Nenhuma tarefa encontrada.</p>}
          
          {tarefas.map(tarefa => (
            <ItemListaTarefa key={tarefa.id} tarefa={tarefa} usuarios={usuarios} />
          ))}
        </div>
      ) : (
        // --- MODO QUADRO (KANBAN GERAL) ---
        <div className="flex gap-6 overflow-x-auto pb-4 items-start h-[calc(100vh-250px)]">
          
          {/* Coluna A Fazer */}
          <div className="w-80 flex-shrink-0 bg-gray-50 rounded-xl p-3 border border-gray-200/60 h-full flex flex-col">
             <h3 className="font-semibold text-gray-700 text-sm mb-3 px-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div> A Fazer
             </h3>
             <div className="space-y-3 overflow-y-auto flex-1 pr-1">
               {pendentes.map(t => <CardKanban key={t.id} tarefa={t} usuarios={usuarios} />)}
             </div>
          </div>

          {/* Coluna Fazendo */}
          <div className="w-80 flex-shrink-0 bg-gray-50 rounded-xl p-3 border border-gray-200/60 h-full flex flex-col">
             <h3 className="font-semibold text-gray-700 text-sm mb-3 px-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Em Andamento
             </h3>
             <div className="space-y-3 overflow-y-auto flex-1 pr-1">
               {fazendo.map(t => <CardKanban key={t.id} tarefa={t} usuarios={usuarios} />)}
             </div>
          </div>

          {/* Coluna Feito */}
          <div className="w-80 flex-shrink-0 bg-gray-50 rounded-xl p-3 border border-gray-200/60 h-full flex flex-col">
             <h3 className="font-semibold text-gray-700 text-sm mb-3 px-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div> Concluído
             </h3>
             <div className="space-y-3 overflow-y-auto flex-1 pr-1">
               {feitas.map(t => <CardKanban key={t.id} tarefa={t} usuarios={usuarios} />)}
             </div>
          </div>

        </div>
      )}
    </div>
  )
}