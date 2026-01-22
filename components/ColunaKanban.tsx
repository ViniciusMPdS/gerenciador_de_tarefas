'use client'

import { useDrop } from 'react-dnd'
import { moverTarefaDeColuna } from '@/app/actions'
import CardKanban from './CardKanban'
import { useState } from 'react'

interface Props {
  coluna: any
  tarefas: any[]
  usuarios: any[]
  projetoId: string
}

export default function ColunaKanban({ coluna, tarefas, usuarios, projetoId }: Props) {
  const [isUpdating, setIsUpdating] = useState(false)

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: 'TAREFA',
    drop: (item: { id: string, colunaId: string }) => {
      if (item.colunaId !== coluna.id) {
        setIsUpdating(true)
        moverTarefaDeColuna(item.id, coluna.id, projetoId)
          .finally(() => setIsUpdating(false))
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [coluna.id, projetoId])

  return (
    <div 
      ref={dropRef as unknown as React.LegacyRef<HTMLDivElement>}
      // h-full: Garante que a coluna estique até o fim do quadro
      className={`min-w-[300px] w-[300px] flex-shrink-0 flex flex-col rounded-xl border h-full transition-colors ${
        isOver ? 'bg-indigo-50 border-indigo-300 shadow-inner' : 'bg-gray-50/50 border-gray-200/60'
      }`}
    >
      {/* CABEÇALHO (Fixo) */}
      <div className="p-3 flex items-center justify-between border-b border-gray-100 bg-white/50 rounded-t-xl backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-yellow-400 animate-pulse' : 'bg-indigo-500'}`}></div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide truncate max-w-[180px]" title={coluna.nome}>
            {coluna.nome}
          </h3>
        </div>
        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {tarefas.length}
        </span>
      </div>

      {/* ÁREA DE CARDS (Com Scroll Vertical) */}
      {/* flex-1: Ocupa todo o espaço restante */}
      {/* overflow-y-auto: Cria scroll apenas aqui se tiver muitas tarefas */}
      <div className="p-2 space-y-2 overflow-y-auto custom-scrollbar-thin flex-1 min-h-[150px]">
        {tarefas.map(tarefa => (
          <CardKanban 
            key={tarefa.id} 
            tarefa={tarefa} 
            usuarios={usuarios} 
          />
        ))}
        
        {/* Área vazia para soltar tarefa no final */}
        {tarefas.length === 0 && (
            <div className="h-full flex items-center justify-center text-xs text-gray-300 italic pointer-events-none">
                Solte aqui
            </div>
        )}
      </div>
    </div>
  )
}