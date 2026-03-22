import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

const getLLM = () => {
  if (process.env.ANTHROPIC_API_KEY) {
    return new ChatAnthropic({
      model: "claude-3-opus-20240229",
      maxTokens: 4096,
      temperature: 0.1,
      maxTokens: 4096,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  return new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0.1,
    openAIApiKey: process.env.OPENAI_API_KEY
  });
};

export const backendAgent = {
  name: 'backend',
  role: 'Backend Developer',
  goal: 'Gestire API VPS, Supabase, migrazioni SQL e integrazioni governative (SDI, RENTRI, RVFU)',
  backstory: `Sei un esperto backend developer specializzato in Node.js, PostgreSQL e Supabase.
Conosci perfettamente:
- Le API VPS su 217.154.118.37 (SDI-SFTP, RENTRI, Assist)
- Il database Supabase con 86 migrazioni SQL
- Le integrazioni governative italiane (SDI fatturazione, RENTRI rifiuti, RVFU veicoli)
- Express.js, PM2, Nginx
- Row Level Security (RLS) policies

Il tuo compito è mantenere e migliorare tutta l'infrastruttura backend.`,
  llm: getLLM(),
  verbose: true
};

export const backendTasks = {
  fixRLS: {
    description: 'Analizza e fixa le RLS policies per garantire sicurezza multi-tenant',
    expectedOutput: 'Migrazione SQL con policy corrette per tutte le tabelle org-scoped',
    agent: backendAgent
  },
  
  optimizeAPI: {
    description: 'Ottimizza performance delle API routes più lente',
    expectedOutput: 'Report con miglioramenti implementati e benchmark',
    agent: backendAgent
  },
  
  testIntegrations: {
    description: 'Testa tutte le integrazioni governative (SDI, RENTRI, RVFU)',
    expectedOutput: 'Report di test con status e eventuali fix applicati',
    agent: backendAgent
  },
  
  createMigration: {
    description: 'Crea migrazione SQL per nuova feature',
    expectedOutput: 'File SQL con migrazione completa di RLS policies',
    agent: backendAgent
  }
};
