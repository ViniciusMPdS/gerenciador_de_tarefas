import Link from 'next/link'
import { Users, Kanban, ChevronRight, Settings2, ShieldAlert } from 'lucide-react'

export default function ConfiguracoesHubPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      
      <header className="mb-10 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-gray-500 mt-2">Central de controle e preferências do Workspace.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* --- CARD 1: ETAPAS (Leva para o seu arquivo colunas/page.tsx) --- */}
        <Link 
            href="/configuracoes/colunas" 
            className="group relative flex flex-col justify-between h-full bg-surface border border-border rounded-xl p-6 hover:border-rose-500/50 hover:shadow-lg transition-all duration-300"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-rose-500/10 rounded-lg text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <Kanban size={28} />
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold text-foreground group-hover:text-rose-500 transition-colors">Etapas do Kanban</h3>
            <p className="text-sm text-gray-500 mt-2">
              Gerencie as colunas do fluxo de trabalho. Crie, renomeie ou exclua etapas.
            </p>
          </div>
        </Link>

        {/* --- CARD 2: USUÁRIOS (Leva para o seu arquivo usuarios/page.tsx) --- */}
        <Link 
            href="/configuracoes/usuarios" 
            className="group relative flex flex-col justify-between h-full bg-surface border border-border rounded-xl p-6 hover:border-indigo-500/50 hover:shadow-lg transition-all duration-300"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <Users size={28} />
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold text-foreground group-hover:text-indigo-500 transition-colors">Gestão de Usuários</h3>
            <p className="text-sm text-gray-500 mt-2">
              Controle de acesso. Visualize membros, ative ou inative contas da equipe.
            </p>
          </div>
        </Link>

        {/* --- CARD 3: EM BREVE (Visual para preencher espaço) --- */}
        <div className="group relative flex flex-col justify-between h-full bg-surface/40 border border-border/50 border-dashed rounded-xl p-6 cursor-not-allowed opacity-60">
          <div>
             <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-500/10 rounded-lg text-gray-400">
                <ShieldAlert size={28} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-400">Segurança & Logs</h3>
            <p className="text-sm text-gray-500 mt-2">
              Histórico de auditoria e configurações de segurança avançada. (Em desenvolvimento)
            </p>
          </div>
          <div className="mt-4">
             <span className="text-[10px] font-bold uppercase bg-gray-200 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded">Em Breve</span>
          </div>
        </div>

      </div>
    </div>
  )
}