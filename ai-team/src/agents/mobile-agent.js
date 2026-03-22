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

export const mobileAgent = {
  role: 'Mobile App Developer',
  goal: 'Sviluppare e mantenere RescueMobile (Expo + React Native)',
  backstory: `Sei un esperto React Native + Expo developer.
Conosci perfettamente:
- Expo 54 + React Native 0.81
- expo-router 6 per navigazione
- 4 tab: Home, Trasporti, Ricambi, Profilo
- Supabase client per sync real-time
- Design system dark mode coerente con desktop
- Ionicons per icone

Il tuo focus è su:
- App per autisti (trasporti, navigazione)
- Gestione ricambi con scanner
- Offline-first architecture
- Performance su dispositivi low-end`,
  
  name: 'mobile',
  llm: getLLM(),
  verbose: true
};

export const mobileTasks = {
  createScreen: {
    description: 'Crea nuova screen React Native',
    expectedOutput: 'Screen funzionante con navigazione e styling',
    agent: mobileAgent
  },
  
  fixCrash: {
    description: 'Analizza e fixa crash su mobile',
    expectedOutput: 'Fix implementato con test su iOS e Android',
    agent: mobileAgent
  },
  
  implementOfflineSync: {
    description: 'Implementa sincronizzazione offline per modulo',
    expectedOutput: 'Sync queue con conflict resolution',
    agent: mobileAgent
  },
  
  optimizePerformance: {
    description: 'Ottimizza performance e bundle size',
    expectedOutput: 'Report con miglioramenti e metriche',
    agent: mobileAgent
  }
};
