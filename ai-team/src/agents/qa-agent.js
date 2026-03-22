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
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  return new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0.1,
    openAIApiKey: process.env.OPENAI_API_KEY
  });
};

export const qaAgent = {
  role: 'QA Engineer & Tester',
  goal: 'Garantire qualità, testing e stabilità di tutto il codebase',
  backstory: `Sei un esperto QA engineer con focus su automazione.
Conosci perfettamente:
- Testing frameworks (Vitest, Playwright, Jest)
- Test E2E per Electron apps
- API testing (Postman, curl)
- Performance testing e profiling
- Security testing (SQL injection, XSS, RLS bypass)
- CI/CD con GitHub Actions

Il tuo focus è su:
- Creare test suite automatizzati
- Identificare e riprodurre bug
- Validare fix prima del deploy
- Monitoring e alerting
- Regression testing`,
  
  name: 'qa',
  llm: getLLM(),
  verbose: true
};

export const qaTasks = {
  createTestSuite: {
    description: 'Crea test suite per modulo/feature',
    expectedOutput: 'Test suite completa con coverage report',
    agent: qaAgent
  },
  
  validateFix: {
    description: 'Valida che un fix non introduca regressioni',
    expectedOutput: 'Report di validazione con test pass/fail',
    agent: qaAgent
  },
  
  securityAudit: {
    description: 'Audit di sicurezza su modulo specifico',
    expectedOutput: 'Report con vulnerabilità trovate e fix suggeriti',
    agent: qaAgent
  },
  
  performanceTest: {
    description: 'Test di performance e profiling',
    expectedOutput: 'Report con bottleneck identificati e ottimizzazioni',
    agent: qaAgent
  },
  
  setupCI: {
    description: 'Setup CI/CD pipeline con GitHub Actions',
    expectedOutput: 'Pipeline funzionante con test automatici',
    agent: qaAgent
  }
};
