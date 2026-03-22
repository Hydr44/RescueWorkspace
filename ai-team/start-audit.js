import { crew } from './src/crew.js';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🚀 Avvio Audit Completo - 5 Agenti in Parallelo\n'));

const tasks = [
  {
    agent: 'backend',
    task: 'auditCompleto',
    description: `Audit completo backend con focus su sicurezza, performance e bug.

1. RLS POLICIES - Verifica tutte le tabelle Supabase abbiano RLS corretto, testa isolamento multi-tenant
2. ANALISI BUG - Cerca errori comuni, controlla gestione errori API routes, verifica validazione input
3. OTTIMIZZAZIONE QUERY - Identifica query lente >500ms, aggiungi indici, ottimizza JOIN, implementa caching
4. INCONGRUENZE CODICE - Controlla naming inconsistente, import duplicati, codice morto, TypeScript errors

File da analizzare: supabase/migrations/*.sql, website/app/api/**/*.js, desktop-app/src/lib/*.js
NON toccare: rentri_*, sdi_*, rvfu_*

Output: Report dettagliato + lista fix applicati`
  },
  {
    agent: 'desktop',
    task: 'auditDesktopApp',
    description: `Audit completo desktop app con focus su stabilità e performance.

1. BUG FIXING - Cerca crash potenziali, verifica gestione errori IPC, controlla memory leak, fix warning React
2. TESTING COMPLETO - Testa ogni pagina, verifica form, navigazione, modali, offline/online behavior
3. OTTIMIZZAZIONE - Identifica componenti lenti, aggiungi useMemo/useCallback, ottimizza re-render, riduci bundle
4. REFACTORING IPC (se tempo) - electron/ipc.js 254KB → spezza in moduli

File: src/pages/**/*.jsx, src/components/**/*.jsx, electron/ipc.js, src/lib/*.js
NON toccare: src/lib/rentri.js, src/lib/sdi.js, src/lib/rvfu.js

Output: Report bug + fix applicati + benchmark performance`
  },
  {
    agent: 'web',
    task: 'auditWebsite',
    description: `Audit completo website Next.js + admin panel React (SEPARATO).

1. WEBSITE (rescuemanager.eu) - Lighthouse score, ottimizza immagini, caching, SEO, responsive
2. ADMIN PANEL (admin-panel/ RESTA SEPARATO) - Fix bug UI, test pagine, auth staff, bundle size, warning console
3. API ROUTES - Error handling, rate limiting, ottimizza query Supabase, test Postman
4. BUG FIXING - 404 errors, broken links, CORS, form validation

File: website/app/**/*.js, website/app/api/**/*.js, admin-panel/src/**/*.jsx

Output: Report fix + Lighthouse score prima/dopo`
  },
  {
    agent: 'mobile',
    task: 'auditMobileApp',
    description: `Audit completo RescueMobile con focus su crash e performance.

1. CRASH FIXING - Null checks, error boundaries, test iOS/Android, fix warning Expo, gestione errori network
2. TESTING COMPLETO - Testa screen, navigazione, form, liste, immagini
3. OTTIMIZZAZIONE - Bundle size, immagini, lazy loading, performance low-end, memoria
4. OFFLINE BEHAVIOR - Test senza connessione, messaggi errore, sync online

File: RescueMobile/app/**/*.js, RescueMobile/lib/*.js

Output: Report crash + fix + performance metrics`
  },
  {
    agent: 'qa',
    task: 'securityAudit',
    description: `Security audit completo di tutto il progetto.

1. DATABASE - Verifica RLS su TUTTE le tabelle, test SQL injection, password hashing, API keys non esposte
2. API ROUTES - Test auth bypass, CORS, rate limiting, input validation
3. DESKTOP APP - IPC security, localStorage sensitive data, XSS vulnerabilities
4. DEPENDENCIES - npm audit fix, aggiorna pacchetti vulnerabili, rimuovi inutilizzate

VPS disponibile: 217.154.118.37 (credenziali in .env)

Output: Report security + fix critici applicati`
  }
];

try {
  console.log(chalk.yellow('📋 Task da eseguire:\n'));
  tasks.forEach(t => {
    console.log(chalk.blue(`  • ${t.agent.toUpperCase()}: ${t.task}`));
  });
  
  console.log(chalk.yellow('\n⏱️  Tempo stimato: 10-15 minuti per agente\n'));
  console.log(chalk.gray('Dashboard: http://localhost:3333\n'));
  
  const results = await crew.runParallel(tasks);
  
  console.log(chalk.green('\n✅ Audit completati!\n'));
  
  // Mostra risultati
  results.forEach((result, index) => {
    const task = tasks[index];
    if (result.status === 'fulfilled') {
      console.log(chalk.green(`✅ ${task.agent}: SUCCESS`));
    } else {
      console.log(chalk.red(`❌ ${task.agent}: FAILED - ${result.reason?.message || 'Unknown error'}`));
    }
  });
  
  crew.printSummary();
  
} catch (error) {
  console.error(chalk.red('\n❌ Errore durante audit:'), error);
  process.exit(1);
}
