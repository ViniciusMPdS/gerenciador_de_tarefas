import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gerenciador de Projetos",
  description: "Workspace",
};

// Transformamos em ASYNC para buscar os projetos
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // Busca os projetos para exibir no menu lateral
  const projetos = await prisma.projeto.findMany({
    orderBy: { dt_insert: 'desc' }
  });

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} flex h-screen bg-[#F9F9F9] overflow-hidden`}>
        
        {/* SIDEBAR (Escura, Estilo Asana) */}
        <aside className="w-64 bg-[#2e2e2e] text-[#E0E0E0] flex-shrink-0 hidden md:flex flex-col border-r border-white/5">
          
          {/* Topo do Workspace */}
          <div className="h-16 flex items-center px-6 border-b border-white/10">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-rose-900/20">
              <span className="font-bold text-white text-sm">P</span>
            </div>
            <span className="font-semibold tracking-tight text-white">Meu Workspace</span>
          </div>

          <div className="flex-1 overflow-y-auto py-6">
            
            {/* SEÇÃO 1: NAVEGAÇÃO GERAL */}
            <nav className="px-4 space-y-1 mb-8">
              <Link href="/" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
                <span className="mr-3 text-gray-400 group-hover:text-white transition-colors">🏠</span>
                Página Inicial
              </Link>
              <Link href="/minhas-tarefas" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
                <span className="mr-3 text-gray-400 group-hover:text-white transition-colors">✅</span>
                Minhas Tarefas
              </Link>
              <Link href="/sprint" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
                <span className="mr-3 text-gray-400 group-hover:text-white transition-colors">🚀</span>
                Sprint Geral
              </Link>
              <Link href="/projetos" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
                <span className="mr-3 text-gray-400 group-hover:text-white transition-colors">📂</span>
                Todos os Projetos
              </Link>
            </nav>

            {/* SEÇÃO 2: PROJETOS (Estilo Asana) */}
            <div className="px-4">
              <div className="flex items-center justify-between px-3 mb-2 group cursor-pointer">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-gray-300 transition-colors">
                  Projetos
                </h3>
                {/* Link rápido para criar novo projeto */}
                <Link href="/projetos" className="text-gray-500 hover:text-white text-lg leading-none" title="Novo Projeto">
                  +
                </Link>
              </div>

              <div className="space-y-0.5">
                {projetos.length === 0 ? (
                   <p className="px-3 text-xs text-gray-600 italic mt-2">Nenhum projeto ainda.</p>
                ) : (
                  projetos.map(projeto => (
                    <Link 
                      key={projeto.id} 
                      href={`/projeto/${projeto.id}`}
                      className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors truncate"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 mr-3 opacity-70 group-hover:opacity-100"></span>
                      <span className="truncate">{projeto.nome}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Rodapé (Perfil) */}
          <div className="p-4 bg-[#252525] border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-[#2e2e2e]">
                AD
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">Admin</p>
                <p className="text-[11px] text-gray-500 truncate">admin@kanban.com</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ÁREA DE CONTEÚDO */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto focus:outline-none scroll-smooth">
            {children}
          </main>
        </div>

      </body>
    </html>
  );
}