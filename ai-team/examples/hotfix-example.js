import { crew } from '../src/crew.js';
import chalk from 'chalk';

console.log(chalk.bold.red('\n🚨 HOTFIX: RLS Security Issue\n'));

async function runHotfix() {
  // Scenario: Trovata vulnerabilità RLS che permette accesso cross-org
  
  console.log(chalk.yellow('Step 1: Security audit immediato\n'));
  
  await crew.assignTask(
    'qa',
    'securityAudit',
    'Audit completo RLS policies: identifica tutte le tabelle con potenziali leak cross-org'
  );
  
  console.log(chalk.yellow('\nStep 2: Fix in parallelo\n'));
  
  // Backend fixa le policy, Desktop aggiorna query se necessario
  await crew.runParallel([
    {
      agent: 'backend',
      task: 'fixRLS',
      description: 'Fix RLS policies per invoices, transports, spare_parts. Aggiungi test per verificare isolamento.'
    },
    {
      agent: 'desktop',
      task: 'fixBug',
      description: 'Verifica che tutte le query desktop app usino org_id correttamente'
    }
  ]);
  
  console.log(chalk.yellow('\nStep 3: Validazione\n'));
  
  await crew.assignTask(
    'qa',
    'validateFix',
    'Test di penetrazione: prova ad accedere a dati di altre org, verifica che tutte le query siano protette'
  );
  
  console.log(chalk.green('\n✅ Hotfix validato e pronto per deploy\n'));
  crew.printSummary();
}

runHotfix().catch(console.error);
