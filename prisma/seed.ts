import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// --- CONFIGURAÇÃO ---
const ASANA_PAT = process.env.ASANA_PAT;
const ASANA_PROJECT_ID = '1210948147293153'; // ID do Projeto "Mãe" no Asana

const asanaApi = axios.create({
  baseURL: 'https://app.asana.com/api/1.0',
  headers: { Authorization: `Bearer ${ASANA_PAT}` },
});

// Função para pegar um item aleatório de um array
function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

async function main() {
  if (!ASANA_PAT) {
    console.error('❌ ERRO: ASANA_PAT não está no arquivo .env');
    return;
  }

  console.log('🧹 Limpando dados antigos (Tarefas, Projetos e Comentários)...');

  // A ordem importa por causa das chaves estrangeiras (Foreign Keys)
  // 1. Apaga filhos (Comentários)
  await prisma.comentario.deleteMany({}); 
  
  // 2. Apaga tarefas
  await prisma.tarefa.deleteMany({});
  
  // 3. Apaga projetos
  await prisma.projeto.deleteMany({});

  console.log('✨ Banco limpo! (Usuários e Workspaces foram mantidos)');

  console.log('🚀 Iniciando Seed: Seções Asana -> Projetos DB...');

  try {
    // 1. BUSCAR CONTEXTO DO BANCO (Workspace e Usuários)
    
    // Pega o primeiro workspace que achar ou cria um se não existir
    let workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      console.log('⚠️ Nenhum workspace encontrado. Criando um padrão...');
      workspace = await prisma.workspace.create({
        data: { nome: 'Workspace Seed', id: 'workspace-seed-padrao' }
      });
    }

    // Busca todos os usuários existentes para o sorteio
    const usuariosExistentes = await prisma.usuario.findMany({
      where: { workspace_id: workspace.id }
    });

    if (usuariosExistentes.length === 0) {
      console.error('❌ ERRO: Nenhum usuário encontrado no banco para atribuir as tarefas.');
      console.log('💡 Dica: Crie pelo menos um usuário no banco antes de rodar esse seed.');
      return;
    }

    console.log(`👥 ${usuariosExistentes.length} usuários encontrados para distribuição de tarefas.`);

    // 2. BUSCAR SEÇÕES NO ASANA (que virarão PROJETOS)
    console.log(`📡 Buscando seções do projeto Asana ${ASANA_PROJECT_ID}...`);
    
    const sectionsResponse = await asanaApi.get(`/projects/${ASANA_PROJECT_ID}/sections`);
    const sections = sectionsResponse.data.data;

    console.log(`📂 ${sections.length} seções encontradas. Transformando em Projetos...`);

    for (const section of sections) {
      // Pula seções com nomes genéricos se quiser (opcional)
      if (section.name === 'Untitled Section') continue;

      console.log(`\n🔹 Processando Seção: "${section.name}"`);

      // 2.1 Criar o Projeto no Banco (Baseado na Seção)
      const novoProjeto = await prisma.projeto.create({
        data: {
          nome: section.name, // Nome da Seção vira Nome do Projeto
          descricao: `Importado da seção do Asana: ${section.name}`,
          workspace_id: workspace.id,
        }
      });

      // 3. BUSCAR TAREFAS DESSA SEÇÃO ESPECÍFICA
      // Ao buscar por section, garantimos que pegamos as tarefas certas
      const tasksResponse = await asanaApi.get(`/sections/${section.gid}/tasks`, {
        params: {
          opt_fields: 'name,notes,due_on,completed' 
        }
      });
      
      const tasks = tasksResponse.data.data;
      console.log(`   ↳ Encontradas ${tasks.length} tarefas. Salvando...`);

      if (tasks.length === 0) continue;

      // 4. SALVAR TAREFAS NO BANCO
      for (const t of tasks) {
        // Ignora tarefas sem nome (linhas vazias no Asana)
        if (!t.name || t.name.trim() === '') continue;

        // Sorteia um usuário responsável
        const responsavel = getRandomItem(usuariosExistentes);

        await prisma.tarefa.create({
          data: {
            titulo: t.name,
            descricao: t.notes || '',
            status: t.completed ? 'FEITO' : 'PENDENTE', // Mapeamento simples
            prioridade: 'MEDIA',
            dt_vencimento: t.due_on ? new Date(t.due_on) : null,
            dt_conclusao: t.completed ? new Date() : null,
            
            // Relacionamentos
            projeto_id: novoProjeto.id,
            usuario_id: responsavel.id,
          }
        });
      }
    }

    console.log('\n✅ Seed finalizado com sucesso!');

  } catch (error: any) {
    if (error.response) {
      console.error('❌ Erro na API do Asana:', error.response.status, error.response.data);
    } else {
      console.error('❌ Erro interno:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();