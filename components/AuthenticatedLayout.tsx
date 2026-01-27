'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import SidebarRecentes from '@/components/SidebarRecentes'
import ModalCriarProjeto from '@/components/ModalCriarProjeto' 
import { signOut } from 'next-auth/react'

interface Props {
  children: React.ReactNode
  usuario: any
  workspace: any
  projetosIniciais: any[]
}

export default function AuthenticatedLayout({ children, usuario, workspace, projetosIniciais }: Props) {
  const pathname = usePathname(); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showModalProjeto, setShowModalProjeto] = useState(false)
  
  // Verifica se estamos na página de login (inclui /login, /login/ etc)
  const isLoginPage = pathname?.startsWith('/login');

  // --- LÓGICA DE PROTEÇÃO VISUAL ---
  // Se for login, retornamos o layout LIMPO imediatamente
  if (isLoginPage) {
    return (
        <main className="min-h-screen bg-surface/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            {children}
        </main>
    );
  }

  // --- LAYOUT DO SISTEMA (DASHBOARD) ---
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      
      <ModalCriarProjeto isOpen={showModalProjeto} onClose={() => setShowModalProjeto(false)} />

      {/* SIDEBAR - Só renderiza se NÃO for login (redundante pelo if acima, mas seguro) */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20' 
        } bg-surface text-white flex flex-col flex-shrink-0 h-full transition-all duration-300 ease-in-out shadow-2xl z-20`}
      >
        {/* HEADER */}
        <div className="h-16 flex items-center px-0 border-b border-white/10 flex-shrink-0 relative">
            <div className={`flex items-center px-6 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                <div className="relative w-8 h-8 mr-3 flex-shrink-0"> 
                  {/* Se não tiver logo.png, removemos o componente Image temporariamente para não dar erro */}
                  <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center font-bold">OP</div>
                </div>
                <span className="font-semibold tracking-tight text-white truncate whitespace-nowrap">
                  {workspace?.nome || 'Empresa'}
                </span>
            </div>

            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`absolute p-2 rounded-md hover:bg-surface/10 text-gray-400 hover:text-white transition-all ${isSidebarOpen ? 'right-2' : 'left-1/2 -translate-x-1/2'}`}
            >
                {isSidebarOpen ? '«' : '»'}
            </button>
        </div>

        {/* NAVEGAÇÃO */}
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2 space-y-1">
              <SidebarLink href="/" icon="🏠" label="Início" isOpen={isSidebarOpen} active={pathname === '/'} />
              <SidebarLink href="/projetos" icon="📂" label="Projetos" isOpen={isSidebarOpen} active={pathname === '/projetos'} />
              <SidebarLink href="/minhas-tarefas" icon="✅" label="Tarefas" isOpen={isSidebarOpen} active={pathname === '/minhas-tarefas'} />
              <SidebarLink href="/sprint" icon="🚀" label="Sprint" isOpen={isSidebarOpen} active={pathname === '/sprint'} />
              <SidebarLink href="/configuracoes/colunas" icon="📊" label="Etapas" isOpen={isSidebarOpen} active={pathname?.startsWith('/configuracoes/colunas')} />
            </div>

            <div className={`border-t border-white/5 my-2 ${!isSidebarOpen && 'border-transparent'}`}></div>

            {/* BOTÃO NOVO PROJETO */}
            <div className={`px-4 py-2 ${!isSidebarOpen && 'flex justify-center'}`}>
                {isSidebarOpen ? (
                    <button onClick={() => setShowModalProjeto(true)} className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-400 hover:text-white hover:bg-surface/5 rounded transition-colors uppercase">
                        <span>Projetos Recentes</span>
                        <span className="text-lg leading-none">+</span>
                    </button>
                ) : (
                    <button onClick={() => setShowModalProjeto(true)} className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center shadow-lg" title="Novo Projeto">+</button>
                )}
            </div>

            <div className={`flex-1 overflow-y-auto custom-scrollbar-dark ${!isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <SidebarRecentes inicialProjetos={projetosIniciais} />
            </div>
        </div>

        {/* RODAPÉ */}
        
        <div className="mt-auto bg-surface pt-2 border-t border-white/5 flex-shrink-0">
              {/* --- NOVO: LINK DE USUÁRIOS (SÓ APARECE SE FOR OWNER) --- */}
              {usuario?.role === 'OWNER' && (
                  <SidebarLink 
                    href="/configuracoes/usuarios" 
                    icon="👥" 
                    label="Usuários" 
                    isOpen={isSidebarOpen} 
                    active={pathname === '/configuracoes/usuarios'} 
                  />
              )}
             <div className="px-2 pb-4 space-y-1">
                <button 
                    onClick={() => signOut({ callbackUrl: '/login' })} 
                    className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-red-500/20 transition-colors text-gray-300 hover:text-red-400 whitespace-nowrap ${!isSidebarOpen && 'justify-center'}`}
                >
                    <span className="text-lg">🚪</span>
                    <span className={`ml-3 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Sair</span>
                </button>
             </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-full flex flex-col bg-surface">
        <div className="flex-1 overflow-y-auto bg-background p-4 lg:p-6 xl:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

function SidebarLink({ href, icon, label, isOpen, active }: any) {
    return (
        <Link 
            href={href} 
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${!isOpen && 'justify-center'} ${active ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-surface/10 hover:text-white'}`} 
            title={!isOpen ? label : ''}
        >
            <span className="text-lg">{icon}</span>
            <span className={`ml-3 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{label}</span>
        </Link>
    )
}