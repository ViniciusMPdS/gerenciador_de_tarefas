'use client'

import { useState, useTransition, useEffect } from 'react'
import { atualizarTarefa, excluirTarefa, adicionarComentario } from '@/app/actions' 

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

  // --- ESTADOS ---
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prioridadeId, setPrioridadeId] = useState('2')
  const [dificuldadeId, setDificuldadeId] = useState('3')
  const [usuarioId, setUsuarioId] = useState('')
  const [dtVencimento, setDtVencimento] = useState('')

  // Comentários
  const [novoComentario, setNovoComentario] = useState('')
  const [listaComentarios, setListaComentarios] = useState<any[]>([])

  // Atualiza estados quando abre o modal
  useEffect(() => {
    if (isOpen && tarefa) {
        setTitulo(tarefa.titulo)
        setDescricao(tarefa.descricao || '')
        setPrioridadeId(String(tarefa.prioridade_id || '2'))
        setDificuldadeId(String(tarefa.dificuldade_id || '3'))
        setUsuarioId(tarefa.usuario_id || '')

        // Ordenar comentários (Mais recentes primeiro)
        const comentariosOrdenados = (tarefa.comentarios || []).sort((a: any, b: any) => 
            new Date(b.dt_insert).getTime() - new Date(a.dt_insert).getTime()
        )
        setListaComentarios(comentariosOrdenados)

        if (tarefa.dt_vencimento) {
            const iso = new Date(tarefa.dt_vencimento).toISOString().split('T')[0]
            setDtVencimento(iso)
        } else {
            setDtVencimento('')
        }
    }
  }, [isOpen, tarefa])
  
  if (!isOpen) return null

  // Helpers
  const formatarDataExibicao = (dataString: any) => {
    if (!dataString) return 'Sem data';
    return new Date(dataString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  const formatarDataHora = (dataString: any) => {
    if (!dataString) return '-';
    return new Date(dataString).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
  }

  const handleSalvar = () => {
    startTransition(async () => {
      // Ajuste Fuso Horário (Meio-dia)
      let dataIso = null
      if (dtVencimento) {
          const d = new Date(dtVencimento)
          d.setHours(12, 0, 0, 0)
          dataIso = d
      }

      await atualizarTarefa(tarefa.id, {
        titulo,
        descricao,
        dt_vencimento: dataIso,
        prioridade_id: Number(prioridadeId), 
        dificuldade_id: Number(dificuldadeId),
        usuario_id: usuarioId || null
      }, tarefa.projeto_id)
      
      setModoEdicao(false)
      onClose()
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

  const handleEnviarComentario = async () => {
      if (!novoComentario.trim()) return;

      const tempComentario = {
          id: Math.random().toString(),
          texto: novoComentario,
          dt_insert: new Date(),
          usuario: { nome: 'Eu' } 
      }
      
      // Adiciona no topo
      setListaComentarios([tempComentario, ...listaComentarios])
      
      const textoEnviar = novoComentario
      setNovoComentario('')

      await adicionarComentario(tarefa.id, textoEnviar)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* VOLTANDO AO LAYOUT ORIGINAL (max-w-2xl) */}
      <div className="relative bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-start p-5 border-b border-border bg-surface-highlight/20">
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
                </div>
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-foreground text-2xl leading-none">&times;</button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto custom-scrollbar-thin space-y-6 flex-1">
            
            {/* GRID DE METADADOS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-highlight/10 p-4 rounded-lg border border-border">
                
                {/* Data (Editável) */}
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Vencimento</label>
                    {modoEdicao ? (
                         <input 
                            type="date" 
                            value={dtVencimento} 
                            onChange={e => setDtVencimento(e.target.value)}
                            className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-foreground scheme-dark"
                         />
                    ) : (
                        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                            <span>📅</span>
                            <span>{formatarDataExibicao(tarefa.dt_vencimento)}</span>
                        </div>
                    )}
                </div>

                {/* Prioridade */}
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Prioridade</label>
                    {modoEdicao ? (
                        <select value={prioridadeId} onChange={e => setPrioridadeId(e.target.value)} className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-foreground">
                            <option value="1">Baixa</option>
                            <option value="2">Média</option>
                            <option value="3">Alta</option>
                        </select>
                    ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border 
                            ${tarefa.prioridade_id === 3 ? 'bg-red-500/10 text-red-500 border-red-500/20' : (tarefa.prioridade_id === 2 ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20')}`}>
                            {tarefa.prioridade?.nome || 'Normal'}
                        </span>
                    )}
                </div>

                {/* Dificuldade */}
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Dificuldade</label>
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
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Responsável</label>
                    {modoEdicao ? (
                         <select value={usuarioId} onChange={e => setUsuarioId(e.target.value)} className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-foreground">
                            <option value="">Sem dono</option>
                            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                        </select>
                    ) : (
                        <div className="flex items-center gap-2">
                             {tarefa.usuario ? (
                                <div className="flex items-center gap-1.5" title={tarefa.usuario.nome}>
                                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-[9px] font-bold border border-indigo-500/30">
                                        {tarefa.usuario.nome.substring(0,1).toUpperCase()}
                                    </div>
                                    <span className="text-sm text-foreground truncate max-w-[80px]">{tarefa.usuario.nome.split(' ')[0]}</span>
                                </div>
                             ) : <span className="text-sm text-text-muted italic">--</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* DESCRIÇÃO */}
            <div>
                <h3 className="text-xs font-bold text-text-muted uppercase mb-2">Descrição</h3>
                {modoEdicao ? (
                    <textarea 
                        value={descricao} 
                        onChange={e => setDescricao(e.target.value)}
                        rows={4}
                        className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-foreground focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                ) : (
                    <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-surface-highlight/5 p-3 rounded-lg border border-border/50">
                        {tarefa.descricao || <span className="italic text-text-muted">Sem descrição.</span>}
                    </div>
                )}
            </div>

            {/* COMENTÁRIOS (Sempre visível, abaixo da descrição) */}
            <div className="border-t border-border pt-4">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    💬 Comentários <span className="bg-surface-highlight px-2 py-0.5 rounded-full text-xs text-text-muted">{listaComentarios.length}</span>
                </h3>

                <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto custom-scrollbar-thin pr-2">
                    {listaComentarios.length === 0 ? (
                        <div className="text-center py-4 bg-surface-highlight/5 rounded-lg border border-dashed border-border">
                            <p className="text-xs text-text-muted">Nenhum comentário. Seja o primeiro!</p>
                        </div>
                    ) : (
                        listaComentarios.map((c: any, idx) => (
                            <div key={c.id || idx} className="bg-surface p-3 rounded-lg border border-border hover:border-indigo-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400">
                                            {c.usuario?.nome ? c.usuario.nome.substring(0,1).toUpperCase() : '?'}
                                        </div>
                                        <span className="text-xs font-bold text-foreground">{c.usuario?.nome || 'Usuário'}</span>
                                    </div>
                                    <span className="text-[10px] text-text-muted">{new Date(c.dt_insert).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}</span>
                                </div>
                                {/* CORREÇÃO AQUI: QUEBRA DE LINHA FORÇADA */}
                                <p className="text-sm text-gray-400 ml-6 whitespace-pre-wrap break-words">{c.texto}</p>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={novoComentario} onChange={e => setNovoComentario(e.target.value)}
                        placeholder="Escreva um comentário..."
                        onKeyDown={e => e.key === 'Enter' && handleEnviarComentario()}
                        className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-indigo-500 outline-none"
                    />
                    <button 
                        onClick={handleEnviarComentario}
                        disabled={!novoComentario.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                    >
                        Enviar
                    </button>
                </div>
            </div>

            <div className="flex gap-4 text-[9px] text-text-muted pt-2 opacity-60">
                <p>Criado: {formatarDataHora(tarefa.dt_insert)}</p>
                {tarefa.dt_update && <p>Atualizado: {formatarDataHora(tarefa.dt_update)}</p>}
            </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-surface border-t border-border flex justify-between items-center">
            {modoEdicao ? (
                <>
                    <button onClick={handleExcluir} className="text-red-500 hover:text-red-600 text-sm font-medium px-2 hover:underline">Excluir</button>
                    <div className="flex gap-2">
                        <button onClick={() => setModoEdicao(false)} disabled={isPending} className="px-4 py-2 text-sm text-text-muted hover:text-foreground">Cancelar</button>
                        <button onClick={handleSalvar} disabled={isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
                            {isPending ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </>
            ) : (
                <>
                   <div></div>
                   <button onClick={() => setModoEdicao(true)} className="px-6 py-2 bg-surface-highlight border border-border hover:bg-surface-highlight/80 text-foreground rounded-lg text-sm font-medium transition-colors shadow-sm">
                        Editar Detalhes
                    </button>
                </>
            )}
        </div>

      </div>
    </div>
  )
}