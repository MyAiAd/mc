#!/usr/bin/env node

const PRODUCTION_REACTION_URL = 'https://<YOUR_PROJECT_ID>.supabase.co/functions/v1/auto-sync-goaffpro';
const SUPABASE_ANON_KEY = '<YOUR_JWT_TOKEN>';

// Test credentials (from .env.production)
const GOAFFPRO_ACCESS_TOKEN = '<YOUR_GOAFFPRO_ACCESS_TOKEN>';
const GOAFFPRO_PUBLIC_TOKEN = '<YOUR_GOAFFPRO_PUBLIC_TOKEN>';

async function testReActionImport() {
  console.log('🧪 Testing Production ReAction/GoAffPro Import');
  console.log('=' .repeat(50));
  console.log(`📍 URL: ${PRODUCTION_REACTION_URL}`);
  console.log(`🔑 Access Token: ${GOAFFPRO_ACCESS_TOKEN.substring(0, 10)}...`);
  
  const payload = {
    accessToken: GOAFFPRO_ACCESS_TOKEN,
    publicToken: GOAFFPRO_PUBLIC_TOKEN
  };

  try {
    console.log('\n📤 Sending ReAction import request...');
    const response = await fetch(PRODUCTION_REACTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload)
    });

    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📄 Response Body:', responseText);

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('\n✅ ReAction Import Test Results:');
      console.log(`📊 Affiliates Processed: ${result.affiliatesProcessed || 0}`);
      console.log(`✅ Affiliates Successful: ${result.affiliatesSuccessful || 0}`);
      console.log(`❌ Affiliates Failed: ${result.affiliatesFailed || 0}`);
      console.log(`📊 Orders Processed: ${result.ordersProcessed || 0}`);
      console.log(`✅ Orders Successful: ${result.ordersSuccessful || 0}`);
      console.log(`❌ Orders Failed: ${result.ordersFailed || 0}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        result.errors.slice(0, 3).forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
      }
      
      console.log('\n🎉 ReAction import function is working!');
    } else {
      console.log('\n❌ ReAction import test failed');
      
      if (response.status === 401) {
        console.log('🔐 Authentication issue - check API tokens');
      } else if (response.status === 404) {
        console.log('🔍 Function not found - may not be deployed');
      } else if (response.status === 500) {
        console.log('🐛 Server error - check function logs');
      }
    }

  } catch (error) {
    console.log('\n❌ Network error:', error.message);
  }
}

// Run the test
testReActionImport().catch(console.error); 