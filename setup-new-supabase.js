#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 New Supabase Database Setup Tool');
console.log('===================================');

// You'll need to replace these with your NEW database credentials
const NEW_SUPABASE_URL = 'https://your-new-project-id.supabase.co';
const NEW_SERVICE_ROLE_KEY = 'your-new-service-role-key';
const NEW_DB_PASSWORD = 'T3sla12e!';
const NEW_PROJECT_ID = 'your-new-project-id';

// Super admin details
const SUPER_ADMIN_EMAIL = 'sage@myai.ad';
const SUPER_ADMIN_PASSWORD = 'T3sla12e!';

console.log('⚠️  IMPORTANT: Update the NEW database credentials above');
console.log('');

// Create Supabase client for new database
const supabase = createClient(NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY);

async function importSchema() {
  console.log('📋 Step 1: Importing Database Schema');
  console.log('====================================');
  
  if (!fs.existsSync('mc_schema_export.sql')) {
    console.error('❌ mc_schema_export.sql not found. Run export-existing-supabase.js first.');
    return false;
  }
  
  const schemaCommand = `psql "postgresql://postgres:${NEW_DB_PASSWORD}@db.${NEW_PROJECT_ID}.supabase.co:5432/postgres" < mc_schema_export.sql`;
  
  try {
    console.log('Importing schema...');
    execSync(schemaCommand, { stdio: 'inherit' });
    console.log('✅ Schema imported successfully');
  } catch (error) {
    console.error('❌ Schema import failed:', error.message);
    console.log('💡 This might be normal if some tables already exist');
  }
  
  return true;
}

async function importData() {
  console.log('\n💾 Step 2: Importing Database Data');
  console.log('==================================');
  
  if (!fs.existsSync('mc_data_export.sql')) {
    console.error('❌ mc_data_export.sql not found. Run export-existing-supabase.js first.');
    return false;
  }
  
  const dataCommand = `psql "postgresql://postgres:${NEW_DB_PASSWORD}@db.${NEW_PROJECT_ID}.supabase.co:5432/postgres" < mc_data_export.sql`;
  
  try {
    console.log('Importing data...');
    execSync(dataCommand, { stdio: 'inherit' });
    console.log('✅ Data imported successfully');
  } catch (error) {
    console.error('❌ Data import failed:', error.message);
    return false;
  }
  
  return true;
}

async function createSuperAdmin() {
  console.log('\n👤 Step 3: Creating Super Admin User');
  console.log('====================================');
  
  try {
    console.log(`Creating user: ${SUPER_ADMIN_EMAIL}`);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        created_by: 'setup_script',
        full_name: 'Sage Admin'
      }
    });
    
    if (error) {
      console.error('❌ Failed to create super admin:', error.message);
      return false;
    }
    
    console.log('✅ Super admin created successfully');
    console.log(`📧 Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log(`🆔 User ID: ${data.user.id}`);
    
    return true;
  } catch (error) {
    console.error('❌ Super admin creation failed:', error.message);
    return false;
  }
}

async function updateEnvironmentFiles() {
  console.log('\n📝 Step 4: Updating Environment Files');
  console.log('=====================================');
  
  const envTemplate = `# Supabase Configuration (MC Database)
VITE_SUPABASE_URL=${NEW_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=your-new-anon-key-from-supabase-dashboard
VITE_SUPABASE_SERVICE_ROLE_KEY=${NEW_SERVICE_ROLE_KEY}

# GoAffPro Configuration
VITE_GOAFFPRO_ACCESS_TOKEN=your-goaffpro-access-token
VITE_GOAFFPRO_PUBLIC_TOKEN=your-goaffpro-public-token

# GHL Configuration
VITE_GHL_API_KEY=your-ghl-api-key
VITE_GHL_LOCATION_ID=your-ghl-location-id

# Mighty Networks Configuration
VITE_MIGHTY_NETWORKS_ZAPIER=your-mighty-networks-key

# Shopify Configuration (The Military Gift Shop)
SHOPIFY_SHOP_DOMAIN=themilitarygiftshop.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-shopify-access-token
`;

  try {
    fs.writeFileSync('.env.mc', envTemplate);
    console.log('✅ Created .env.mc with new Supabase credentials');
    console.log('⚠️  Remember to:');
    console.log('   1. Get your anon key from Supabase dashboard');
    console.log('   2. Add your other API keys');
    console.log('   3. Copy .env.mc to .env when ready to use');
  } catch (error) {
    console.error('❌ Failed to create environment file:', error.message);
    return false;
  }
  
  return true;
}

async function verifySetup() {
  console.log('\n✅ Step 5: Verifying Setup');
  console.log('==========================');
  
  try {
    // Test database connection
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    if (tablesError) {
      console.error('❌ Database connection test failed:', tablesError.message);
      return false;
    }
    
    console.log(`✅ Database connected - Found ${tables.length} tables`);
    
    // Test user creation
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ User verification failed:', usersError.message);
      return false;
    }
    
    const adminUser = users.users.find(user => user.email === SUPER_ADMIN_EMAIL);
    if (adminUser) {
      console.log('✅ Super admin user verified');
    } else {
      console.log('⚠️  Super admin user not found in verification');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

async function displayNextSteps() {
  console.log('\n📋 Next Steps');
  console.log('=============');
  console.log('1. 🌐 Go to your Supabase dashboard: https://supabase.com/dashboard');
  console.log('2. 📋 Copy your anon key from Settings > API');
  console.log('3. ✏️  Update .env.mc with your anon key');
  console.log('4. 🔑 Add your other API keys (GoAffPro, GHL, etc.)');
  console.log('5. 📄 Copy .env.mc to .env when ready');
  console.log('6. 🧪 Test login with:');
  console.log(`   📧 Email: ${SUPER_ADMIN_EMAIL}`);
  console.log(`   🔑 Password: ${SUPER_ADMIN_PASSWORD}`);
  console.log('7. 🗑️  Remove old users from the database if needed');
  console.log('8. 🚀 Deploy your application!');
}

async function runSetup() {
  console.log('🚀 Starting new database setup...\n');
  
  const steps = [
    { name: 'Import Schema', fn: importSchema },
    { name: 'Import Data', fn: importData },
    { name: 'Create Super Admin', fn: createSuperAdmin },
    { name: 'Update Environment Files', fn: updateEnvironmentFiles },
    { name: 'Verify Setup', fn: verifySetup }
  ];
  
  let allSuccessful = true;
  
  for (const step of steps) {
    const result = await step.fn();
    if (!result) {
      allSuccessful = false;
      console.log(`❌ ${step.name} failed`);
    }
  }
  
  if (allSuccessful) {
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('==================');
    console.log('✅ New Supabase database configured successfully');
    await displayNextSteps();
  } else {
    console.log('\n❌ SETUP INCOMPLETE');
    console.log('===================');
    console.log('Some steps failed. Check the errors above and retry.');
  }
}

// Check if credentials are still placeholders
if (NEW_SUPABASE_URL.includes('your-new') || NEW_SERVICE_ROLE_KEY.includes('your-new')) {
  console.log('⚠️  Please update the credentials at the top of this file with your NEW Supabase project details:');
  console.log('1. NEW_SUPABASE_URL');
  console.log('2. NEW_SERVICE_ROLE_KEY');
  console.log('3. NEW_PROJECT_ID');
  console.log('\nThen run this script again.');
} else {
  runSetup();
} 