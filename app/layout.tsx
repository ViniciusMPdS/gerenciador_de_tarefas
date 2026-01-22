import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import Image from 'next/image'; // <--- Importante para o seu logo funcionar
import { prisma } from '@/lib/prisma';

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
  
  // 1. Busca dados para o Menu Lateral
  const workspace = await prisma.workspace.findFirst(); // <--- Necessário para o nome no topo
  const usuario = await prisma.usuario.findFirst();
  
  const projetosRecentesSidebar = await prisma.projeto.findMany({
    orderBy: { dt_update: 'desc' },
    take: 10
  });

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#F9F9F9] text-gray-900`}>
        <div className="flex h-screen overflow-hidden">
          
          {/* MENU LATERAL FIXO */}
          <aside className="w-64 bg-[#1E1E1E] text-white flex flex-col flex-shrink-0 h-full">
            
            {/* --- SEU CÓDIGO DE LOGO RESTAURADO --- */}
            {/* TOPO: LOGO + NOME DO WORKSPACE */}
            <div className="h-16 flex items-center px-6 border-b border-white/10 flex-shrink-0">
                {/* Container da Logo */}
                <div className="relative w-8 h-8 mr-3"> 
                  {/* Certifique-se que existe um arquivo logo.png na pasta public */}
                  <Image 
                    src="/logo.png" 
                    alt="Logo" 
                    fill 
                    className="object-contain" 
                  />
                </div>
                
                {/* Nome do Workspace */}
                <span className="font-semibold tracking-tight text-white truncate">
                  {workspace?.nome || 'Minha Empresa'}
                </span>
            </div>

            {/* LINKS PRINCIPAIS (Fixo no topo) */}
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

            {/* CABEÇALHO DE PROJETOS */}
            <div className="px-6 pb-2 pt-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                <span>Recentes</span>
                <Link href="/projetos" className="text-[10px] hover:text-white transition-colors" title="Ver todos">Ver todos</Link>
              </div>
            </div>

            {/* LISTA ROLÁVEL (Ocupa o meio da tela) */}
            <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar-dark mb-2 min-h-0">
              {projetosRecentesSidebar.map(proj => (
                 <Link 
                   key={proj.id}
                   href={`/projeto/${proj.id}`} 
                   className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white text-sm transition-colors"
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

            {/* ÁREA INFERIOR FIXA (Configurações + Perfil) */}
            {/* mt-auto garante que fique no fundo, flex-shrink-0 impede que seja esmagado */}
            <div className="mt-auto bg-[#1E1E1E] pt-2 border-t border-white/5 flex-shrink-0">
                
                {/* Links de Configuração */}
                <div className="px-4 pb-4 space-y-1">
                  <Link 
                    href="/configuracoes/colunas" 
                    className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors text-gray-300 hover:text-white bg-white/5"
                  >
                    <span className="mr-3 text-gray-400 group-hover:text-white transition-colors">📊</span>
                    Gerenciar Colunas
                  </Link>
                  
                  <Link 
                    href="/configuracoes" 
                    className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
                  >
                    <span className="mr-3 text-gray-400 group-hover:text-white transition-colors">⚙️</span>
                    Configurações
                  </Link>
                </div>

                {/* Perfil do Usuário */}
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

          {/* CONTEÚDO PRINCIPAL */}
          <main className="flex-1 overflow-y-auto h-full bg-[#F9F9F9]">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}