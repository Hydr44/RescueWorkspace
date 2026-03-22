import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  readFile,
  writeFile,
  editFile,
  listFiles,
  runCommand,
  searchInFiles
} from './file-tools.js';
import {
  executeSupabaseQuery,
  listSupabaseTables,
  checkRLSPolicies,
  countRecords,
  testUserLogin
} from './supabase-tools.js';

export function createAgentTools() {
  return [
    new DynamicStructuredTool({
      name: 'read_file',
      description: 'Leggi il contenuto di un file. Usa path assoluto.',
      schema: z.object({
        filePath: z.string().describe('Path assoluto del file da leggere')
      }),
      func: async ({ filePath }) => {
        const result = await fileTools.readFile(filePath);
        return JSON.stringify(result);
      }
    }),

    new DynamicStructuredTool({
      name: 'write_file',
      description: 'Scrivi contenuto in un file. Crea il file se non esiste. NON usare per file RENTRI/SDI/RVFU.',
      schema: z.object({
        filePath: z.string().describe('Path assoluto del file'),
        content: z.string().describe('Contenuto da scrivere')
      }),
      func: async ({ filePath, content }) => {
        const result = await fileTools.writeFile(filePath, content);
        return JSON.stringify(result);
      }
    }),

    new DynamicStructuredTool({
      name: 'edit_file',
      description: 'Modifica un file sostituendo una stringa con un\'altra. NON usare per file RENTRI/SDI/RVFU.',
      schema: z.object({
        filePath: z.string().describe('Path assoluto del file'),
        oldString: z.string().describe('Stringa da sostituire (deve essere esatta)'),
        newString: z.string().describe('Nuova stringa')
      }),
      func: async ({ filePath, oldString, newString }) => {
        const result = await fileTools.editFile(filePath, oldString, newString);
        return JSON.stringify(result);
      }
    }),

    new DynamicStructuredTool({
      name: 'list_files',
      description: 'Lista file e directory in una cartella',
      schema: z.object({
        directory: z.string().describe('Path assoluto della directory')
      }),
      func: async ({ directory }) => {
        const result = await fileTools.listFiles(directory);
        return JSON.stringify(result);
      }
    }),

    new DynamicStructuredTool({
      name: 'run_command',
      description: 'Esegui comando shell. Usa per npm install, git, test, build, etc. NON usare comandi pericolosi.',
      schema: z.object({
        command: z.string().describe('Comando da eseguire'),
        cwd: z.string().describe('Directory di lavoro (path assoluto)')
      }),
      func: async ({ command, cwd }) => {
        const result = await fileTools.runCommand(command, cwd);
        return JSON.stringify(result);
      }
    }),

    new DynamicStructuredTool({
      name: 'search_in_files',
      description: 'Cerca una stringa nei file di una directory (grep)',
      schema: z.object({
        directory: z.string().describe('Directory dove cercare'),
        searchTerm: z.string().describe('Termine da cercare')
      }),
      func: async ({ directory, searchTerm }) => {
        const result = await searchInFiles(directory, searchTerm);
        return result.success ? result.output : `Error: ${result.error}`;
      }
    }),

    new DynamicStructuredTool({
      name: 'supabase_query',
      description: 'Esegui query SQL su Supabase. Usa per verificare dati, RLS, contare record, etc.',
      schema: z.object({
        query: z.string().describe('Query SQL da eseguire')
      }),
      func: async ({ query }) => {
        const result = await executeSupabaseQuery(query);
        return result.success ? result.result : `Error: ${result.error}`;
      }
    }),

    new DynamicStructuredTool({
      name: 'list_db_tables',
      description: 'Lista tutte le tabelle del database Supabase',
      schema: z.object({}),
      func: async () => {
        const result = await listSupabaseTables();
        return result.success ? result.result : `Error: ${result.error}`;
      }
    }),

    new DynamicStructuredTool({
      name: 'check_rls_policies',
      description: 'Verifica le RLS policies di una tabella specifica',
      schema: z.object({
        tableName: z.string().describe('Nome della tabella da verificare')
      }),
      func: async ({ tableName }) => {
        const result = await checkRLSPolicies(tableName);
        return result.success ? result.result : `Error: ${result.error}`;
      }
    }),

    new DynamicStructuredTool({
      name: 'test_user_login',
      description: 'Testa se un utente esiste nel database (simula login)',
      schema: z.object({
        email: z.string().describe('Email dell\'utente da testare')
      }),
      func: async ({ email }) => {
        const result = await testUserLogin(email);
        return result.success ? result.result : `Error: ${result.error}`;
      }
    })
  ];
}
