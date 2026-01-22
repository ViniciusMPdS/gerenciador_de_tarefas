'use client'

import { useState, useEffect } from 'react'
import { editarTarefa, adicionarComentario, toggleConcluida, excluirTarefa } from '@/app/actions'

interface ModalProps {
  tarefa: any
  isOpen: boolean // <--- Adicionamos aqui para corrigir o erro
  onClose: () => void
  usuarios: any[]
  projetos: any[]
}

export default function ModalTarefa({ tarefa, isOpen, onClose, usuarios, projetos }: ModalProps) {
  // Se não estiver aberto, não renderiza nada (null)
  if (!isOpen) return null

  // Estado local para comentários otimistas
  const [comentarioTexto, setComentarioTexto] = useState('')

  // Fecha ao apertar ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop Escuro */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Card do Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* --- HEADER --- */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          
          {/* Botão de Concluir (Checkbox Gigante) */}
          <button 
             onClick={() => toggleConcluida(tarefa.id, !tarefa.concluida, tarefa.projeto_id)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${tarefa.concluida ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
          >
             <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${tarefa.concluida ? 'bg-green-500 border-green-500 text-white' : 'border-gray-400'}`}>
               {tarefa.concluida && '✓'}
             </div>
             <span className="text-sm font-medium">{tarefa.concluida ? 'Concluída' : 'Marcar Concluída'}</span>
          </button>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        {/* --- CORPO (Scrollável) --- */}
        <div className="flex-1 overflow-y-auto p-6 md:flex gap-8">
          
          {/* LADO ESQUERDO: Formulário */}
          <div className="flex-1 space-y-6">
            <form action={editarTarefa} id="form-editar" className="space-y-4">
              <input type="hidden" name="id" value={tarefa.id} />
              <input type="hidden" name="projetoId" value={tarefa.projeto_id} />

              {/* Título */}
              <input 
                name="titulo"
                defaultValue={tarefa.titulo}
                className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 border-none focus:ring-0 p-0 bg-transparent resize-none"
                placeholder="Escreva o nome da tarefa..."
              />

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Descrição</label>
                <textarea 
                  name="descricao"
                  defaultValue={tarefa.descricao || ''}
                  rows={4}
                  className="w-full text-sm text-gray-700 bg-gray-50 border-0 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Adicione mais detalhes..."
                />
              </div>

              {/* Metadados (Data, Prioridade, Responsável) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Data de Entrega</label>
                   <input 
                     type="date" 
                     name="dtVencimento"
                     defaultValue={tarefa.dt_vencimento ? new Date(tarefa.dt_vencimento).toISOString().split('T')[0] : ''}
                     className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                   />
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

              {/* Responsável */}
              <div>
                 <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Responsável</label>
                 <select name="usuarioId" defaultValue={tarefa.usuario_id || ''} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                    <option value="">Sem responsável</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                 </select>
              </div>

              {/* Botão Salvar Discreto */}
              <div className="flex justify-end pt-2">
                 <button className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors">
                   Salvar Alterações
                 </button>
              </div>
            </form>
          </div>

          {/* LADO DIREITO: Comentários e Infos */}
          <div className="w-full md:w-72 bg-gray-50 rounded-xl p-4 flex flex-col border border-gray-100 h-fit">
            
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Atividade</h3>
            
            {/* Lista de Comentários */}
            <div className="flex-1 space-y-3 mb-4 max-h-60 overflow-y-auto">
              {tarefa.comentarios?.length === 0 && (
                <p className="text-xs text-gray-400 italic">Nenhum comentário ainda.</p>
              )}
              {tarefa.comentarios?.map((c: any) => (
                <div key={c.id} className="text-sm">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-gray-800 text-xs">{c.usuario.nome}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(c.dt_insert).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 bg-white p-2 rounded shadow-sm border border-gray-100">{c.texto}</p>
                </div>
              ))}
            </div>

            {/* Input de Novo Comentário */}
            <form action={async (formData) => {
                await adicionarComentario(formData)
                setComentarioTexto('') // Limpa input
            }}>
              <input type="hidden" name="tarefaId" value={tarefa.id} />
              <input type="hidden" name="projetoId" value={tarefa.projeto_id} />
              <input type="hidden" name="usuarioId" value={usuarios[0]?.id} /> {/* Pega o primeiro usuário como autor temporário */}
              
              <textarea 
                name="texto"
                value={comentarioTexto}
                onChange={e => setComentarioTexto(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 mb-2 resize-none"
                placeholder="Escreva um comentário..."
                rows={2}
                required
              />
              <button className="w-full bg-white border border-gray-200 text-gray-600 text-xs font-medium py-1.5 rounded hover:bg-gray-100 transition-colors">
                Comentar
              </button>
            </form>

            {/* Ações de Perigo */}
            <div className="mt-6 pt-4 border-t border-gray-200">
               <button 
                 onClick={async () => {
                   if(confirm('Tem certeza que deseja excluir esta tarefa?')) {
                     await excluirTarefa(tarefa.id, tarefa.projeto_id)
                     onClose()
                   }
                 }}
                 className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded transition-colors flex items-center justify-center gap-2"
               >
                 🗑️ Excluir Tarefa
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}