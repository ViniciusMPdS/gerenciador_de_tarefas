'use client'

import { useState, useTransition } from 'react'
import { toggleConcluida, moverTarefaDeColuna, concluirTarefaComComentario } from '@/app/actions' 
import CalendarView from './CalendarView' 
import ModalTarefa from './ModalTarefa'
import ModalConclusao from './ModalConclusao'

// --- IMPORTS DRAG AND DROP ---
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

interface Props {
  tarefasIniciais: any[]
  listaProjetos: any[]
  usuarios?: any[] 
  colunas?: any[] 
  tituloPagina?: string
  
  // Configs de Calendário
  enableCalendarNavigation?: boolean
  initialCalendarDate?: Date
  calendarViewMode?: 'SEMANA' | 'MES' 
  
  // Configs de Contexto (Projeto ou Geral)
  agrupamento?: 'PROJETO' | 'COLUNA' 
  esconderFiltroProjeto?: boolean 
}

export default function MinhasTarefasView({ 
    tarefasIniciais, 
    listaProjetos, 
    usuarios = [], 
    colunas = [],
    
    enableCalendarNavigation = true, 
    initialCalendarDate,
    calendarViewMode,

    agrupamento = 'PROJETO', 
    esconderFiltroProjeto = false
}: Props) {
  
  const [view, setView] = useState<'LISTA' | 'QUADRO' | 'CALENDARIO'>('QUADRO')
  const [isPending, startTransition] = useTransition()
  
  // Estado para modal de detalhes
  const [selectedTarefa, setSelectedTarefa] = useState<any>(null) 
  
  // ESTADO PARA O MODAL DE CONCLUSÃO
  const [tarefaParaConcluir, setTarefaParaConcluir] = useState<string | null>(null)

  // Filtros
  const [busca, setBusca] = useState('')
  const [projetoId, setProjetoId] = useState('')
  const [prioridade, setPrioridade] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')

  // Helpers
  const formatarData = (dataOriginal: any) => {
    if (!dataOriginal) return null;
    let dataString = dataOriginal instanceof Date ? dataOriginal.toISOString() : String(dataOriginal);
    const [ano, mes, dia] = dataString.split('T')[0].split('-').map(Number);
    return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR');
  }

  const getPriorityColor = (p: string) => {
    if(p === 'ALTA') return 'bg-red-100 text-red-700 border-red-200'
    if(p === 'MEDIA') return 'bg-orange-100 text-orange-700 border-orange-200'
    return 'bg-green-100 text-green-700 border-green-200'
  }

  // --- INTERCEPTOR DO CHECKBOX ---
  const handleCheck = (tarefaId: string, concluidaAtual: boolean, projetoId: string) => {
    if (!concluidaAtual) {
        setTarefaParaConcluir(tarefaId)
    } else {
        startTransition(() => {
            toggleConcluida(tarefaId, false, projetoId)
        })
    }
  }

  // --- AÇÃO REAL DE CONCLUIR ---
  const confirmarConclusao = (comentario: string) => {
    if (!tarefaParaConcluir) return
    const tarefa = tarefasIniciais.find(t => t.id === tarefaParaConcluir)
    if (!tarefa) return
    const quemConcluiuId = usuarios[0]?.id || tarefa.usuario_id 

    startTransition(async () => {
        await concluirTarefaComComentario(tarefaParaConcluir, comentario, tarefa.projeto_id, quemConcluiuId)
        setTarefaParaConcluir(null) 
    })
  }

  // --- FILTRAGEM ---
  const tarefasFiltradas = tarefasIniciais.filter(t => {
    const matchTexto = t.titulo.toLowerCase().includes(busca.toLowerCase());
    const matchProjeto = (esconderFiltroProjeto || !projetoId) ? true : t.projeto_id === projetoId;
    const matchPrioridade = prioridade ? t.prioridade === prioridade : true;
    const matchUsuario = usuarioId ? t.usuario_id === usuarioId : true;
    
    let matchStatus = true;
    if (statusFilter === 'PENDENTE') matchStatus = !t.concluida;
    if (statusFilter === 'CONCLUIDA') matchStatus = t.concluida;
    
    return matchTexto && matchProjeto && matchPrioridade && matchUsuario && matchStatus;
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        
        {/* --- BARRA DE CONTROLE --- */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col xl:flex-row gap-4 justify-between items-center flex-shrink-0">
          
          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input type="text" placeholder="Buscar tarefa..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      value={busca} onChange={(e) => setBusca(e.target.value)} />
              </div>

              <select className="px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white text-sm"
                  value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="TODOS">Todas (Status)</option>
                  <option value="PENDENTE">🕒 Pendentes</option>
                  <option value="CONCLUIDA">✅ Concluídas</option>
              </select>

              {!esconderFiltroProjeto && (
                  <select className="px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white text-sm"
                      value={projetoId} onChange={(e) => setProjetoId(e.target.value)}>
                      <option value="">Todos os Projetos</option>
                      {listaProjetos.map(p => (<option key={p.id} value={p.id}>{p.nome}</option>))}
                  </select>
              )}
              
              {usuarios.length > 0 && (
                  <select className="px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white text-sm"
                      value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
                      <option value="">Todos Responsáveis</option>
                      {usuarios.map(u => (<option key={u.id} value={u.id}>{u.nome}</option>))}
                  </select>
              )}

              <select className="px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white text-sm"
                  value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
                  <option value="">Todas Prioridades</option>
                  <option value="ALTA">Alta</option>
                  <option value="MEDIA">Média</option>
                  <option value="BAIXA">Baixa</option>
              </select>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg flex-shrink-0">
              <button onClick={() => setView('LISTA')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'LISTA' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>≣ Lista</button>
              <button onClick={() => setView('QUADRO')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'QUADRO' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>☷ Quadro</button>
              <button onClick={() => setView('CALENDARIO')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'CALENDARIO' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>📅 Calendário</button>
          </div>
        </div>

        {/* --- CONTEÚDO --- */}
        <div className="flex-1 overflow-hidden">
          
          {/* MODO LISTA */}
          {view === 'LISTA' && (
              <div className="h-full overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-sm custom-scrollbar-thin">
                  {tarefasFiltradas.length === 0 ? <div className="p-10 text-center text-gray-400">Nenhuma tarefa encontrada.</div> : (
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 sticky top-0 z-10 text-xs uppercase text-gray-500 font-semibold">
                              <tr>
                                  <th className="p-4 border-b w-10"></th>
                                  <th className="p-4 border-b">Tarefa</th>
                                  <th className="p-4 border-b">Projeto</th>
                                  <th className="p-4 border-b">Etapa / Status</th>
                                  <th className="p-4 border-b">Vencimento</th>
                                  <th className="p-4 border-b text-center">Prioridade</th>
                                  <th className="p-4 border-b text-center">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {tarefasFiltradas.map(t => (
                                  <tr key={t.id} className={`hover:bg-gray-50 transition-colors group ${t.concluida ? 'bg-gray-50/50' : ''}`}>
                                      <td className="p-4">
                                          <input type="checkbox" checked={t.concluida} onChange={() => handleCheck(t.id, t.concluida, t.projeto_id)} className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500 cursor-pointer" />
                                      </td>
                                      <td className="p-4 font-medium text-gray-800"><span className={t.concluida ? "line-through text-gray-400" : ""}>{t.titulo}</span></td>
                                      <td className="p-4 text-sm text-gray-500"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{t.projeto?.nome}</span></td>
                                      <td className="p-4 text-sm text-gray-500 text-xs"><span className={`px-2 py-1 rounded border ${t.concluida ? 'bg-green-50 text-green-600 border-green-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{t.concluida ? 'Concluída' : (t.coluna?.nome || 'Backlog')}</span></td>
                                      <td className="p-4 text-sm text-gray-500">{formatarData(t.dt_vencimento) || '-'}</td>
                                      <td className="p-4 text-center"><span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${getPriorityColor(t.prioridade)}`}>{t.prioridade}</span></td>
                                      <td className="p-4 text-center"><button onClick={() => setSelectedTarefa(t)} className="text-indigo-600 hover:underline text-sm font-medium">Abrir</button></td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  )}
              </div>
          )}

          {/* MODO QUADRO */}
          {view === 'QUADRO' && (
              <div className="h-full overflow-x-auto overflow-y-hidden flex gap-4 pb-2 custom-scrollbar">
                  
                  {agrupamento === 'PROJETO' ? (
                      // KANBAN POR PROJETO (Com filtro para esconder colunas vazias)
                      listaProjetos
                        .filter(p => (esconderFiltroProjeto || !projetoId) ? true : p.id === projetoId)
                        .map(projeto => {
                            const tarefasDoProjeto = tarefasFiltradas.filter(t => t.projeto_id === projeto.id);
                            
                            // SEGREDO AQUI: Esconde se vazio e não selecionado
                            if (tarefasDoProjeto.length === 0 && !projetoId) return null;

                            return (
                                <KanbanColumn key={projeto.id} titulo={projeto.nome} count={tarefasDoProjeto.length}
                                    tarefas={tarefasDoProjeto} onDrop={() => {}} onCheck={handleCheck} onOpen={setSelectedTarefa} isPending={isPending} tipo="PROJETO" />
                            )
                        })
                  ) : (
                      // KANBAN POR COLUNA
                      <>
                        {tarefasFiltradas.some(t => !t.coluna_id) && (
                            <KanbanColumn titulo="Não Classificado" count={tarefasFiltradas.filter(t => !t.coluna_id).length}
                                tarefas={tarefasFiltradas.filter(t => !t.coluna_id)}
                                onDrop={() => {}} onCheck={handleCheck} onOpen={setSelectedTarefa} isPending={isPending} isWarning tipo="COLUNA" />
                        )}
                        {colunas.map(coluna => (
                            <KanbanColumn key={coluna.id} titulo={coluna.nome} count={tarefasFiltradas.filter(t => t.coluna_id === coluna.id).length}
                                tarefas={tarefasFiltradas.filter(t => t.coluna_id === coluna.id)}
                                onDrop={(itemId: string) => {
                                    const tarefaMovida = tarefasFiltradas.find(t => t.id === itemId)
                                    if (tarefaMovida) startTransition(() => moverTarefaDeColuna(itemId, coluna.id, tarefaMovida.projeto_id))
                                }} onCheck={handleCheck} onOpen={setSelectedTarefa} isPending={isPending} tipo="COLUNA" dropId={coluna.id} />
                        ))}
                      </>
                  )}
              </div>
          )}

          {/* MODO CALENDÁRIO (ESTAVA FALTANDO ISSO AQUI EMBAIXO) */}
          {view === 'CALENDARIO' && (
              <div className="h-full overflow-hidden">
                  <CalendarView 
                      tarefas={tarefasFiltradas} 
                      abrirModal={(t) => setSelectedTarefa(t)}
                      enableNavigation={enableCalendarNavigation}
                      initialDate={initialCalendarDate}
                      fixedViewMode={calendarViewMode} 
                  />
              </div>
          )}

        </div>
        
        {/* MODAIS */}
        {selectedTarefa && <ModalTarefa tarefa={selectedTarefa} isOpen={!!selectedTarefa} onClose={() => setSelectedTarefa(null)} usuarios={usuarios} projetos={listaProjetos} />}
        
        {tarefaParaConcluir && <ModalConclusao isOpen={!!tarefaParaConcluir} onClose={() => setTarefaParaConcluir(null)} onConfirm={confirmarConclusao} isSaving={isPending} />}
      
      </div>
    </DndProvider>
  )
}

// --- SUB-COMPONENTES ---

function KanbanColumn({ titulo, count, tarefas, onDrop, onCheck, onOpen, isPending, isWarning, tipo, dropId }: any) {
    const [{ isOver }, dropRef] = useDrop(() => ({
        accept: 'KANBAN_TASK',
        drop: (item: { id: string }) => { if (tipo === 'COLUNA') onDrop(item.id) },
        collect: (monitor) => ({ isOver: monitor.isOver() }),
        canDrop: () => tipo === 'COLUNA'
    }), [dropId])

    return (
        <div ref={dropRef as unknown as React.LegacyRef<HTMLDivElement>} className={`w-80 flex-shrink-0 flex flex-col bg-gray-100 rounded-xl border border-gray-200 max-h-full transition-colors ${isOver ? 'bg-indigo-50 border-indigo-300' : ''} ${isWarning ? 'bg-red-50 border-red-100' : ''}`}>
            <div className={`p-3 font-bold text-gray-700 text-sm border-b border-gray-200 flex justify-between rounded-t-xl ${isWarning ? 'text-red-500 bg-red-50' : 'bg-white'}`}>
                <span className="truncate" title={titulo}>{titulo}</span>
                <span className="bg-gray-100 text-gray-500 px-2 rounded-full text-xs flex items-center border border-gray-200">{count}</span>
            </div>
            <div className="p-2 overflow-y-auto flex-1 space-y-2 custom-scrollbar-thin">
                {tarefas.length === 0 ? <div className="text-center text-gray-400 text-xs py-4 italic">Vazio</div> : tarefas.map((t: any) => (
                        <DraggableKanbanCard key={t.id} tarefa={t} onCheck={onCheck} onOpen={onOpen} isPending={isPending} />
                ))}
            </div>
        </div>
    )
}

function DraggableKanbanCard({ tarefa, onCheck, onOpen, isPending }: any) {
    const [{ isDragging }, dragRef] = useDrag(() => ({
        type: 'KANBAN_TASK',
        item: { id: tarefa.id },
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }), [tarefa.id])

    const formatarData = (dt: any) => { if (!dt) return null; return new Date(dt).toLocaleDateString('pt-BR') }

    return (
        <div ref={dragRef as unknown as React.LegacyRef<HTMLDivElement>} onClick={() => onOpen(tarefa)}
            className={`bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-default group relative ${isPending ? 'opacity-50' : ''} ${tarefa.concluida ? 'opacity-60 bg-gray-50' : ''} ${isDragging ? 'opacity-30' : ''}`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${tarefa.prioridade === 'ALTA' ? 'bg-red-500' : (tarefa.prioridade === 'MEDIA' ? 'bg-orange-400' : 'bg-green-400')}`}></div>
            <div className="pl-2">
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] border px-1.5 rounded uppercase font-semibold ${tarefa.concluida ? 'bg-green-50 border-green-100 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>{tarefa.concluida ? 'Concluída' : (tarefa.coluna?.nome || 'A Fazer')}</span>
                    <input type="checkbox" checked={tarefa.concluida} onChange={() => onCheck(tarefa.id, tarefa.concluida, tarefa.projeto_id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500 cursor-pointer" />
                </div>
                <h4 className={`font-semibold text-gray-800 text-sm mb-2 leading-tight ${tarefa.concluida ? 'line-through text-gray-400' : ''}`}>{tarefa.titulo}</h4>
                <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2 border-gray-50">
                    <span className={tarefa.dt_vencimento ? "text-gray-600" : "text-gray-300"}>📅 {formatarData(tarefa.dt_vencimento) || 'S/ Data'}</span>
                    {tarefa.usuario && <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-700 border border-indigo-200" title={tarefa.usuario.nome}>{tarefa.usuario.nome.substring(0, 2).toUpperCase()}</div>}
                </div>
            </div>
        </div>
    )
}