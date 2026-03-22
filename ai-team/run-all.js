import { spawn } from 'child_process';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🚀 Avvio Dashboard + Audit Team\n'));

// Avvia dashboard
const dashboard = spawn('node', ['src/dashboard/server.js'], {
  cwd: process.cwd(),
  stdio: 'inherit'
});

// Aspetta 2 secondi per far partire la dashboard
setTimeout(() => {
  console.log(chalk.yellow('\n⏱️  Avvio audit tra 2 secondi...\n'));
  
  // Avvia audit
  const audit = spawn('node', ['start-audit.js'], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  audit.on('close', (code) => {
    console.log(chalk.green(`\n✅ Audit completato con codice ${code}\n`));
    dashboard.kill();
    process.exit(code);
  });
}, 2000);

dashboard.on('error', (err) => {
  console.error(chalk.red('Errore dashboard:'), err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n⚠️  Interruzione...\n'));
  dashboard.kill();
  process.exit(0);
});
