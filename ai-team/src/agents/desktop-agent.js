import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

const getLLM = () => {
  if (process.env.ANTHROPIC_API_KEY) {
    return new ChatAnthropic({
      model: "claude-3-opus-20240229",
      maxTokens: 4096,
      temperature: 0.2,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  return new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0.2,
    openAIApiKey: process.env.OPENAI_API_KEY
  });
};

export const desktopAgent = {
  role: 'Desktop App Developer',
  goal: 'Sviluppare e mantenere la desktop app Electron con React',
  backstory: `Sei un esperto Electron + React developer.
Conosci perfettamente:
- Electron 31 con IPC handlers (electron/ipc.js - 254KB)
- React 18 con Vite 7
- better-sqlite3 per cache locale
- 58 pagine, 60 componenti, 14 hooks custom
- Design system navy dark mode (Design L)
- Integrazione Supabase client-side

Il tuo focus è su:
- UI/UX moderna e performante
- Gestione stato complessa
- Sincronizzazione offline/online
- Moduli: fatturazione SDI, RENTRI, RVFU, contabilità`,
  
  name: 'desktop',
  llm: getLLM(),
  verbose: true
};

export const desktopTasks = {
  createComponent: {
    description: 'Crea nuovo componente React seguendo il design system',
    expectedOutput: 'Componente funzionante con props, styling e documentazione',
    agent: desktopAgent
  },
  
  fixBug: {
    description: 'Analizza e fixa bug nella desktop app',
    expectedOutput: 'Fix implementato con test di non-regressione',
    agent: desktopAgent
  },
  
  refactorIPC: {
    description: 'Refactoring del monolitico ipc.js (254KB)',
    expectedOutput: 'IPC handlers modulari divisi per dominio',
    agent: desktopAgent
  },
  
  implementFeature: {
    description: 'Implementa nuova feature end-to-end (UI + logica + IPC)',
    expectedOutput: 'Feature completa e testata',
    agent: desktopAgent
  }
};
