'use client'

import { useState } from 'react'
import { criarTarefa } from '@/app/actions'
//import { Plus } from 'lucide-react' // Se não tiver lucide, pode trocar pelo SVG no botão abaixo

interface Props {
  projetoId: string
  colunas: any[]
  usuarios: any[]
}

export default function ModalCriarTarefa({ projetoId, colunas, usuarios }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSaving(true)
    await criarTarefa(formData) // A Server Action já faz o revalidatePath
    setIsSaving(false)
    setIsOpen(false)
  }

  return (
    <>
      {/* BOTÃO QUE FICA NO HEADER DO PROJETO */}
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
      >
        <span className="text-lg leading-none">+</span>
        <span className="hidden sm:inline">Nova Tarefa</span>
      </button>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />

          <div className="relative bg-surface rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-border">
            
            <div className="px-6 py-4 border-b border-border bg-surface-highlight/20 flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Criar Nova Tarefa</h2>
              <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-foreground">✕</button>
            </div>
            
            <form action={handleSubmit} className="p-6 space-y-4">
              <input type="hidden" name="projetoId" value={projetoId} />

              {/* TÍTULO */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Título</label>
                <input 
                  name="titulo" 
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
                  name="descricao" 
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
                      name="dtVencimento" 
                      required
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none" 
                   />
                </div>

                {/* COLUNA INICIAL (Opcional, se não escolher vai pra primeira) */}
                <div>
                   <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Etapa</label>
                   <select name="colunaId" className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none">
                      {colunas.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {/* PRIORIDADE (Agora envia IDs 1, 2, 3) */}
                 <div>
                   <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Prioridade</label>
                   <select name="prioridadeId" className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="1">Baixa</option>
                      <option value="2" selected>Média</option>
                      <option value="3">Alta</option>
                   </select>
                </div>

                {/* DIFICULDADE (Agora envia IDs 1-5) */}
                <div>
                   <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Dificuldade</label>
                   <select name="dificuldadeId" className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="1">Muito Fácil</option>
                      <option value="2">Fácil</option>
                      <option value="3" selected>Média</option>
                      <option value="4">Difícil</option>
                      <option value="5">Muito Difícil</option>
                   </select>
                </div>
              </div>

              {/* RESPONSÁVEL */}
              <div>
                 <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Responsável</label>
                 <select name="usuarioId" required className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Selecione...</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                 </select>
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