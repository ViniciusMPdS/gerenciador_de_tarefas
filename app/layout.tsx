import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import SidebarRecentes from '@/components/SidebarRecentes'; // <--- Importe o componente

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gerenciador de Projetos",
  description: "Sistema estilo Asana",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const workspace = await prisma.workspace.findFirst();
  const usuario = await prisma.usuario.findFirst();
  
  // Busca inicial para o componente não começar vazio
  const projetosIniciais = await prisma.projeto.findMany({
    orderBy: { dt_acesso: 'desc' },
    take: 10
  });

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#F9F9F9] text-gray-900`}>
        <div className="flex h-screen overflow-hidden">
          
          <aside className="w-64 bg-[#1E1E1E] text-white flex flex-col flex-shrink-0 h-full">
            
            {/* LOGO */}
            <div className="h-16 flex items-center px-6 border-b border-white/10 flex-shrink-0">
                <div className="relative w-8 h-8 mr-3"> 
                  <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="font-semibold tracking-tight text-white truncate">
                  {workspace?.nome || 'Minha Empresa'}
                </span>
            </div>

            {/* LINKS PRINCIPAIS */}
            <div className="p-4 pb-2">
              <nav className="space-y-1">
                <Link href="/" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
                  <span className="mr-3 text-gray-400 group-hover:text-white transition-colors">🏠</span>
                  Página Inicial
                </Link>
                <Link href="/minhas-tarefas" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
                  <span className="mr-3 text-green-400 group-hover:text-white transition-colors">✅</span>
                  Minhas Tarefas
                </Link>
                <Link href="/sprint" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
                  <span className="mr-3 text-red-400 group-hover:text-white transition-colors">🚀</span>
                  Sprint Geral
                </Link>
              </nav>
            </div>

            {/* RECENTES HEADER */}
            <div className="px-6 pb-2 pt-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                <span>Recentes</span>
                <Link href="/projetos" className="text-[10px] hover:text-white transition-colors" title="Ver todos">Ver todos</Link>
              </div>
            </div>

            {/* COMPONENTE DINÂMICO (Substitui a lista estática) */}
            <SidebarRecentes inicialProjetos={projetosIniciais} />

            {/* RODAPÉ */}
            <div className="mt-auto bg-[#1E1E1E] pt-2 border-t border-white/5 flex-shrink-0">
                <div className="px-4 pb-4 space-y-1">
                  <Link href="/configuracoes/colunas" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors text-gray-300 hover:text-white bg-white/5">
                    <span className="mr-3 text-gray-400 group-hover:text-white transition-colors">📊</span>
                    Gerenciar Colunas
                  </Link>
                  <Link href="/configuracoes" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
                    <span className="mr-3 text-gray-400 group-hover:text-white transition-colors">⚙️</span>
                    Configurações
                  </Link>
                </div>

                <div className="p-4 bg-[#252525] border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                      {usuario ? usuario.nome.substring(0,2).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{usuario ? usuario.nome : 'Usuário'}</p>
                      <p className="text-xs text-gray-500 truncate">{usuario ? usuario.email : 'user@email.com'}</p>
                    </div>
                  </div>
                </div>
            </div>

          </aside>

          <main className="flex-1 overflow-y-auto h-full bg-[#F9F9F9]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}