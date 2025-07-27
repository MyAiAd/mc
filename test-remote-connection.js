#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

console.log('🔍 Remote Supabase Connection Test');
console.log('==================================');

// Update these with your EXISTING remote database credentials
const EXISTING_SUPABASE_URL = 'https://your-existing-project-id.supabase.co';
const EXISTING_SERVICE_ROLE_KEY = 'your-existing-service-role-key';

console.log('⚠️  IMPORTANT: Update the credentials above with your existing Supabase project details');
console.log('');

// Create Supabase client
const supabase = createClient(EXISTING_SUPABASE_URL, EXISTING_SERVICE_ROLE_KEY);

async function testConnection() {
  console.log('🧪 Testing connection to existing remote database...');
  
  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    if (tablesError) {
      console.error('❌ Connection failed:', tablesError.message);
      return false;
    }
    
    console.log(`✅ Connected successfully! Found ${tables.length} tables`);
    
    // Test 2: List some tables
    console.log('\n2. Sample tables found:');
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });
    
    // Test 3: Check for key tables
    console.log('\n3. Checking for key affiliate tables...');
    const keyTables = ['affiliates', 'users', 'campaigns', 'orders', 'commission_plans'];
    
    for (const tableName of keyTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ❌ ${tableName}: Not found or no access`);
        } else {
          console.log(`   ✅ ${tableName}: Found (${count} rows)`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: Error checking table`);
      }
    }
    
    // Test 4: Check users
    console.log('\n4. Checking user authentication...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Cannot access user list (may need service role key)');
    } else {
      console.log(`✅ User authentication working - Found ${users.users.length} users`);
      console.log('   Sample users:');
      users.users.slice(0, 3).forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }
    
    console.log('\n🎉 CONNECTION TEST SUCCESSFUL!');
    console.log('✅ Your existing remote database is accessible');
    console.log('✅ Ready to proceed with export');
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your EXISTING_SUPABASE_URL is correct');
    console.log('2. Verify your EXISTING_SERVICE_ROLE_KEY is valid');
    console.log('3. Ensure your existing project is active');
    console.log('4. Check if you have the correct permissions');
    
    return false;
  }
}

// Check if credentials are still placeholders
if (EXISTING_SUPABASE_URL.includes('your-existing') || EXISTING_SERVICE_ROLE_KEY.includes('your-existing')) {
  console.log('⚠️  Please update the credentials at the top of this file with your existing Supabase project details:');
  console.log('1. EXISTING_SUPABASE_URL');
  console.log('2. EXISTING_SERVICE_ROLE_KEY');
  console.log('\nThen run this script again to test the connection.');
} else {
  testConnection();
} 