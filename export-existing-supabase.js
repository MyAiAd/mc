#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔄 Supabase Database Export Tool');
console.log('================================');

// You'll need to replace these with your EXISTING database credentials
const EXISTING_SUPABASE_URL = 'https://your-existing-project-id.supabase.co';
const EXISTING_SERVICE_ROLE_KEY = 'your-existing-service-role-key';
const EXISTING_DB_PASSWORD = 'your-existing-db-password';
const EXISTING_PROJECT_ID = 'your-existing-project-id';

console.log('⚠️  IMPORTANT: Update the credentials above with your existing Supabase project details');
console.log('');

// Create Supabase client for existing database
const supabase = createClient(EXISTING_SUPABASE_URL, EXISTING_SERVICE_ROLE_KEY);

async function exportSchema() {
  console.log('📋 Step 1: Exporting Database Schema');
  console.log('====================================');
  
  const schemaCommand = `pg_dump "postgresql://postgres:${EXISTING_DB_PASSWORD}@db.${EXISTING_PROJECT_ID}.supabase.co:5432/postgres" --schema-only --no-owner --no-privileges > mc_schema_export.sql`;
  
  try {
    console.log('Exporting schema...');
    execSync(schemaCommand, { stdio: 'inherit' });
    console.log('✅ Schema exported to: mc_schema_export.sql');
  } catch (error) {
    console.error('❌ Schema export failed:', error.message);
    return false;
  }
  
  return true;
}

async function exportData() {
  console.log('\n💾 Step 2: Exporting Database Data');
  console.log('==================================');
  
  const dataCommand = `pg_dump "postgresql://postgres:${EXISTING_DB_PASSWORD}@db.${EXISTING_PROJECT_ID}.supabase.co:5432/postgres" --data-only --no-owner --no-privileges --exclude-table-data=auth.* --exclude-table-data=storage.* > mc_data_export.sql`;
  
  try {
    console.log('Exporting data (excluding auth/storage tables)...');
    execSync(dataCommand, { stdio: 'inherit' });
    console.log('✅ Data exported to: mc_data_export.sql');
  } catch (error) {
    console.error('❌ Data export failed:', error.message);
    return false;
  }
  
  return true;
}

async function exportRLSPolicies() {
  console.log('\n🔐 Step 3: Exporting RLS Policies');
  console.log('=================================');
  
  const rlsCommand = `pg_dump "postgresql://postgres:${EXISTING_DB_PASSWORD}@db.${EXISTING_PROJECT_ID}.supabase.co:5432/postgres" --schema-only --no-owner --no-privileges -t "pg_policy" > mc_rls_export.sql`;
  
  try {
    console.log('Exporting RLS policies...');
    execSync(rlsCommand, { stdio: 'inherit' });
    console.log('✅ RLS policies exported to: mc_rls_export.sql');
  } catch (error) {
    console.error('❌ RLS export failed:', error.message);
    return false;
  }
  
  return true;
}

async function exportUsers() {
  console.log('\n👥 Step 4: Exporting User List (for reference)');
  console.log('===============================================');
  
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Failed to fetch users:', error.message);
      return false;
    }
    
    const userList = users.users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      role: user.role
    }));
    
    fs.writeFileSync('mc_users_export.json', JSON.stringify(userList, null, 2));
    console.log('✅ User list exported to: mc_users_export.json');
    console.log(`📊 Found ${userList.length} users in existing database`);
    
    return true;
  } catch (error) {
    console.error('❌ User export failed:', error.message);
    return false;
  }
}

async function createMigrationInstructions() {
  console.log('\n📝 Step 5: Creating Migration Instructions');
  console.log('==========================================');
  
  const instructions = `# Supabase Database Migration Instructions
# Generated: ${new Date().toISOString()}

## Files Created:
- mc_schema_export.sql: Complete database schema
- mc_data_export.sql: All application data (excluding auth/storage)
- mc_rls_export.sql: Row Level Security policies
- mc_users_export.json: User list for reference

## Next Steps:

### 1. Create New Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: "MC Affiliate Platform"
4. Database Password: T3sla12e!
5. Region: Choose closest to your users

### 2. Import Schema
\`\`\`bash
psql "postgresql://postgres:T3sla12e!@db.YOUR_NEW_PROJECT_ID.supabase.co:5432/postgres" < mc_schema_export.sql
\`\`\`

### 3. Import Data
\`\`\`bash
psql "postgresql://postgres:T3sla12e!@db.YOUR_NEW_PROJECT_ID.supabase.co:5432/postgres" < mc_data_export.sql
\`\`\`

### 4. Create Super Admin User
1. Go to Authentication > Users in Supabase dashboard
2. Click "Add user"
3. Email: sage@myai.ad
4. Password: T3sla12e!
5. Email Confirm: Yes
6. Auto Confirm User: Yes

### 5. Update Environment Variables
Update your .env files with new Supabase credentials:
- VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT_ID.supabase.co
- VITE_SUPABASE_ANON_KEY=your_new_anon_key
- VITE_SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key

### 6. Test and Verify
1. Test login with sage@myai.ad
2. Verify all data is present
3. Test RLS policies
4. Remove old users if needed

### 7. Clean Up Old Users (After Verification)
Use the mc_users_export.json file to identify users to remove from the new database.
`;

  fs.writeFileSync('MC_MIGRATION_INSTRUCTIONS.md', instructions);
  console.log('✅ Migration instructions created: MC_MIGRATION_INSTRUCTIONS.md');
}

async function runExport() {
  console.log('🚀 Starting complete database export...\n');
  
  const results = await Promise.all([
    exportSchema(),
    exportData(),
    exportRLSPolicies(),
    exportUsers()
  ]);
  
  const allSuccessful = results.every(result => result === true);
  
  if (allSuccessful) {
    await createMigrationInstructions();
    console.log('\n🎉 EXPORT COMPLETE!');
    console.log('==================');
    console.log('✅ All database components exported successfully');
    console.log('📋 Check MC_MIGRATION_INSTRUCTIONS.md for next steps');
    console.log('🔄 Ready to create new Supabase project');
  } else {
    console.log('\n❌ EXPORT INCOMPLETE');
    console.log('===================');
    console.log('Some exports failed. Check the errors above and retry.');
  }
}

// Check if credentials are still placeholders
if (EXISTING_SUPABASE_URL.includes('your-existing') || EXISTING_SERVICE_ROLE_KEY.includes('your-existing')) {
  console.log('⚠️  Please update the credentials at the top of this file with your existing Supabase project details:');
  console.log('1. EXISTING_SUPABASE_URL');
  console.log('2. EXISTING_SERVICE_ROLE_KEY');
  console.log('3. EXISTING_DB_PASSWORD');
  console.log('4. EXISTING_PROJECT_ID');
  console.log('\nThen run this script again.');
} else {
  runExport();
} 