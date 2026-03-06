'use client'

import { useState, useTransition } from 'react'
import { atualizarDetalhesProjeto, excluirProjetoCompleto } from '@/app/actions'
import { useRouter } from 'next/navigation'
import BotaoDeletar from './BotaoDeletar'
import { Edit2 } from 'lucide-react'

interface Props {
  projeto: { id: string, nome: string, descricao: string | null, equipe_id: string | null }
}

export default function ModalEditarProjeto({ projeto }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [nome, setNome] = useState(projeto.nome)
  const [descricao, setDescricao] = useState(projeto.descricao || '')
  
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSalvar = () => {
    if (!nome.trim()) return

    startTransition(async () => {
      await atualizarDetalhesProjeto(projeto.id, nome, descricao)
      setIsOpen(false)
    })
  }

  const handleExcluir = async () => {
    await excluirProjetoCompleto(projeto.id)
    setIsOpen(false)
    // Redireciona de volta para a biblioteca de projetos da equipe
    router.push(`/equipe/${projeto.equipe_id}/projetos`)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-indigo-500 transition-colors p-1.5 rounded-md hover:bg-indigo-50 ml-2"
        title="Editar Projeto"
      >
        <Edit2 size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            
            <div className="px-6 py-4 border-b border-border bg-surface-highlight/20 flex justify-between items-center">
              <h3 className="font-bold text-foreground">Editar Projeto</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Nome do Projeto</label>
                <input 
                    value={nome} 
                    onChange={e => setNome(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-foreground" 
                />
              </div>

              <div>
                 <label className="block text-xs font-bold text-text-muted uppercase mb-1">Descrição</label>
                 <textarea 
                    value={descricao} 
                    onChange={e => setDescricao(e.target.value)}
                    rows={3} 
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-foreground" 
                 />
              </div>
            </div>

            <div className="px-6 py-4 bg-surface-highlight/10 border-t border-border flex justify-between items-center">
              {/* O seu botão de deletar reaproveitado! */}
              <BotaoDeletar 
                  texto="Excluir Projeto"
                  titulo="Excluir o Projeto Inteiro?"
                  descricao={`Tem certeza? Isso apagará permanentemente o projeto "${projeto.nome}" e TODAS as tarefas, anexos e comentários dentro dele.`}
                  onConfirm={handleExcluir}
              />

              <div className="flex gap-2">
                <button onClick={() => setIsOpen(false)} disabled={isPending} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-foreground">Cancelar</button>
                <button onClick={handleSalvar} disabled={isPending} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
                  {isPending ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}