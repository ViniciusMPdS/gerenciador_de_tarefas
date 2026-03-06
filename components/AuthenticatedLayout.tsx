'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import SidebarRecentes from '@/components/SidebarRecentes'
import ModalCriarProjeto from '@/components/ModalCriarProjeto' 
import EquipeTopbar from '@/components/EquipeTopbar'
import { signOut } from 'next-auth/react'
import { Menu } from 'lucide-react'
import Link from 'next/link'

export default function AuthenticatedLayout({ children, usuario, equipeAtual, minhasEquipes, projetosIniciais }: any) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showModalProjeto, setShowModalProjeto] = useState(false)

  // Ignora o layout se for a tela de login
  if (pathname?.startsWith('/login')) {
      return <main className="min-h-screen bg-surface/50 flex flex-col justify-center">{children}</main>
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <ModalCriarProjeto isOpen={showModalProjeto} onClose={() => setShowModalProjeto(false)} equipeId={equipeAtual?.id}/>

      {/* CHAMADA DA TOPBAR PASSANDO O BOTÃO COMO PROP */}
      <EquipeTopbar 
        equipeAtual={equipeAtual} 
        minhasEquipes={minhasEquipes || []}
        botaoMenu={
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-surface-highlight/50 text-gray-400 hover:text-foreground transition-all">
            <Menu size={20} />
          </button>
        }
      />

      <div className="flex flex-1 overflow-hidden">
         {/* SIDEBAR */}
         <aside className={`${isSidebarOpen ? 'w-64' : 'w-[72px]'} bg-surface border-r border-border flex flex-col flex-shrink-0 transition-all duration-300 z-20`}>
            
            <div className="flex-1 flex flex-col overflow-hidden pt-4">
                {/* LINKS DE NAVEGAÇÃO */}
                <div className="p-2 space-y-1">
                  {/* O Início agora aponta para a raiz Global (/) */}
                  <SidebarLink href="/" icon="🏠" label="Início" isOpen={isSidebarOpen} active={pathname === '/'} />
                  
                  {/* O Resto aponta para a equipe selecionada */}
                  {equipeAtual?.id && (
                      <>
                          <SidebarLink href={`/equipe/${equipeAtual.id}/projetos`} icon="📂" label="Projetos" isOpen={isSidebarOpen} active={pathname.includes('/projetos')} />
                          <SidebarLink href={`/equipe/${equipeAtual.id}/minhas-tarefas`} icon="✅" label="Tarefas" isOpen={isSidebarOpen} active={pathname.includes('/minhas-tarefas')} />
                          <SidebarLink href={`/equipe/${equipeAtual.id}/sprint`} icon="🚀" label="Sprint" isOpen={isSidebarOpen} active={pathname.includes('/sprint')} />
                          <SidebarLink href={`/equipe/${equipeAtual.id}/dashboards`} icon="📊" label="Dashboards" isOpen={isSidebarOpen} active={pathname.includes('/dashboards')} />
                          <SidebarLink href={`/equipe/${equipeAtual.id}/portfolio`} icon="🎯" label="Portfólio" isOpen={isSidebarOpen} active={pathname.includes('/portfolio')} />
                      </>
                  )}
                </div>

                <div className={`border-t border-border my-2 ${!isSidebarOpen && 'border-transparent'}`}></div>

                {/* BOTÃO NOVO PROJETO E LISTA RECENTE */}
                <div className={`px-4 py-2 ${!isSidebarOpen && 'flex justify-center'}`}>
                    {isSidebarOpen ? (
                        <button onClick={() => setShowModalProjeto(true)} className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 hover:text-foreground hover:bg-surface-highlight rounded transition-colors uppercase">
                            <span>Projetos Recentes</span>
                            <span className="text-lg leading-none">+</span>
                        </button>
                    ) : (
                        <button onClick={() => setShowModalProjeto(true)} className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center shadow-md" title="Novo Projeto">+</button>
                    )}
                </div>

                <div className={`flex-1 overflow-y-auto custom-scrollbar-dark ${!isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <SidebarRecentes inicialProjetos={projetosIniciais || []} equipeId={equipeAtual?.id} />
                </div>
            </div>

            {/* RODAPÉ DA SIDEBAR */}
            <div className="mt-auto pt-2 border-t border-border pb-4 px-2 bg-surface">
                {usuario?.role === 'OWNER' && (
                    <div className="pb-1">
                        <SidebarLink href="/configuracoes" icon="⚙️" label="Configurações" isOpen={isSidebarOpen} active={pathname?.includes('/configuracoes')} />
                    </div>
                )}
                 <button onClick={() => signOut({ callbackUrl: '/login' })} className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 whitespace-nowrap transition-colors ${!isSidebarOpen && 'justify-center'}`} title="Sair">
                    <span className="text-lg">🚪</span>
                    <span className={`ml-3 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Sair</span>
                 </button>
            </div>
         </aside>

         {/* ÁREA DE CONTEÚDO (PÁGINAS) */}
         <main className="flex-1 overflow-y-auto h-full bg-background p-4 lg:p-6">
            {children}
         </main>
      </div>
    </div>
  )
}

// COMPONENTE AUXILIAR PARA OS BOTOES DO MENU
function SidebarLink({ href, icon, label, isOpen, active }: any) {
    return (
        <Link href={href} className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${!isOpen && 'justify-center'} ${active ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-gray-400 border border-transparent hover:bg-surface-highlight hover:text-foreground'}`} title={!isOpen ? label : ''}>
            <span className="text-lg">{icon}</span>
            <span className={`ml-3 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{label}</span>
        </Link>
    )
}