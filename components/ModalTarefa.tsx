'use client'

import { useState, useEffect, useRef } from 'react'
import { editarTarefa, adicionarComentario, toggleConcluida, excluirTarefa, concluirTarefaComComentario } from '@/app/actions'
import ModalConclusao from './ModalConclusao'

interface ModalProps {
  tarefa: any
  isOpen: boolean 
  onClose: () => void
  usuarios: any[]
  projetos: any[]
}

export default function ModalTarefa({ tarefa, isOpen, onClose, usuarios, projetos }: ModalProps) {
  if (!isOpen) return null

  // Estado local dos comentários (inicia com os que vieram do banco)
  // O "|| []" evita erro se vier sem comentários
  const [comentarios, setComentarios] = useState<any[]>(tarefa.comentarios || [])
  const [comentarioTexto, setComentarioTexto] = useState('')
  const [showConclusaoModal, setShowConclusaoModal] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scrolla para o último comentário ao abrir ou adicionar
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [comentarios, isOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleToggle = async () => {
    if (!tarefa.concluida) {
        setShowConclusaoModal(true)
    } else {
        await toggleConcluida(tarefa.id, false, tarefa.projeto_id)
    }
  }

  const confirmarConclusao = async (texto: string) => {
    const userId = usuarios[0]?.id || tarefa.usuario_id
    await concluirTarefaComComentario(tarefa.id, texto, tarefa.projeto_id, userId)
    setShowConclusaoModal(false)
  }

  // Ação de comentar no front
  const handleComentar = async (formData: FormData) => {
      const novoComentario = await adicionarComentario(formData)
      if (novoComentario) {
          setComentarios(prev => [...prev, novoComentario]) // Adiciona na lista visual
          setComentarioTexto('') // Limpa campo
      }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <button 
             onClick={handleToggle}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${tarefa.concluida ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
          >
             <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${tarefa.concluida ? 'bg-green-500 border-green-500 text-white' : 'border-gray-400'}`}>
               {tarefa.concluida && '✓'}
             </div>
             <span className="text-sm font-medium">{tarefa.concluida ? 'Concluída' : 'Marcar Concluída'}</span>
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        {/* CORPO */}
        <div className="flex-1 overflow-y-auto p-6 md:flex gap-8">
          
          {/* LADO ESQUERDO: Formulário */}
          <div className="flex-1 space-y-6">
            <form action={editarTarefa} className="space-y-4">
              <input type="hidden" name="id" value={tarefa.id} />
              <input type="hidden" name="projetoId" value={tarefa.projeto_id} />

              <input name="titulo" defaultValue={tarefa.titulo} className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 border-none focus:ring-0 p-0 bg-transparent resize-none" placeholder="Escreva o nome da tarefa..." />

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Descrição</label>
                <textarea name="descricao" defaultValue={tarefa.descricao || ''} rows={4} className="w-full text-sm text-gray-700 bg-gray-50 border-0 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500" placeholder="Adicione mais detalhes..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Data de Entrega</label>
                   <input type="date" name="dtVencimento" defaultValue={tarefa.dt_vencimento ? new Date(tarefa.dt_vencimento).toISOString().split('T')[0] : ''} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
                </div>
                <div>
                   <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Prioridade</label>
                   <select name="prioridade" defaultValue={tarefa.prioridade} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                      <option value="BAIXA">🟢 Baixa</option>
                      <option value="MEDIA">🟠 Média</option>
                      <option value="ALTA">🔴 Alta</option>
                   </select>
                </div>
              </div>

              <div>
                   <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Dificuldade</label>
                   <select name="dificuldade" defaultValue={tarefa.dificuldade || 'MEDIA'} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                      <option value="FACIL">🌱 Fácil</option>
                      <option value="MEDIA">⚖️ Média</option>
                      <option value="DIFICIL">🔥 Difícil</option>
                   </select>
              </div>

              <div>
                 <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Responsável</label>
                 <select name="usuarioId" defaultValue={tarefa.usuario_id || ''} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                    <option value="">Sem responsável</option>
                    {usuarios.map(u => (<option key={u.id} value={u.id}>{u.nome}</option>))}
                 </select>
              </div>

              <div className="flex justify-end pt-2">
                 <button className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors">Salvar Alterações</button>
              </div>
            </form>
          </div>

          {/* LADO DIREITO: Comentários */}
          <div className="w-full md:w-80 bg-gray-50 rounded-xl p-4 flex flex-col border border-gray-100 h-[500px]">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 flex justify-between">
                Histórico
                <span className="bg-gray-200 text-gray-600 px-1.5 rounded text-[10px]">{comentarios.length}</span>
            </h3>
            
            <div ref={scrollRef} className="flex-1 space-y-3 mb-4 overflow-y-auto custom-scrollbar-thin pr-1">
              {comentarios.length === 0 && <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">Nenhum comentário.</div>}
              
              {comentarios.map((c: any) => (
                <div key={c.id} className="text-sm animate-in slide-in-from-bottom-2 fade-in duration-300">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-gray-800 text-xs">{c.usuario?.nome || 'Usuário'}</span>
                    <span className="text-[10px] text-gray-400">{new Date(c.dt_insert).toLocaleDateString()}</span>
                  </div>
                  <div className={`text-gray-600 bg-white p-2.5 rounded-lg shadow-sm border border-gray-100 text-xs leading-relaxed ${c.texto.startsWith('🏁') ? 'border-l-4 border-l-green-500 bg-green-50' : ''}`}>
                    {c.texto}
                  </div>
                </div>
              ))}
            </div>

            <form action={handleComentar} className="mt-auto">
              <input type="hidden" name="tarefaId" value={tarefa.id} />
              <input type="hidden" name="projetoId" value={tarefa.projeto_id} />
              <input type="hidden" name="usuarioId" value={usuarios[0]?.id} />
              
              <div className="relative">
                <textarea 
                    name="texto" 
                    value={comentarioTexto} 
                    onChange={e => setComentarioTexto(e.target.value)} 
                    className="w-full text-xs border border-gray-300 rounded-xl p-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none shadow-sm outline-none" 
                    placeholder="Escreva um comentário..." 
                    rows={2} 
                    required 
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            e.currentTarget.form?.requestSubmit();
                        }
                    }}
                />
                <button type="submit" className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm" title="Enviar">
                    <svg className="w-3 h-3 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 text-right">Enter para enviar</p>
            </form>

            <div className="mt-2 pt-2 border-t border-gray-200">
               <button onClick={async () => { if(confirm('Tem certeza?')) { await excluirTarefa(tarefa.id, tarefa.projeto_id); onClose() } }} className="w-full text-[10px] text-red-400 hover:text-red-600 py-1 flex items-center justify-center gap-1 hover:underline">
                 Excluir Tarefa
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {showConclusaoModal && (
        <ModalConclusao 
            isOpen={showConclusaoModal} 
            onClose={() => setShowConclusaoModal(false)}
            onConfirm={confirmarConclusao}
            isSaving={false}
        />
    )}
    </>
  )
}