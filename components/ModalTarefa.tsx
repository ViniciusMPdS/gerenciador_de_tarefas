'use client'

import { useState } from 'react'
import { editarTarefa, adicionarComentario } from '@/app/actions' // Importe a nova ação

interface Usuario {
  id: string
  nome: string
}

interface ModalProps {
  tarefa: any
  usuarios: Usuario[]
  onClose: () => void
}

export default function ModalTarefa({ tarefa, usuarios, onClose }: ModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  // Estado para simular quem está comentando (PROVISÓRIO ATÉ TER LOGIN)
  const [usuarioAtualId, setUsuarioAtualId] = useState(usuarios[0]?.id || '')

  const dataFormatada = tarefa.dt_vencimento 
    ? new Date(tarefa.dt_vencimento).toISOString().split('T')[0] 
    : ''

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden relative flex flex-col md:flex-row max-h-[90vh]">
        
        {/* LADO ESQUERDO: Edição da Tarefa (Formulário) */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-gray-100">
          
          <div className="flex justify-between items-center mb-6">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detalhes</span>
             {/* Simulador de Usuário Logado */}
             <div className="text-xs flex items-center gap-2 bg-yellow-50 p-1 rounded">
               <span className="text-yellow-700">Comentar como:</span>
               <select 
                  value={usuarioAtualId} 
                  onChange={e => setUsuarioAtualId(e.target.value)}
                  className="bg-transparent font-bold outline-none text-yellow-800"
               >
                 {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
               </select>
             </div>
          </div>

          <form action={async (formData) => {
            setIsSaving(true)
            await editarTarefa(formData)
            setIsSaving(false)
            onClose()
          }} className="space-y-6">
            
            <input type="hidden" name="id" value={tarefa.id} />
            <input type="hidden" name="projetoId" value={tarefa.projeto_id} />
            <input type="hidden" name="status" value={tarefa.status} />

            <div>
              <input 
                name="titulo"
                defaultValue={tarefa.titulo}
                className="w-full text-2xl font-bold text-gray-800 placeholder-gray-300 border-none focus:ring-0 outline-none p-0"
                placeholder="Nome da Tarefa"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Responsável</label>
                <select name="usuarioId" defaultValue={tarefa.usuario_id || ''} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
                  <option value="">-- Ninguém --</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vencimento</label>
                <input type="date" name="dtVencimento" defaultValue={dataFormatada} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 text-gray-600"/>
              </div>
            </div>
            
            <div>
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prioridade</label>
               <select name="prioridade" defaultValue={tarefa.prioridade} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Descrição</label>
              <textarea name="descricao" defaultValue={tarefa.descricao || ''} rows={5} placeholder="Detalhes..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 resize-none"/>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>

        {/* LADO DIREITO: Comentários (Chat) */}
        <div className="w-full md:w-80 bg-gray-50 flex flex-col h-[50vh] md:h-auto">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-white">
            <h3 className="font-semibold text-gray-700 text-sm">Comentários</h3>
            <button onClick={onClose} className="md:hidden text-gray-400 text-2xl">×</button>
          </div>

          {/* Lista de Comentários */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {tarefa.comentarios && tarefa.comentarios.length > 0 ? (
              tarefa.comentarios.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-700">
                    {c.usuario?.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-gray-900">{c.usuario?.nome}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.dt_insert).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg rounded-tl-none border border-gray-200 shadow-sm text-sm text-gray-700 mt-1">
                      {c.texto}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 text-xs mt-10">
                Nenhum comentário ainda.
              </div>
            )}
          </div>

          {/* Input de Comentário */}
          <div className="p-3 bg-white border-t border-gray-200">
            <form action={adicionarComentario} className="flex gap-2">
              <input type="hidden" name="tarefaId" value={tarefa.id} />
              <input type="hidden" name="projetoId" value={tarefa.projeto_id} />
              <input type="hidden" name="usuarioId" value={usuarioAtualId} /> {/* Usa o usuário selecionado no topo */}
              
              <input 
                name="texto"
                placeholder="Escreva um comentário..."
                className="flex-1 bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                autoComplete="off"
                required
              />
              <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700">
                ➤
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}