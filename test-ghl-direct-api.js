import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '<YOUR_JWT_TOKEN>';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testing Direct GHL API Import');
console.log(`Supabase URL: ${supabaseUrl}`);

async function testDirectGHLImport() {
  try {
    const credentials = {
      apiKey: '<YOUR_JWT_TOKEN>',
      locationId: '<YOUR_GHL_LOCATION_ID>'
    };

    console.log('\n🔄 Testing GHL API access...');
    console.log('Location ID:', credentials.locationId);
    console.log('API Key:', credentials.apiKey.substring(0, 30) + '...');

    // Test GHL API access
    const baseUrl = 'https://services.leadconnectorhq.com';
    const endpoint = `/contacts/?locationId=${credentials.locationId}&limit=5`;
    
    console.log(`\n📡 Making request to: ${baseUrl}${endpoint}`);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ GHL API Error: ${response.status} ${response.statusText}`);
      console.error('Error details:', errorText);
      return;
    }

    const responseData = await response.json();
    console.log('✅ GHL API Response received');
    
    if (responseData.contacts && Array.isArray(responseData.contacts)) {
      console.log(`📥 Found ${responseData.contacts.length} contacts`);
      
      // Show first contact as example
      if (responseData.contacts.length > 0) {
        const firstContact = responseData.contacts[0];
        console.log('\n📋 Sample contact:');
        console.log('  ID:', firstContact.id);
        console.log('  Email:', firstContact.email);
        console.log('  Name:', firstContact.firstName, firstContact.lastName);
        console.log('  Phone:', firstContact.phone);
      }

      // Test database insert with user client
      console.log('\n🔄 Testing database insert with user client...');
      
      const testContact = responseData.contacts[0];
      if (testContact) {
        const affiliateData = {
          email: `test-ghl-${Date.now()}@example.com`, // Use unique email for test
          first_name: testContact.firstName || 'Test',
          last_name: testContact.lastName || 'User',
          phone: testContact.phone || null,
          referral_code: `TEST${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          primary_source: 'ghl',
          ghl_contact_id: testContact.id,
          status: 'active',
          signup_date: new Date().toISOString(),
          custom_fields: testContact.customFields ? JSON.stringify(testContact.customFields) : null
        };

        const { data, error } = await supabase
          .from('affiliate_system_users')
          .insert([affiliateData])
          .select();

        if (error) {
          console.error('❌ Database insert failed:', error.message);
          console.error('Error details:', error);
        } else {
          console.log('✅ Database insert successful');
          console.log('Inserted record:', data[0]);
          
          // Clean up test record
          await supabase
            .from('affiliate_system_users')
            .delete()
            .eq('email', affiliateData.email);
          console.log('🧹 Cleaned up test record');
        }
      }
    } else {
      console.log('⚠️ No contacts found in response');
      console.log('Response structure:', Object.keys(responseData));
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

testDirectGHLImport().catch(console.error);