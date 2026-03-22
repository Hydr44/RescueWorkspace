import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Esegue query SQL su Supabase tramite CLI
 */
export async function executeSupabaseQuery(query) {
  try {
    const { stdout, stderr } = await execAsync(
      `cd ${process.env.WORKSPACE_ROOT}/desktop-app/greeting-friend-api-main && npx supabase db query "${query.replace(/"/g, '\\"')}"`,
      { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
    );
    
    if (stderr && !stderr.includes('Connecting')) {
      return { success: false, error: stderr };
    }
    
    return { success: true, result: stdout };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Lista tutte le tabelle del database
 */
export async function listSupabaseTables() {
  const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  
  return await executeSupabaseQuery(query);
}

/**
 * Verifica RLS policies su una tabella
 */
export async function checkRLSPolicies(tableName) {
  const query = `
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies 
    WHERE tablename = '${tableName}';
  `;
  
  return await executeSupabaseQuery(query);
}

/**
 * Conta record in una tabella
 */
export async function countRecords(tableName, whereClause = '') {
  const query = `SELECT COUNT(*) FROM ${tableName} ${whereClause};`;
  return await executeSupabaseQuery(query);
}

/**
 * Test login simulato (verifica se user esiste)
 */
export async function testUserLogin(email) {
  const query = `
    SELECT id, email, created_at 
    FROM auth.users 
    WHERE email = '${email}' 
    LIMIT 1;
  `;
  
  return await executeSupabaseQuery(query);
}
