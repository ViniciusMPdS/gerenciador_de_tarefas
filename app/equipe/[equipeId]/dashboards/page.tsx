import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import DashboardUI from '@/components/DashboardUI'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ equipeId: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function DashboardsPage(props: Props) {
  const { equipeId } = await props.params
  const searchParams = await props.searchParams
  
  const session = await auth()
  if (!session?.user?.email) redirect('/login')
  
  const hoje = new Date()

  // --- 1. LÓGICA DE FILTROS ---
  const urlInicio = searchParams?.inicio
  const urlFim = searchParams?.fim
  const filtroProjetoId = searchParams?.projetoId
  const filtroUsuarioId = searchParams?.usuarioId

  let dataInicio: Date, dataFim: Date;

  if (urlInicio) {
      const [ano, mes, dia] = urlInicio.split('-').map(Number)
      dataInicio = new Date(ano, mes - 1, dia, 0, 0, 0)
  } else {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0)
  }

  if (urlFim) {
      const [ano, mes, dia] = urlFim.split('-').map(Number)
      dataFim = new Date(ano, mes - 1, dia, 23, 59, 59, 999)
  } else {
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999)
  }

  // --- 2. LISTAS PARA SELECT (Filtradas pela Equipe) ---
  const listaProjetos = await prisma.projeto.findMany({
      where: { equipe_id: equipeId, ativo: true },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true }
  })

  const listaUsuarios = await prisma.usuario.findMany({
      where: { 
          equipes: { some: { equipe_id: equipeId } },
          ativo: true 
      },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true }
  })

  // --- 3. TAREFAS (Filtradas pela Equipe) ---
  const whereClause: any = {
      projeto: { equipe_id: equipeId, ativo: true },
      OR: [
        { dt_vencimento: { gte: dataInicio, lte: dataFim } },
        { dt_conclusao: { gte: dataInicio, lte: dataFim } }
      ]
  }
  if (filtroProjetoId) whereClause.projeto_id = filtroProjetoId
  if (filtroUsuarioId) whereClause.usuario_id = filtroUsuarioId

  const tarefas = await prisma.tarefa.findMany({
    where: whereClause,
    include: { projeto: true, usuario: true, coluna: true }
  })

  // --- 4. HISTÓRICO (Filtrado pela Equipe) ---
  const historicoDeDatas = await prisma.historicoTarefa.findMany({
      where: {
          campo: 'DT_VENCIMENTO',
          tarefa: { 
              projeto: { equipe_id: equipeId },
              ...(filtroProjetoId ? { projeto_id: filtroProjetoId } : {}),
              ...(filtroUsuarioId ? { usuario_id: filtroUsuarioId } : {}) 
          }
      },
      include: { tarefa: { include: { projeto: true } } }
  })

  const historicoFiltrado = historicoDeDatas.filter(h => {
      if (!h.valor_antigo || h.valor_antigo === 'Sem data') return false;
      const partes = h.valor_antigo.split('/'); 
      if (partes.length !== 3) return false;
      const dataOriginal = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
      return dataOriginal >= dataInicio && dataOriginal <= dataFim;
  })

  // --- 5. PROCESSAMENTO DE DADOS (Mantido Intacto) ---
  const agora = new Date()

  const resumoGeral = {
      total: tarefas.length,
      concluidas: tarefas.filter(t => t.concluida).length,
      atrasadas: tarefas.filter(t => !t.concluida && t.dt_vencimento && new Date(t.dt_vencimento) < agora).length,
      pendentes: tarefas.filter(t => !t.concluida && t.dt_vencimento && new Date(t.dt_vencimento) > agora).length,
      taxaPendente: '0', taxaAtraso: '0', taxaConclusao: '0'
  }
  resumoGeral.taxaConclusao = resumoGeral.total > 0 ? ((resumoGeral.concluidas / resumoGeral.total) * 100).toFixed(0) : '0'
  resumoGeral.taxaAtraso = resumoGeral.total > 0 ? ((resumoGeral.atrasadas / resumoGeral.total) * 100).toFixed(0) : '0'
  resumoGeral.taxaPendente = resumoGeral.total > 0 ? ((resumoGeral.pendentes / resumoGeral.total) * 100).toFixed(0) : '0'

  const mapaProjetos = new Map()
  const mapaUsuarios = new Map()
  const mapaEtapas = new Map()

  tarefas.forEach(t => {
      let isConcluida = false, isAtrasada = false, isPendente = false 
      if (t.concluida) {
          isConcluida = true
      } else if (t.dt_vencimento && new Date(t.dt_vencimento) < agora) {
          isAtrasada = true
      } else {
          isPendente = true
      }

      const pNome = t.projeto.nome
      if (!mapaProjetos.has(pNome)) mapaProjetos.set(pNome, { nome: pNome, total: 0, concluidas: 0, pendentes: 0, atrasadas: 0 })
      const p = mapaProjetos.get(pNome)
      p.total++
      if (isConcluida) p.concluidas++; else if (isAtrasada) p.atrasadas++; else if (isPendente) p.pendentes++; 

      const uNome = t.usuario?.nome || 'Sem Dono'
      if (!mapaUsuarios.has(uNome)) mapaUsuarios.set(uNome, { nome: uNome, concluidas: 0, atrasadas: 0, total: 0 })
      const u = mapaUsuarios.get(uNome)
      u.total++ 
      if (isConcluida) u.concluidas++; else if (isAtrasada) u.atrasadas++; 

      if (!isConcluida) {
          const eNome = t.coluna?.nome || 'Não Classificado'
          if (!mapaEtapas.has(eNome)) mapaEtapas.set(eNome, { name: eNome, qtd: 0 })
          mapaEtapas.get(eNome).qtd++
      }
  })

  const mapaHistoricoProj = new Map()
  historicoFiltrado.forEach(h => {
      const pNome = h.tarefa.projeto.nome
      if (!mapaHistoricoProj.has(pNome)) mapaHistoricoProj.set(pNome, { projeto: pNome, qtd: 0 })
      mapaHistoricoProj.get(pNome).qtd++
  })

  return (
    <div className="p-8 h-full overflow-y-auto bg-background">
      <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboards da Equipe</h1>
      </header>
      
      <DashboardUI 
          dadosProjetos={Array.from(mapaProjetos.values())}
          dadosUsuarios={Array.from(mapaUsuarios.values())}
          dadosEtapas={Array.from(mapaEtapas.values())}
          dadosHistorico={Array.from(mapaHistoricoProj.values())}
          resumoGeral={resumoGeral}
          listaProjetos={listaProjetos}
          listaUsuarios={listaUsuarios}
      />
    </div>
  )
}