'use client'

import { useState, useEffect } from 'react'
import { useDrop, useDrag } from 'react-dnd'
import { atualizarDataTarefa } from '@/app/actions'

interface Props {
  tarefas: any[]
  abrirModal: (t: any) => void
  enableNavigation?: boolean 
  initialDate?: Date
  fixedViewMode?: 'SEMANA' | 'MES' 
}

export default function CalendarView({ 
    tarefas, 
    abrirModal, 
    enableNavigation = true, 
    initialDate,
    fixedViewMode 
}: Props) {
  
  const [dataAtual, setDataAtual] = useState(initialDate || new Date())
  const [modo, setModo] = useState<'SEMANA' | 'MES'>(fixedViewMode || 'SEMANA')

  useEffect(() => {
    if (initialDate) setDataAtual(initialDate)
  }, [initialDate])

  useEffect(() => {
    if (fixedViewMode) setModo(fixedViewMode)
  }, [fixedViewMode])

  const mudarPeriodo = (direcao: number) => {
    const novaData = new Date(dataAtual)
    if (modo === 'MES') {
        novaData.setMonth(novaData.getMonth() + direcao)
    } else {
        novaData.setDate(novaData.getDate() + (direcao * 7))
    }
    setDataAtual(novaData)
  }

  const irParaHoje = () => setDataAtual(new Date())

  const nomeMesRaw = dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const nomeMes = nomeMesRaw.charAt(0).toUpperCase() + nomeMesRaw.slice(1)
  
  const getDiasDoMes = () => {
    const ano = dataAtual.getFullYear()
    const mes = dataAtual.getMonth()
    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)
    const dias = []
    for (let i = 0; i < primeiroDia.getDay(); i++) dias.push(null)
    for (let i = 1; i <= ultimoDia.getDate(); i++) dias.push(new Date(ano, mes, i))
    return dias
  }

  const getDiasDaSemana = () => {
    const dias = []
    const diaRef = new Date(dataAtual)
    const diaSemana = diaRef.getDay() 
    const domingo = new Date(diaRef)
    domingo.setDate(diaRef.getDate() - diaSemana)
    for (let i = 0; i < 7; i++) {
        const d = new Date(domingo)
        d.setDate(domingo.getDate() + i)
        dias.push(d)
    }
    return dias
  }

  const diasRenderizados = modo === 'MES' ? getDiasDoMes() : getDiasDaSemana()

  const getTarefasDoDia = (dia: Date) => {
    return tarefas.filter(t => {
        if (!t.dt_vencimento) return false
        
        let dataTarefaISO = ''
        if (t.dt_vencimento instanceof Date) {
            dataTarefaISO = t.dt_vencimento.toISOString()
        } else {
            dataTarefaISO = String(t.dt_vencimento)
        }
        const dataTarefaYMD = dataTarefaISO.split('T')[0]

        const ano = dia.getFullYear()
        const mes = String(dia.getMonth() + 1).padStart(2, '0')
        const d = String(dia.getDate()).padStart(2, '0')
        const dataCalendarioYMD = `${ano}-${mes}-${d}`
        
        return dataTarefaYMD === dataCalendarioYMD
    })
  }

  const handleDropTarefa = async (tarefaId: string, projetoId: string, novaData: Date) => {
    await atualizarDataTarefa(tarefaId, novaData, projetoId)
  }

  return (
    <div className="flex flex-col h-full bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
      
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-surface">
        <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg text-foreground min-w-[150px]">{nomeMes}</h2>
            {enableNavigation && (
                <div className="flex items-center bg-surface/50 rounded-lg p-0.5">
                    <button onClick={() => mudarPeriodo(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-surface rounded-md text-gray-600 transition-shadow">◀</button>
                    <button onClick={irParaHoje} className="px-3 h-8 text-xs font-semibold hover:bg-surface rounded-md text-gray-700 transition-shadow">Hoje</button>
                    <button onClick={() => mudarPeriodo(1)} className="w-8 h-8 flex items-center justify-center hover:bg-surface rounded-md text-gray-600 transition-shadow">▶</button>
                </div>
            )}
        </div>
        {!fixedViewMode && (
            <div className="flex bg-surface/50 p-1 rounded-lg">
                <button onClick={() => setModo('SEMANA')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${modo === 'SEMANA' ? 'bg-surface text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Semana</button>
                <button onClick={() => setModo('MES')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${modo === 'MES' ? 'bg-surface text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Mês</button>
            </div>
        )}
      </div>

      {/* MODO MÊS */}
      {modo === 'MES' && (
        <>
            <div className="grid grid-cols-7 border-b border-gray-100 bg-surface/50/50">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
                {diasRenderizados.map((dia, index) => {
                    if (!dia) return <div key={index} className="bg-surface/50/30 border-b border-r border-gray-100 min-h-[100px]" />
                    return <CalendarDayCell key={index} dia={dia} tarefas={getTarefasDoDia(dia)} onDrop={handleDropTarefa} onClickTask={abrirModal} viewMode="MES" />
                })}
            </div>
        </>
      )}

      {/* MODO SEMANA */}
      {modo === 'SEMANA' && (
         <div className="flex h-full overflow-x-auto divide-x divide-gray-100">
             {diasRenderizados.map((dia, index) => {
                 if (!dia) return null
                 return <CalendarDayCell key={index} dia={dia} tarefas={getTarefasDoDia(dia)} onDrop={handleDropTarefa} onClickTask={abrirModal} viewMode="SEMANA" />
             })}
         </div>
      )}
    </div>
  )
}

function CalendarDayCell({ dia, tarefas, onDrop, onClickTask, viewMode }: any) {
    const [{ isOver }, dropRef] = useDrop(() => ({
        accept: 'CALENDAR_TASK',
        drop: (item: { id: string, projetoId: string }) => { onDrop(item.id, item.projetoId, dia) },
        collect: (monitor) => ({ isOver: monitor.isOver() }),
    }), [dia])

    const hoje = new Date()
    const isHoje = dia.toDateString() === hoje.toDateString()

    if (viewMode === 'MES') {
        return (
            <div ref={dropRef as unknown as React.LegacyRef<HTMLDivElement>} className={`border-b border-r border-gray-100 p-2 min-h-[100px] flex flex-col group transition-colors ${isOver ? 'bg-indigo-100' : (isHoje ? 'bg-indigo-50/20' : 'hover:bg-surface/50')}`}>
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isHoje ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>{dia.getDate()}</span>
                <div className="space-y-1 overflow-y-auto custom-scrollbar-thin max-h-[80px]">
                    {tarefas.map((t: any) => <DraggableTaskPill key={t.id} tarefa={t} onClick={() => onClickTask(t)} />)}
                </div>
            </div>
        )
    } 
    return (
        <div ref={dropRef as unknown as React.LegacyRef<HTMLDivElement>} className={`flex-1 min-w-[140px] flex flex-col h-full ${isOver ? 'bg-indigo-100' : (isHoje ? 'bg-indigo-50/30' : '')}`}>
            <div className={`p-3 text-center border-b border-gray-100 ${isHoje ? 'bg-indigo-50/50' : 'bg-surface/50/50'}`}>
                <p className="text-xs font-bold text-gray-400 uppercase">{dia.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                <p className={`text-xl font-bold mt-1 ${isHoje ? 'text-indigo-600' : 'text-gray-700'}`}>{dia.getDate()}</p>
            </div>
            <div className="p-2 flex-1 overflow-y-auto space-y-2 custom-scrollbar-thin">
                {tarefas.map((t: any) => <DraggableTaskCard key={t.id} tarefa={t} onClick={() => onClickTask(t)} />)}
            </div>
        </div>
    )
}

// --- CARD MENSAL (Pílula) ---
function DraggableTaskPill({ tarefa, onClick }: any) {
    const [{ isDragging }, dragRef] = useDrag(() => ({
        type: 'CALENDAR_TASK', item: { id: tarefa.id, projetoId: tarefa.projeto_id },
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }), [tarefa.id])

    return (
        <div ref={dragRef as unknown as React.LegacyRef<HTMLDivElement>} onClick={onClick}
            className={`text-[10px] px-1.5 py-1 rounded border cursor-pointer truncate transition-opacity flex justify-between items-center gap-1 ${isDragging ? 'opacity-50' : ''} ${tarefa.concluida ? 'bg-surface/50 text-gray-400 line-through border-transparent' : 'bg-surface text-gray-700 shadow-sm border-border hover:border-indigo-300'}`}>
            <span className="truncate">{tarefa.titulo}</span>
            {/* Avatar Miniatura no Mês (se houver espaço) */}
            {tarefa.usuario && (
                <div className="w-3 h-3 rounded-full bg-indigo-50 flex items-center justify-center text-[6px] font-bold text-indigo-700 border border-indigo-100 shrink-0">
                    {tarefa.usuario.nome.substring(0, 1).toUpperCase()}
                </div>
            )}
        </div>
    )
}

// --- CARD SEMANAL (Estilo Kanban) ---
function DraggableTaskCard({ tarefa, onClick }: any) {
    const [{ isDragging }, dragRef] = useDrag(() => ({
        type: 'CALENDAR_TASK', item: { id: tarefa.id, projetoId: tarefa.projeto_id },
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }), [tarefa.id])

    return (
        <div ref={dragRef as unknown as React.LegacyRef<HTMLDivElement>} onClick={onClick}
            className={`p-3 rounded-lg border shadow-sm cursor-pointer group transition-all ${isDragging ? 'opacity-50' : ''} ${tarefa.concluida ? 'bg-surface/50 border-gray-100 opacity-60' : 'bg-surface border-border hover:border-indigo-300 hover:shadow-md'}`}>
            <div className={`w-8 h-1 rounded-full mb-2 ${tarefa.prioridade === 'ALTA' ? 'bg-red-400' : (tarefa.prioridade === 'MEDIA' ? 'bg-orange-400' : 'bg-green-400')}`}></div>
            <p className={`text-sm font-medium leading-tight mb-2 ${tarefa.concluida ? 'line-through text-gray-500' : 'text-foreground'}`}>{tarefa.titulo}</p>
            
            {/* RODAPÉ DO CARD: PROJETO + AVATAR */}
            <div className="flex justify-between items-center border-t border-gray-50 pt-2 mt-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[70%]">{tarefa.projeto?.nome}</p>
                {tarefa.usuario && (
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-700 border border-indigo-200 shrink-0" title={tarefa.usuario.nome}>
                        {tarefa.usuario.nome.substring(0, 2).toUpperCase()}
                    </div>
                )}
            </div>
        </div>
    )
}