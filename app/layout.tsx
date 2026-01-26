import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { prisma } from '@/lib/prisma';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gerenciador de Projetos",
  description: "Sistema de Gestão",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const workspace = await prisma.workspace.findFirst();
  const usuario = await prisma.usuario.findFirst();
  
  // Se não existir dados, não quebra a tela, passamos null/array vazio
  const projetosIniciais = await prisma.projeto.findMany({
    orderBy: { dt_acesso: 'desc' },
    take: 10
  }).catch(() => []);

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-background text-foreground`}>
        {/* O AuthenticatedLayout cuida de mostrar ou esconder o menu */}
        <AuthenticatedLayout 
           usuario={usuario} 
           workspace={workspace} 
           projetosIniciais={projetosIniciais}
        >
            {children}
        </AuthenticatedLayout>
      </body>
    </html>
  );
}