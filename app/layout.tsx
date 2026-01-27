import type { Metadata, Viewport} from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { prisma } from '@/lib/prisma';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { auth } from '@/auth'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gerenciador de Projetos",
  description: "Sistema de Gestão",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale: 1, // Opcional: Impede o usuário de dar zoom manual (deixa com cara de app nativo)
  // userScalable: false, // Opcional: Junto com o de cima, trava o zoom
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // Busca o workspace (se não tiver, retorna null sem erro)
  const workspace = await prisma.workspace.findFirst();
  
  // 1. Pega a sessão
  const session = await auth()
  
  // 2. CORREÇÃO: Inicializa usuário como null
  let usuario = null

  // 3. Só busca no banco se TIVER um e-mail na sessão
  if (session?.user?.email) {
      usuario = await prisma.usuario.findUnique({ 
          where: { email: session.user.email } 
      })
  }
  
  // Se não existir dados, não quebra a tela, passamos array vazio
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