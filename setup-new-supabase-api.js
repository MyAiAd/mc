#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

console.log('🚀 New Supabase Database Setup Tool (API Method)');
console.log('================================================');

// You'll need to replace these with your NEW database credentials
const NEW_SUPABASE_URL = 'https://your-new-project-id.supabase.co';
const NEW_SERVICE_ROLE_KEY = 'your-new-service-role-key';

// Super admin details
const SUPER_ADMIN_EMAIL = 'sage@myai.ad'; // As requested by user
const SUPER_ADMIN_PASSWORD = 'T3sla12e!'; // As requested by user

console.log('⚠️  IMPORTANT: Update the credentials above with your NEW Supabase project details');
console.log('');

// Check if export files exist
const requiredFiles = ['mc_data_export.json', 'mc_users_export.json', 'mc_schema_export.sql'];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Required file not found: ${file}`);
    console.log('Please run export-existing-supabase-api.js first to create export files.');
    process.exit(1);
  }
}

// Create Supabase client
const supabase = createClient(NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY);

async function setupNewDatabase() {
  console.log('🚀 Starting new database setup...');
  console.log('');

  try {
    // Step 1: Create Super Admin User
    console.log('👤 Step 1: Creating Super Admin User');
    console.log('====================================');
    
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        name: 'Sage - Super Admin'
      }
    });

    if (adminError) {
      if (adminError.message.includes('already registered')) {
        console.log('✅ Super admin user already exists');
      } else {
        console.error('❌ Failed to create super admin:', adminError.message);
        return false;
      }
    } else {
      console.log('✅ Super admin user created successfully');
      console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
      console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
    }

    // Step 2: Import Table Data
    console.log('\n📊 Step 2: Importing Table Data');
    console.log('===============================');
    
    const tableData = JSON.parse(fs.readFileSync('mc_data_export.json', 'utf8'));
    let totalImported = 0;

    for (const [tableName, data] of Object.entries(tableData)) {
      if (data.length === 0) {
        console.log(`   ⏭️  ${tableName}: Skipping (no data)`);
        continue;
      }

      console.log(`   Importing ${tableName}...`);
      
      try {
        // Insert data in batches to avoid rate limits
        const batchSize = 100;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          
          const { error: insertError } = await supabase
            .from(tableName)
            .insert(batch);
          
          if (insertError) {
            console.log(`   ❌ ${tableName}: ${insertError.message}`);
            break;
          }
        }
        
        console.log(`   ✅ ${tableName}: ${data.length} rows imported`);
        totalImported += data.length;
        
      } catch (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      }
    }

    // Step 3: Generate Environment File
    console.log('\n🔧 Step 3: Generating Environment Configuration');
    console.log('==============================================');
    
    const envContent = `# MC Supabase Environment Configuration
# Generated automatically from database setup

# Supabase Configuration
VITE_SUPABASE_URL=${NEW_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=your-new-anon-key-from-supabase-dashboard
VITE_SUPABASE_SERVICE_ROLE_KEY=${NEW_SERVICE_ROLE_KEY}

# Database Configuration
SUPABASE_DB_HOST=db.${NEW_SUPABASE_URL.split('//')[1].split('.')[0]}.supabase.co
SUPABASE_DB_PASSWORD=T3sla12e!
SUPABASE_PROJECT_ID=${NEW_SUPABASE_URL.split('//')[1].split('.')[0]}

# Super Admin Details
SUPER_ADMIN_EMAIL=${SUPER_ADMIN_EMAIL}
SUPER_ADMIN_PASSWORD=${SUPER_ADMIN_PASSWORD}

# API Integrations (Update these with your actual keys)
VITE_GOAFFPRO_ACCESS_TOKEN=your-goaffpro-access-token
VITE_GOAFFPRO_PUBLIC_TOKEN=your-goaffpro-public-token
VITE_GHL_API_KEY=your-ghl-api-key
VITE_GHL_LOCATION_ID=your-ghl-location-id
VITE_MIGHTY_NETWORKS_ZAPIER=your-mighty-networks-zapier-key
VITE_SHOPIFY_ACCESS_TOKEN=your-shopify-access-token
VITE_SHOPIFY_SHOP_DOMAIN=themilitarygiftshop.myshopify.com

# Generated on: ${new Date().toISOString()}
`;

    fs.writeFileSync('.env.mc', envContent);
    console.log('✅ Environment file generated: .env.mc');

    // Step 4: Verification
    console.log('\n🔍 Step 4: Verifying Setup');
    console.log('==========================');
    
    // Test super admin login
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD
    });

    if (signInError) {
      console.log('❌ Super admin login test failed:', signInError.message);
    } else {
      console.log('✅ Super admin login test successful');
    }

    // Test data access
    let dataTestPassed = 0;
    for (const [tableName, data] of Object.entries(tableData)) {
      if (data.length === 0) continue;
      
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error && count === data.length) {
          dataTestPassed++;
        }
      } catch (error) {
        // Ignore errors for verification
      }
    }

    console.log(`✅ Data verification: ${dataTestPassed}/${Object.keys(tableData).filter(k => tableData[k].length > 0).length} tables verified`);

    // Step 5: Summary
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('==================');
    console.log('📁 Files created:');
    console.log('   - .env.mc (environment configuration)');
    console.log('');
    console.log('👤 Super Admin Account:');
    console.log(`   - Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`   - Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log('');
    console.log('📊 Import Summary:');
    console.log(`   - Tables: ${Object.keys(tableData).length}`);
    console.log(`   - Total Rows: ${totalImported}`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Copy .env.mc to .env: cp .env.mc .env');
    console.log('   2. Update .env with your actual API keys');
    console.log('   3. Test your application: npm run dev');
    console.log('   4. Login with super admin credentials');
    console.log('   5. Verify all functionality works');
    console.log('   6. Run cleanup-old-users.js if needed');

    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your NEW_SUPABASE_URL is correct');
    console.log('2. Verify your NEW_SERVICE_ROLE_KEY is valid');
    console.log('3. Ensure your new project is active');
    console.log('4. Check if tables exist in your new database');
    
    return false;
  }
}

// Check if credentials are still placeholders
if (NEW_SUPABASE_URL.includes('your-new') || NEW_SERVICE_ROLE_KEY.includes('your-new')) {
  console.log('⚠️  Please update the credentials at the top of this file with your NEW Supabase project details:');
  console.log('1. NEW_SUPABASE_URL');
  console.log('2. NEW_SERVICE_ROLE_KEY');
  console.log('\nThen run this script again to set up the new database.');
} else {
  setupNewDatabase();
} 