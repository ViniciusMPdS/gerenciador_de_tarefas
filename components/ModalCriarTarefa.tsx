'use client'

import { useState } from 'react'
import { criarTarefa } from '@/app/actions'

interface Props {
  projetoId: string
  colunas: any[]
  usuarios: any[]
}

export default function ModalCriarTarefa({ projetoId, colunas, usuarios }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Estados locais
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dtVencimento, setDtVencimento] = useState('')
  const [colunaId, setColunaId] = useState(colunas.length > 0 ? colunas[0].id : '')
  const [prioridadeId, setPrioridadeId] = useState('2') 
  const [dificuldadeId, setDificuldadeId] = useState('3') 
  const [usuarioId, setUsuarioId] = useState('')
  
  // 1. Estado da Recorrência
  const [recorrencia, setRecorrencia] = useState('NAO')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if(!titulo || !usuarioId) return;

    setIsSaving(true)

    // Ajuste Fuso Horário (Meio-dia)
    let dataIso = null
    if (dtVencimento) {
        const [ano, mes, dia] = dtVencimento.split('-').map(Number)
        dataIso= new Date(ano, mes-1, dia, 12, 0, 0)
    }

    // Chama a action passando os dados tipados corretamente
    await criarTarefa({
        titulo,
        descricao,
        dt_vencimento: dataIso,
        projeto_id: projetoId,
        coluna_id: colunaId,
        prioridade_id: Number(prioridadeId),
        dificuldade_id: Number(dificuldadeId),
        usuario_id: usuarioId,
        recorrencia: (recorrencia as any) // <--- ENVIA A RECORRÊNCIA (Cast any se enum não existir no front ainda)
    })

    setIsSaving(false)
    setIsOpen(false)
    
    // Limpa form
    setTitulo('')
    setDescricao('')
    setDtVencimento('')
    setRecorrencia('NAO')
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
      >
        <span className="text-lg leading-none">+</span>
        <span className="hidden sm:inline">Nova Tarefa</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />

          <div className="relative bg-surface rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-border">
            
            <div className="px-6 py-4 border-b border-border bg-surface-highlight/20 flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Criar Nova Tarefa</h2>
              <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-foreground">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* TÍTULO */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Título</label>
                <input 
                  value={titulo} onChange={e => setTitulo(e.target.value)}
                  required 
                  autoFocus
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none placeholder-text-muted" 
                  placeholder="O que precisa ser feito?" 
                />
              </div>

              {/* DESCRIÇÃO */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Descrição</label>
                <textarea 
                  value={descricao} onChange={e => setDescricao(e.target.value)}
                  rows={3} 
                  required
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none placeholder-text-muted resize-none" 
                  placeholder="Detalhes da tarefa..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* DATA */}
                <div>
                   <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Vencimento</label>
                   <input 
                      type="date" 
                      value={dtVencimento} onChange={e => setDtVencimento(e.target.value)}
                      required
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none scheme-dark" 
                   />
                </div>

                {/* COLUNA INICIAL */}
                <div>
                   <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Etapa Inicial</label>
                   <select value={colunaId} onChange={e => setColunaId(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none">
                      {colunas.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                   </select>
                </div>
              </div>

              {/* --- NOVA LINHA: PRIORIDADE E RECORRÊNCIA --- */}
              <div className="grid grid-cols-2 gap-4">
                 {/* PRIORIDADE */}
                 <div>
                   <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Prioridade</label>
                   <select 
                      value={prioridadeId} onChange={e => setPrioridadeId(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
                   >
                      <option value="1">1 - Baixa</option>
                      <option value="2">2 - Média</option>
                      <option value="3">3 - Alta</option>
                   </select>
                </div>

                {/* RECORRÊNCIA (NOVO) */}
                <div>
                   <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Repetir</label>
                   <select 
                      value={recorrencia} onChange={e => setRecorrencia(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
                   >
                      <option value="NAO">Nunca</option>
                      <option value="DIARIAMENTE">Diariamente</option>
                      <option value="SEMANALMENTE">Semanalmente</option>
                      <option value="MENSALMENTE">Mensalmente</option>
                   </select>
                </div>
              </div>

              {/* DIFICULDADE E RESPONSÁVEL */}
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Dificuldade</label>
                    <select 
                        value={dificuldadeId} onChange={e => setDificuldadeId(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="1">1 - Muito Fácil</option>
                        <option value="2">2 - Fácil</option>
                        <option value="3">3 - Média</option>
                        <option value="4">4 - Difícil</option>
                        <option value="5">5 - Muito Difícil</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Responsável</label>
                    <select value={usuarioId} onChange={e => setUsuarioId(e.target.value)} required className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="">Selecione...</option>
                        {usuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.nome}</option>
                        ))}
                    </select>
                  </div>
              </div>

              <div className="flex justify-end pt-4 gap-2 border-t border-border mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-text-muted hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? 'Criando...' : 'Criar Tarefa'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}