import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Moduli protetti - richiedono approvazione manuale
const PROTECTED_PATHS = [
  'moduli/RENTRI-project',
  'moduli/SDI-SFTP',
  'moduli/demolizioni',
  'desktop-app/greeting-friend-api-main/src/lib/rentri',
  'desktop-app/greeting-friend-api-main/src/lib/sdi',
  'desktop-app/greeting-friend-api-main/src/lib/rvfu',
  'desktop-app/greeting-friend-api-main/src/pages/Rifiuti',
  'desktop-app/greeting-friend-api-main/src/pages/Invoice',
  'website/app/api/rentri',
  'website/app/api/sdi',
  '/opt/rentri-api',
  '/opt/sdi-sftp-server'
];

function isProtectedPath(filePath) {
  return PROTECTED_PATHS.some(protectedPath => filePath.includes(protectedPath));
}

export async function readFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function writeFile(filePath, content, requiresApproval = false) {
  if (isProtectedPath(filePath)) {
    return {
      success: false,
      requiresApproval: true,
      message: `⚠️ File protetto: ${filePath}. Richiede approvazione manuale per modifiche a RENTRI/SDI/RVFU.`
    };
  }

  if (requiresApproval) {
    return {
      success: false,
      requiresApproval: true,
      message: `Modifica richiede approvazione: ${filePath}`
    };
  }

  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true, message: `File scritto: ${filePath}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function editFile(filePath, oldString, newString) {
  if (isProtectedPath(filePath)) {
    return {
      success: false,
      requiresApproval: true,
      message: `⚠️ File protetto: ${filePath}. Richiede approvazione manuale.`
    };
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    if (!content.includes(oldString)) {
      return {
        success: false,
        error: `String non trovata nel file: ${oldString.substring(0, 100)}...`
      };
    }

    const newContent = content.replace(oldString, newString);
    await fs.writeFile(filePath, newContent, 'utf-8');
    
    return {
      success: true,
      message: `File modificato: ${filePath}`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function listFiles(directory, pattern = '*') {
  try {
    const files = await fs.readdir(directory, { withFileTypes: true });
    const result = files.map(f => ({
      name: f.name,
      type: f.isDirectory() ? 'dir' : 'file',
      path: path.join(directory, f.name)
    }));
    return { success: true, files: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function runCommand(command, cwd) {
  // Comandi pericolosi bloccati
  const dangerousCommands = ['rm -rf', 'sudo', 'chmod 777', 'dd if=', 'mkfs', ':(){:|:&};:'];
  
  if (dangerousCommands.some(cmd => command.includes(cmd))) {
    return {
      success: false,
      error: `Comando bloccato per sicurezza: ${command}`
    };
  }

  try {
    const { stdout, stderr } = await execAsync(command, { 
      cwd,
      timeout: 30000 // 30 secondi max
    });
    
    return {
      success: true,
      stdout,
      stderr,
      message: `Comando eseguito: ${command}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
}

export async function searchInFiles(directory, searchTerm) {
  try {
    const { stdout } = await execAsync(
      `grep -r "${searchTerm}" ${directory} --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" -n`,
      { timeout: 10000 }
    );
    
    return { success: true, results: stdout };
  } catch (error) {
    // grep ritorna exit code 1 se non trova nulla
    if (error.code === 1) {
      return { success: true, results: '' };
    }
    return { success: false, error: error.message };
  }
}
