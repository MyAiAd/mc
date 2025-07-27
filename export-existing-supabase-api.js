#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

console.log('🔄 Supabase Database Export Tool (API Method)');
console.log('=============================================');

// Your EXISTING remote database credentials
const EXISTING_SUPABASE_URL = 'https://qnruorhzdxkyfhdgtkqp.supabase.co';
const EXISTING_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucnVvcmh6ZHhreWZoZGd0a3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAwNTUxMCwiZXhwIjoyMDYzNTgxNTEwfQ.YLZe38q0F1cl-eBTM5yXDha59JjISzA1eGmtmra7e4o';

console.log('✅ Using provided credentials for existing remote database');
console.log('📡 Using Supabase API method (no direct PostgreSQL connection required)');
console.log('');

// Create Supabase client
const supabase = createClient(EXISTING_SUPABASE_URL, EXISTING_SERVICE_ROLE_KEY);

// Tables to export (excluding auth and storage tables)
const TABLES_TO_EXPORT = [
  'affiliates',
  'users', 
  'campaigns',
  'orders',
  'commission_plans',
  'profiles',
  'payments',
  'performance_levels',
  'affiliate_codes',
  'ghl_contacts',
  'ghl_orders',
  'goaffpro_customers',
  'goaffpro_orders',
  'mightynetworks_members',
  'shopify_products',
  'shopify_orders',
  'first_promoter_affiliates',
  'ai_chat_messages',
  'ai_chat_sessions',
  'rag_documents'
];

async function exportDatabase() {
  console.log('🚀 Starting API-based database export...');
  console.log('');

  try {
    // Step 1: Export Users
    console.log('👥 Step 1: Exporting Users');
    console.log('==========================');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Failed to export users:', usersError.message);
    } else {
      const usersData = users.users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at
      }));
      
      fs.writeFileSync('mc_users_export.json', JSON.stringify(usersData, null, 2));
      console.log(`✅ Exported ${usersData.length} users to: mc_users_export.json`);
    }

    // Step 2: Export Table Data
    console.log('\n📊 Step 2: Exporting Table Data');
    console.log('===============================');
    
    const allTableData = {};
    let totalRows = 0;

    for (const tableName of TABLES_TO_EXPORT) {
      console.log(`   Exporting ${tableName}...`);
      
      try {
        // Get table structure first
        const { data: structure, error: structureError } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);
        
        if (structureError) {
          console.log(`   ❌ ${tableName}: ${structureError.message}`);
          continue;
        }

        // Get all data from table
        const { data: tableData, error: dataError } = await supabase
          .from(tableName)
          .select('*');
        
        if (dataError) {
          console.log(`   ❌ ${tableName}: ${dataError.message}`);
          continue;
        }

        allTableData[tableName] = tableData;
        totalRows += tableData.length;
        console.log(`   ✅ ${tableName}: ${tableData.length} rows`);
        
      } catch (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      }
    }

    // Save all table data
    fs.writeFileSync('mc_data_export.json', JSON.stringify(allTableData, null, 2));
    console.log(`\n✅ Exported ${totalRows} total rows across ${Object.keys(allTableData).length} tables`);
    console.log('📁 Data saved to: mc_data_export.json');

    // Step 3: Generate SQL Schema
    console.log('\n🏗️  Step 3: Generating SQL Schema');
    console.log('=================================');
    
    const schemaSQL = generateSchemaSQL(allTableData);
    fs.writeFileSync('mc_schema_export.sql', schemaSQL);
    console.log('✅ Schema SQL generated: mc_schema_export.sql');

    // Step 4: Generate Migration Instructions
    console.log('\n📋 Step 4: Generating Migration Instructions');
    console.log('===========================================');
    
    const instructions = generateMigrationInstructions(allTableData, users?.users || []);
    fs.writeFileSync('MC_MIGRATION_INSTRUCTIONS.md', instructions);
    console.log('✅ Migration instructions generated: MC_MIGRATION_INSTRUCTIONS.md');

    // Step 5: Summary
    console.log('\n🎉 EXPORT COMPLETE!');
    console.log('==================');
    console.log('📁 Files created:');
    console.log('   - mc_users_export.json (user data)');
    console.log('   - mc_data_export.json (table data)');
    console.log('   - mc_schema_export.sql (SQL schema)');
    console.log('   - MC_MIGRATION_INSTRUCTIONS.md (instructions)');
    console.log('');
    console.log('📊 Export Summary:');
    console.log(`   - Users: ${users?.users?.length || 0}`);
    console.log(`   - Tables: ${Object.keys(allTableData).length}`);
    console.log(`   - Total Rows: ${totalRows}`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Create new Supabase project');
    console.log('   2. Update setup-new-supabase.js with new credentials');
    console.log('   3. Run the setup script to import data');

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your service role key has admin permissions');
    console.log('2. Verify the project is active');
    console.log('3. Check if tables exist in your database');
  }
}

function generateSchemaSQL(tableData) {
  let sql = `-- MC Database Schema Export\n`;
  sql += `-- Generated from existing Supabase database\n`;
  sql += `-- Date: ${new Date().toISOString()}\n\n`;
  
  sql += `-- Enable necessary extensions\n`;
  sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n`;
  sql += `CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n`;
  
  for (const [tableName, data] of Object.entries(tableData)) {
    if (data.length === 0) continue;
    
    sql += `-- Table: ${tableName}\n`;
    sql += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
    
    const sampleRow = data[0];
    const columns = Object.keys(sampleRow);
    
    columns.forEach((column, index) => {
      const value = sampleRow[column];
      let columnType = 'TEXT';
      
      if (typeof value === 'number') {
        columnType = Number.isInteger(value) ? 'INTEGER' : 'NUMERIC';
      } else if (typeof value === 'boolean') {
        columnType = 'BOOLEAN';
      } else if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
        columnType = 'TIMESTAMP';
      } else if (typeof value === 'object' && value !== null) {
        columnType = 'JSONB';
      }
      
      sql += `  "${column}" ${columnType}`;
      if (index < columns.length - 1) sql += ',';
      sql += '\n';
    });
    
    sql += `);\n\n`;
  }
  
  return sql;
}

function generateMigrationInstructions(tableData, users) {
  let instructions = `# MC Database Migration Instructions\n\n`;
  instructions += `## Export Summary\n`;
  instructions += `- **Date**: ${new Date().toISOString()}\n`;
  instructions += `- **Users**: ${users.length}\n`;
  instructions += `- **Tables**: ${Object.keys(tableData).length}\n`;
  instructions += `- **Total Rows**: ${Object.values(tableData).reduce((sum, data) => sum + data.length, 0)}\n\n`;
  
  instructions += `## Tables Exported\n`;
  for (const [tableName, data] of Object.entries(tableData)) {
    instructions += `- **${tableName}**: ${data.length} rows\n`;
  }
  
  instructions += `\n## Users Exported\n`;
  users.forEach(user => {
    instructions += `- **${user.email}** (${user.role})\n`;
  });
  
  instructions += `\n## Next Steps\n`;
  instructions += `1. Create new Supabase project\n`;
  instructions += `2. Update setup-new-supabase.js with new credentials\n`;
  instructions += `3. Run setup script to import data\n`;
  instructions += `4. Create super admin user (sage@myai.ad)\n`;
  instructions += `5. Test application functionality\n`;
  instructions += `6. Clean up old users if needed\n`;
  
  return instructions;
}

// Run the export
exportDatabase(); 