'use client'

import { useState, useTransition } from 'react'
import { atualizarTarefa, excluirTarefa } from '@/app/actions' 

interface Props {
  tarefa: any
  isOpen: boolean
  onClose: () => void
  usuarios: any[]
  projetos: any[]
}

export default function ModalTarefa({ tarefa, isOpen, onClose, usuarios, projetos }: Props) {
  const [isPending, startTransition] = useTransition()
  const [modoEdicao, setModoEdicao] = useState(false)

  // Estados locais para edição
  const [titulo, setTitulo] = useState(tarefa.titulo)
  const [descricao, setDescricao] = useState(tarefa.descricao || '')
  const [prioridadeId, setPrioridadeId] = useState(tarefa.prioridade_id)
  const [dificuldadeId, setDificuldadeId] = useState(tarefa.dificuldade_id)
  const [usuarioId, setUsuarioId] = useState(tarefa.usuario_id || '')
  
  if (!isOpen) return null

  // --- CORREÇÃO DE DATA (Fuso Horário) ---
  // O banco salva UTC. O navegador converte pra local automaticamente com new Date().
  // Mas para exibir bonitinho:
  const formatarDataHora = (dataString: any) => {
    if (!dataString) return '-';
    return new Date(dataString).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
  }

  const handleSalvar = () => {
    startTransition(async () => {
      await atualizarTarefa(tarefa.id, {
        titulo,
        descricao,
        prioridadeId: Number(prioridadeId),
        dificuldadeId: Number(dificuldadeId),
        usuarioId
      }, tarefa.projeto_id)
      
      setModoEdicao(false)
      onClose() // <--- CORREÇÃO: Fecha o modal após salvar
    })
  }

  const handleExcluir = () => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        startTransition(async () => {
            await excluirTarefa(tarefa.id, tarefa.projeto_id)
            onClose()
        })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-start p-6 border-b border-border bg-surface-highlight/20">
            <div className="flex-1 mr-4">
                {modoEdicao ? (
                    <input 
                        value={titulo} 
                        onChange={e => setTitulo(e.target.value)}
                        className="w-full text-xl font-bold bg-white border border-indigo-300 rounded px-2 py-1 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                ) : (
                    <h2 className="text-xl font-bold text-foreground leading-tight">{tarefa.titulo}</h2>
                )}
                <div className="text-xs text-text-muted mt-1 flex gap-2">
                    <span>Em: {tarefa.projeto?.nome}</span>
                    <span>•</span>
                    <span>Coluna: {tarefa.coluna?.nome}</span>
                </div>
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-foreground text-2xl leading-none">&times;</button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto custom-scrollbar-thin space-y-6">
            
            {/* DESCRIÇÃO */}
            <div>
                <h3 className="text-xs font-bold text-text-muted uppercase mb-2">Descrição</h3>
                {modoEdicao ? (
                    <textarea 
                        value={descricao} 
                        onChange={e => setDescricao(e.target.value)}
                        rows={5}
                        className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-foreground focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                ) : (
                    <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {tarefa.descricao || <span className="italic text-text-muted">Sem descrição.</span>}
                    </div>
                )}
            </div>

            {/* METADADOS (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-surface-highlight/30 p-4 rounded-lg border border-border">
                
                {/* Prioridade */}
                <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Prioridade</label>
                    {modoEdicao ? (
                        <select value={prioridadeId} onChange={e => setPrioridadeId(e.target.value)} className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-foreground">
                            <option value="1">Baixa</option>
                            <option value="2">Média</option>
                            <option value="3">Alta</option>
                        </select>
                    ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${tarefa.prioridade_id === 3 ? 'bg-red-500/10 text-red-500' : (tarefa.prioridade_id === 2 ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500')}`}>
                            {tarefa.prioridade?.nome || 'Normal'}
                        </span>
                    )}
                </div>

                {/* Dificuldade */}
                <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Dificuldade</label>
                    {modoEdicao ? (
                        <select value={dificuldadeId} onChange={e => setDificuldadeId(e.target.value)} className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-foreground">
                            <option value="1">Muito Fácil</option>
                            <option value="2">Fácil</option>
                            <option value="3">Média</option>
                            <option value="4">Difícil</option>
                            <option value="5">Muito Difícil</option>
                        </select>
                    ) : (
                        <span className="text-sm font-medium text-foreground">{tarefa.dificuldade?.nome || 'Média'}</span>
                    )}
                </div>

                {/* Responsável */}
                <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Responsável</label>
                    {modoEdicao ? (
                         <select value={usuarioId} onChange={e => setUsuarioId(e.target.value)} className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-foreground">
                            <option value="">Sem dono</option>
                            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                        </select>
                    ) : (
                        <div className="flex items-center gap-2">
                             {tarefa.usuario ? (
                                <>
                                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-[10px] font-bold">
                                        {tarefa.usuario.nome.substring(0,2).toUpperCase()}
                                    </div>
                                    <span className="text-sm text-foreground truncate">{tarefa.usuario.nome}</span>
                                </>
                             ) : <span className="text-sm text-text-muted italic">--</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* DATAS (Info de Rodapé) */}
            <div className="flex gap-6 text-[10px] text-text-muted border-t border-border pt-4">
                <p>Criado em: <span className="font-mono text-foreground">{formatarDataHora(tarefa.dt_insert)}</span></p>
                {/* Agora mostramos o Update se ele existir */}
                {tarefa.dt_update && (
                    <p>Atualizado em: <span className="font-mono text-foreground">{formatarDataHora(tarefa.dt_update)}</span></p>
                )}
            </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-surface border-t border-border flex justify-between items-center">
            {modoEdicao ? (
                <>
                    <button onClick={handleExcluir} className="text-red-500 hover:text-red-600 text-sm font-medium px-4">Excluir Tarefa</button>
                    <div className="flex gap-3">
                        <button onClick={() => setModoEdicao(false)} disabled={isPending} className="px-4 py-2 text-sm text-text-muted hover:text-foreground">Cancelar</button>
                        <button onClick={handleSalvar} disabled={isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
                            {isPending ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <button className="text-text-muted text-sm cursor-not-allowed" title="Comentários em breve">💬 Comentários</button>
                    <button onClick={() => setModoEdicao(true)} className="px-4 py-2 bg-surface-highlight border border-border hover:bg-surface-highlight/80 text-foreground rounded-lg text-sm font-medium transition-colors">
                        Editar Tarefa
                    </button>
                </>
            )}
        </div>

      </div>
    </div>
  )
}