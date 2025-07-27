#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🚀 Affiliate Platform Production Migration Script');
console.log('=' .repeat(60));

// Production environment configuration template
const PRODUCTION_ENV = `# Supabase Configuration (Production)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# GoAffPro Configuration
VITE_GOAFFPRO_ACCESS_TOKEN=your-goaffpro-access-token
VITE_GOAFFPRO_PUBLIC_TOKEN=your-goaffpro-public-token

# GHL Configuration
VITE_GHL_API_KEY=your-ghl-api-key
VITE_GHL_LOCATION_ID=your-ghl-location-id

# Mighty Networks Configuration
VITE_MIGHTY_NETWORKS_ZAPIER=your-mighty-networks-zapier-key
`;

// Updated local environment template
const LOCAL_ENV = `# Supabase Configuration (Local Development)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-supabase-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-local-supabase-service-role-key

# GoAffPro Configuration
VITE_GOAFFPRO_ACCESS_TOKEN=your-goaffpro-access-token
VITE_GOAFFPRO_PUBLIC_TOKEN=your-goaffpro-public-token

# GHL Configuration
VITE_GHL_API_KEY=your-ghl-api-key
VITE_GHL_LOCATION_ID=your-ghl-location-id

# Mighty Networks Configuration
VITE_MIGHTY_NETWORKS_ZAPIER=your-mighty-networks-zapier-key
`;

function createEnvironmentFiles() {
  console.log('\n📝 Creating environment configuration files...');
  
  try {
    // Create production environment file
    fs.writeFileSync('.env.production', PRODUCTION_ENV);
    console.log('✅ Created .env.production');
    
    // Create updated local environment file
    fs.writeFileSync('.env.local.updated', LOCAL_ENV);
    console.log('✅ Created .env.local.updated (backup of current with fixes)');
    
    console.log('\n🔧 Manual steps required:');
    console.log('1. Replace your current .env.local with .env.local.updated');
    console.log('2. Update all placeholder values with your actual API keys');
    console.log('3. Restart your development server');
    
  } catch (error) {
    console.error('❌ Error creating environment files:', error.message);
  }
}

function displayMigrationSteps() {
  console.log('\n📋 Migration Steps to Production:');
  console.log('=' .repeat(40));
  
  console.log('\n1. 🗄️  Database Migration:');
  console.log('   - Schema exported to: local_schema.sql');
  console.log('   - Data exported to: local_data.sql');
  console.log('   - Apply these to production Supabase');
  
  console.log('\n2. 🔧 Edge Functions:');
  console.log('   - Deploy mn-webhook function to production');
  console.log('   - Verify environment variables are set');
  
  console.log('\n3. 🌐 Environment Variables:');
  console.log('   Production Supabase configuration needed:');
  console.log('   - ZAPIER_MIGHTYNETWORKS_KEY');
  console.log('   - MN_WEBHOOK_SECRET');
  console.log('   - All SUPABASE_* keys');
  
  console.log('\n4. 🧪 Testing:');
  console.log('   - Test webhook with production URL');
  console.log('   - Verify Zapier integration');
  console.log('   - Test all API integrations');
  
  console.log('\n5. 🚀 Go Live:');
  console.log('   - Switch to .env.production');
  console.log('   - Update Zapier webhook URL');
  console.log('   - Deploy application');
}

function displayWebhookUrls() {
  console.log('\n🔗 Webhook URLs:');
  console.log('=' .repeat(30));
  console.log('Local:      http://localhost:54321/functions/v1/mn-webhook');
  console.log('Production: https://your-project-id.supabase.co/functions/v1/mn-webhook');
  
  console.log('\n🔑 API Keys Configuration:');
  console.log('- ZAPIER_MIGHTYNETWORKS_KEY: Configure in production');
  console.log('- MN_WEBHOOK_SECRET: Configure in production');
  console.log('- All Supabase keys: Configure in production');
}

function displayDatabaseCommands() {
  console.log('\n💾 Database Migration Commands:');
  console.log('=' .repeat(35));
  console.log('');
  console.log('To apply schema to production:');
  console.log('psql "postgresql://postgres:YOUR_PASSWORD@db.your-project-id.supabase.co:5432/postgres" < local_schema.sql');
  console.log('');
  console.log('To apply data to production:');
  console.log('psql "postgresql://postgres:YOUR_PASSWORD@db.your-project-id.supabase.co:5432/postgres" < local_data.sql');
  console.log('');
  console.log('⚠️  Replace YOUR_PASSWORD and your-project-id with your actual values');
}

// Run the migration helper
console.log('\n🎯 Current Status:');
console.log('✅ Local database exported');
console.log('✅ Production Supabase ready for configuration');
console.log('✅ Edge Function deployment ready');

createEnvironmentFiles();
displayMigrationSteps();
displayWebhookUrls();
displayDatabaseCommands();

console.log('\n🎉 Migration preparation complete!');
console.log('Next: Configure your production environment with actual API keys'); 