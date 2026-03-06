'use client'

import { useState } from 'react'
import { editarProjeto } from '@/app/actions'
import { Settings2, Save } from 'lucide-react'

// Adapte o tipo 'Projeto' conforme o que você já usa
interface Props {
  projeto: any 
}

export default function ModalEditarProjeto({ projeto }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Estado para controlar a exibição do campo "Motivo da Pausa"
  const [statusSelecionado, setStatusSelecionado] = useState(projeto.status_cliente || 'EM_ANDAMENTO')

  if (!projeto) return null

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    await editarProjeto(formData)
    setLoading(false)
    setIsOpen(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        title="Editar Dados do Projeto"
        className="text-gray-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors ml-2"
      >
        <Settings2 size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            <div className="px-6 py-4 border-b border-border bg-surface-highlight/20 flex justify-between items-center">
              <h3 className="font-bold text-foreground">Editar Projeto</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="overflow-y-auto flex-1">
                <form id="form-editar-projeto" action={handleSubmit} className="p-6 space-y-5">
                <input type="hidden" name="id" value={projeto.id} />
                <input type="hidden" name="equipeId" value={projeto.equipe_id || ''} />
                
                {/* Dados Básicos */}
                <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Nome do Projeto *</label>
                    <input name="nome" type="text" required defaultValue={projeto.nome} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-foreground" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Descrição</label>
                    <textarea name="descricao" rows={2} defaultValue={projeto.descricao || ''} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-foreground" />
                </div>

                <hr className="border-border" />

                {/* DADOS ONBLOX */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        Detalhes da Implantação
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                        
                        {/* STATUS DO PROJETO */}
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Status do Projeto *</label>
                            <select 
                                name="status_cliente" 
                                value={statusSelecionado}
                                onChange={(e) => setStatusSelecionado(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600"
                            >
                                <option value="EM_ANDAMENTO">🟢 Em Andamento</option>
                                <option value="PAUSADO">⏸️ Pausado</option>
                                <option value="CONCLUIDO">✅ Concluído</option>
                                <option value="AGUARDANDO CLIENTE">⌛ Aguardando Cliente</option>
                            </select>
                        </div>

                        {/* MOTIVO DA PAUSA */}
                        {statusSelecionado === 'PAUSADO' && (
                            <div className="col-span-2 animate-in fade-in zoom-in-95">
                                <label className="block text-xs font-bold text-red-500 uppercase mb-1">Motivo da Pausa *</label>
                                <textarea 
                                    name="motivo_pausa" 
                                    required 
                                    rows={2} 
                                    defaultValue={projeto.motivo_pausa || ''}
                                    placeholder="Descreva por que o projeto está travado..." 
                                    className="w-full bg-red-50/10 border border-red-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none text-red-500 resize-none" 
                                />
                            </div>
                        )}

                        {/* PACOTE ONBLOX */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Pacote Onblox</label>
                            <select name="pacote_onblox" defaultValue={projeto.pacote_onblox || ''} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-foreground">
                                <option value="">Selecione...</option>
                                <option value="WMS + REMOTO">WMS + REMOTO</option>
                                <option value="WMS + PRESENCIAL">WMS + PRESENCIAL</option>
                                <option value="RF + REMOTO">RF + REMOTO</option>
                                <option value="RF + PRESENCIAL">RF + PRESENCIAL</option>
                                <option value="START + REMOTO">START + REMOTO</option>
                                <option value="START + PRESENCIAL">START + PRESENCIAL</option>
                            </select>
                        </div>

                        {/* INTEGRAÇÃO */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Integração</label>
                            <select name="tipo_integracao" defaultValue={projeto.tipo_integracao || ''} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-foreground">
                                <option value="">Selecione...</option>
                                <option value="VIEW">VIEW</option>
                                <option value="API">API</option>
                                <option value="BANCO DE DADOS">BANCO DE DADOS</option>
                            </select>
                        </div>

                        {/* ERP */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-text-muted uppercase mb-1">ERP Principal</label>
                            {/* Como o ERP pode ser "Outro", deixamos um input de texto livre para edição para facilitar */}
                            <input name="erp" type="text" defaultValue={projeto.erp || ''} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-foreground" />
                        </div>

                        {/* Acesso */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Acesso Remoto</label>
                            <input name="dadosAcesso" type="text" defaultValue={projeto.dados_acesso || ''} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-foreground" />
                        </div>
                    </div>
                </div>

                </form>
            </div>

            <div className="px-6 py-4 bg-surface-highlight/10 border-t border-border flex justify-end gap-3 mt-auto">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-surface/50 rounded-lg">Cancelar</button>
                <button type="submit" form="form-editar-projeto" disabled={loading} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2">
                    {loading ? 'Salvando...' : <><Save size={16}/> Salvar Alterações</>}
                </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}