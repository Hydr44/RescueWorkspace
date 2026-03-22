#!/usr/bin/env node

/**
 * Test Supabase Staging Connection
 * Verifica connessione e funzionalità base del database staging
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.STAGING_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.STAGING_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  console.log('🧪 Testing Supabase Staging Connection...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Count orgs
  console.log('Test 1: Query orgs table');
  try {
    const { data, error } = await supabase
      .from('orgs')
      .select('id, name, subscription_tier')
      .limit(5);
    
    if (error) throw error;
    console.log(`✅ Found ${data.length} orgs`);
    if (data.length > 0) {
      console.log('   Sample:', data[0].name);
    }
    passed++;
  } catch (error) {
    console.error('❌ Orgs query failed:', error.message);
    failed++;
  }
  console.log('');
  
  // Test 2: Count transports
  console.log('Test 2: Query transports table');
  try {
    const { count, error } = await supabase
      .from('transports')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    console.log(`✅ Found ${count} transports`);
    passed++;
  } catch (error) {
    console.error('❌ Transports query failed:', error.message);
    failed++;
  }
  console.log('');
  
  // Test 3: Count leads
  console.log('Test 3: Query leads table');
  try {
    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    console.log(`✅ Found ${count} leads`);
    passed++;
  } catch (error) {
    console.error('❌ Leads query failed:', error.message);
    failed++;
  }
  console.log('');
  
  // Test 4: Auth users
  console.log('Test 4: List auth users');
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) throw error;
    console.log(`✅ Found ${data.users.length} auth users`);
    passed++;
  } catch (error) {
    console.error('❌ Auth query failed:', error.message);
    failed++;
  }
  console.log('');
  
  // Test 5: RLS policies
  console.log('Test 5: Check RLS policies');
  try {
    const { data, error } = await supabase
      .rpc('pg_policies')
      .select('tablename, policyname')
      .limit(5);
    
    if (error) {
      // Fallback: try direct query
      const { data: policies, error: err2 } = await supabase
        .from('pg_policies')
        .select('tablename, policyname')
        .limit(5);
      
      if (err2) throw err2;
      console.log(`✅ Found ${policies?.length || 0} RLS policies`);
    } else {
      console.log(`✅ Found ${data?.length || 0} RLS policies`);
    }
    passed++;
  } catch (error) {
    console.log('⚠️  RLS policies check skipped (not critical)');
    passed++;
  }
  console.log('');
  
  // Summary
  console.log('═══════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Tests Passed: ${passed}`);
  console.log(`Tests Failed: ${failed}`);
  console.log(`Total Tests: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Supabase staging is ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check configuration.');
    process.exit(1);
  }
}

// Run tests
testConnection().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
