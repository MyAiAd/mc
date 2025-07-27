#!/usr/bin/env node

// Test script to verify Production Mighty Networks webhook
const PRODUCTION_WEBHOOK_URL = 'https://<YOUR_PROJECT_ID>.supabase.co/functions/v1/mn-webhook';
const API_KEY = '<YOUR_MIGHTY_NETWORKS_ZAPIER>';
const SUPABASE_ANON_KEY = '<YOUR_JWT_TOKEN>';

async function testProductionWebhook() {
  console.log('🧪 Testing Production Mighty Networks Webhook...');
  console.log(`📍 URL: ${PRODUCTION_WEBHOOK_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
  
  const testPayload = {
    api_key: API_KEY,
    member_id: 'test-production-123',
    email: 'test-production@example.com',
    first_name: 'Test',
    last_name: 'Production',
    activity_type: 'joined',
    timestamp: new Date().toISOString()
  };

  try {
    console.log('\n📤 Sending test payload to production...');
    const response = await fetch(PRODUCTION_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📄 Response Body:', responseText);

    if (response.ok) {
      console.log('✅ Production webhook test successful!');
      console.log('🎉 Ready to use in Zapier!');
    } else {
      console.log('❌ Production webhook test failed');
      
      if (response.status === 401) {
        console.log('🔐 Authentication issue - check API key configuration in Supabase');
      } else if (response.status === 404) {
        console.log('🔍 Function not found - webhook may not be deployed to production');
      } else if (response.status === 500) {
        console.log('🐛 Server error - check function logs in Supabase dashboard');
      }
    }

  } catch (error) {
    console.log('❌ Network error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('🌐 DNS resolution failed - check URL');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔌 Connection refused - check if production Supabase is accessible');
    }
  }
}

console.log('🚀 Production Webhook Test');
console.log('=' .repeat(30));

// Run the test
testProductionWebhook().catch(console.error); 