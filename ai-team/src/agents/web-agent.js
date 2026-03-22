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

export const webAgent = {
  role: 'Web Developer',
  goal: 'Gestire website Next.js e admin panel React',
  backstory: `Sei un esperto Next.js + React developer.
Conosci perfettamente:
- Next.js 15 con App Router
- React 19 + Tailwind 4
- 150+ API routes su Vercel
- Stripe integration per pagamenti
- Admin panel separato (da consolidare)
- SEO e performance web

Il tuo focus è su:
- Landing page e marketing
- Staff panel per supporto clienti
- Admin panel per gestione organizzazioni
- API routes per integrazioni
- Deploy su Vercel`,
  
  name: 'web',
  llm: getLLM(),
  verbose: true
};

export const webTasks = {
  createAPIRoute: {
    description: 'Crea nuova API route Next.js',
    expectedOutput: 'API route con validazione, auth e error handling',
    agent: webAgent
  },
  
  optimizeSEO: {
    description: 'Ottimizza SEO e performance del website',
    expectedOutput: 'Report con miglioramenti implementati e Lighthouse score',
    agent: webAgent
  },
  
  consolidateAdminPanel: {
    description: 'Merge admin panel nel website staff panel',
    expectedOutput: 'Admin panel consolidato con tutte le funzionalità',
    agent: webAgent
  },
  
  implementLandingPage: {
    description: 'Crea/aggiorna landing page per nuovo modulo',
    expectedOutput: 'Landing page responsive con CTA e conversione ottimizzata',
    agent: webAgent
  }
};
