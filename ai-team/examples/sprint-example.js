import { crew } from '../src/crew.js';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🚀 RescueManager Sprint Example\n'));

// Esempio: Sprint di 1 settimana per implementare modulo preventivi

async function runSprint() {
  console.log(chalk.yellow('📅 GIORNO 1: Setup e planning\n'));
  
  // Backend: Crea schema database
  await crew.assignTask(
    'backend',
    'createMigration',
    'Crea migrazione SQL per tabella quote_presets con campi: id, org_id, name, description, items (JSONB), created_at, updated_at. Include RLS policies.'
  );
  
  // QA: Setup CI/CD
  await crew.assignTask(
    'qa',
    'setupCI',
    'Setup GitHub Actions workflow per test automatici su desktop app'
  );
  
  console.log(chalk.yellow('\n📅 GIORNO 2-3: Sviluppo parallelo\n'));
  
  // Tutti gli agenti lavorano in parallelo
  await crew.runParallel([
    {
      agent: 'backend',
      task: 'optimizeAPI',
      description: 'Crea API route Supabase per CRUD quote_presets'
    },
    {
      agent: 'desktop',
      task: 'implementFeature',
      description: 'Implementa UI preventivi: lista, form creazione, form modifica. Usa design system navy dark mode.'
    },
    {
      agent: 'web',
      task: 'createAPIRoute',
      description: 'Crea API route Next.js /api/quotes per gestione preventivi via website'
    },
    {
      agent: 'mobile',
      task: 'createScreen',
      description: 'Crea screen preventivi in RescueMobile per visualizzazione mobile'
    }
  ]);
  
  console.log(chalk.yellow('\n📅 GIORNO 4: Testing\n'));
  
  // QA testa tutto
  await crew.assignTask(
    'qa',
    'createTestSuite',
    'Crea test suite E2E per modulo preventivi: creazione, modifica, eliminazione, validazione'
  );
  
  // Security audit
  await crew.assignTask(
    'qa',
    'securityAudit',
    'Audit sicurezza RLS policies per quote_presets, verifica isolamento multi-tenant'
  );
  
  console.log(chalk.yellow('\n📅 GIORNO 5: Fix e polish\n'));
  
  // Fix eventuali bug trovati
  await crew.runParallel([
    {
      agent: 'desktop',
      task: 'fixBug',
      description: 'Fix validazione form preventivi e gestione errori'
    },
    {
      agent: 'backend',
      task: 'fixRLS',
      description: 'Fix eventuali issue RLS trovati dal security audit'
    },
    {
      agent: 'web',
      task: 'optimizeSEO',
      description: 'Aggiungi landing page /preventivi con SEO ottimizzato'
    }
  ]);
  
  // Validazione finale
  await crew.assignTask(
    'qa',
    'validateFix',
    'Validazione finale: tutti i test passano, no regressioni, performance OK'
  );
  
  console.log(chalk.green('\n✅ Sprint completato!\n'));
  crew.printSummary();
}

runSprint().catch(console.error);
