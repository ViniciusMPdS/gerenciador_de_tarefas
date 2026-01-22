'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getProjetosRecentesSidebar } from '@/app/actions'

export default function SidebarRecentes({ inicialProjetos }: { inicialProjetos: any[] }) {
  const [projetos, setProjetos] = useState(inicialProjetos)
  const pathname = usePathname() // Vigia a mudança de URL

  useEffect(() => {
    // Toda vez que a rota mudar, atualizamos a lista
    const fetchProjetos = async () => {
       const novos = await getProjetosRecentesSidebar()
       setProjetos(novos)
    }
    fetchProjetos()
  }, [pathname])

  return (
    <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar-dark mb-2 min-h-0">
      {projetos.map(proj => (
         <Link 
           key={proj.id}
           href={`/projeto/${proj.id}`} 
           className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${pathname === `/projeto/${proj.id}` ? 'bg-white/10 text-white font-medium' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
         >
           <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></span>
           <span className="truncate">{proj.nome}</span>
         </Link>
      ))}

      <Link 
           href="/projetos" 
           className="flex items-center gap-2 px-2 py-2 mt-2 rounded-md hover:bg-white/5 text-gray-500 hover:text-white text-xs transition-colors border-t border-white/5"
         >
           <span className="truncate">📂 Ver todos os projetos...</span>
      </Link>
    </div>
  )
}