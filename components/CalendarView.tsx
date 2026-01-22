'use client'

import { useState, useEffect } from 'react'

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

  // --- CORREÇÃO DO PROBLEMA DE DOMINGO ---
  const getTarefasDoDia = (dia: Date) => {
    return tarefas.filter(t => {
        if (!t.dt_vencimento) return false
        
        // 1. Pega a String "Pura" do Banco (UTC)
        // Se vier como objeto Date, converte para ISO String e corta a hora
        let dataTarefaISO = ''
        if (t.dt_vencimento instanceof Date) {
            dataTarefaISO = t.dt_vencimento.toISOString()
        } else {
            dataTarefaISO = String(t.dt_vencimento)
        }
        
        // Pega apenas "2026-01-26" (YYYY-MM-DD)
        const dataTarefaYMD = dataTarefaISO.split('T')[0]

        // 2. Formata o dia do calendário para YYYY-MM-DD também
        const ano = dia.getFullYear()
        const mes = String(dia.getMonth() + 1).padStart(2, '0')
        const d = String(dia.getDate()).padStart(2, '0')
        const dataCalendarioYMD = `${ano}-${mes}-${d}`
        
        // 3. Compara apenas texto com texto (26 === 26)
        return dataTarefaYMD === dataCalendarioYMD
    })
  }

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
  // Nome do mês com primeira letra maiúscula
  const nomeMesRaw = dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const nomeMes = nomeMesRaw.charAt(0).toUpperCase() + nomeMesRaw.slice(1)
  
  const hoje = new Date()

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      
      {/* HEADER DO CALENDÁRIO */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
        
        <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg text-gray-800 min-w-[150px]">
                {nomeMes}
            </h2>
            
            {enableNavigation && (
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button onClick={() => mudarPeriodo(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md text-gray-600 transition-shadow">◀</button>
                    <button onClick={irParaHoje} className="px-3 h-8 text-xs font-semibold hover:bg-white rounded-md text-gray-700 transition-shadow">Hoje</button>
                    <button onClick={() => mudarPeriodo(1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md text-gray-600 transition-shadow">▶</button>
                </div>
            )}
        </div>

        {!fixedViewMode && (
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setModo('SEMANA')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${modo === 'SEMANA' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Semana
                </button>
                <button 
                    onClick={() => setModo('MES')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${modo === 'MES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Mês
                </button>
            </div>
        )}
      </div>

      {/* --- MODO MÊS --- */}
      {modo === 'MES' && (
        <>
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
                {diasRenderizados.map((dia, index) => {
                    if (!dia) return <div key={index} className="bg-gray-50/30 border-b border-r border-gray-100 min-h-[100px]" />
                    
                    const isHoje = dia.toDateString() === hoje.toDateString()
                    const tarefasDoDia = getTarefasDoDia(dia)

                    return (
                        <div key={index} className={`border-b border-r border-gray-100 p-2 min-h-[100px] flex flex-col group transition-colors ${isHoje ? 'bg-indigo-50/20' : 'hover:bg-gray-50'}`}>
                            <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isHoje ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>
                                {dia.getDate()}
                            </span>
                            <div className="space-y-1 overflow-y-auto custom-scrollbar-thin max-h-[80px]">
                                {tarefasDoDia.map(t => (
                                    <div 
                                        key={t.id}
                                        onClick={() => abrirModal(t)}
                                        className={`text-[10px] px-1.5 py-1 rounded border cursor-pointer truncate ${t.concluida ? 'bg-gray-100 text-gray-400 line-through border-transparent' : 'bg-white text-gray-700 shadow-sm border-gray-200 hover:border-indigo-300'}`}
                                    >
                                        {t.titulo}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
      )}

      {/* --- MODO SEMANA --- */}
      {modo === 'SEMANA' && (
         <div className="flex h-full overflow-x-auto divide-x divide-gray-100">
             {diasRenderizados.map((dia, index) => {
                 if (!dia) return null
                 const isHoje = dia.toDateString() === hoje.toDateString()
                 const tarefasDoDia = getTarefasDoDia(dia)

                 return (
                     <div key={index} className={`flex-1 min-w-[140px] flex flex-col h-full ${isHoje ? 'bg-indigo-50/30' : ''}`}>
                         <div className={`p-3 text-center border-b border-gray-100 ${isHoje ? 'bg-indigo-50/50' : 'bg-gray-50/50'}`}>
                             <p className="text-xs font-bold text-gray-400 uppercase">{dia.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                             <p className={`text-xl font-bold mt-1 ${isHoje ? 'text-indigo-600' : 'text-gray-700'}`}>
                                {dia.getDate()}
                             </p>
                         </div>

                         <div className="p-2 flex-1 overflow-y-auto space-y-2 custom-scrollbar-thin">
                             {tarefasDoDia.map(t => (
                                 <div 
                                     key={t.id}
                                     onClick={() => abrirModal(t)}
                                     className={`p-3 rounded-lg border shadow-sm cursor-pointer group transition-all ${
                                         t.concluida 
                                         ? 'bg-gray-50 border-gray-100 opacity-60' 
                                         : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                                     }`}
                                 >
                                     <div className={`w-8 h-1 rounded-full mb-2 ${t.prioridade === 'ALTA' ? 'bg-red-400' : (t.prioridade === 'MEDIA' ? 'bg-orange-400' : 'bg-green-400')}`}></div>
                                     <p className={`text-sm font-medium leading-tight mb-1 ${t.concluida ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                         {t.titulo}
                                     </p>
                                     <p className="text-[10px] text-gray-400 font-bold uppercase truncate">
                                         {t.projeto?.nome}
                                     </p>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )
             })}
         </div>
      )}

    </div>
  )
}