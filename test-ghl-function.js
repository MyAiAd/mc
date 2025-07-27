import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '<YOUR_JWT_TOKEN>';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testing GHL Import Server Function');
console.log(`Supabase URL: ${supabaseUrl}`);

async function testGHLFunction() {
  try {
    // Use the known user ID directly for testing
    const userId = '1ff88f35-5ad2-4878-bc21-ebc48cd6d118';
    
    console.log('\n🔄 Testing GHL import function...');
    console.log('Using user ID:', userId);
    
    // Create a test JWT token for the function call
    // Since we're testing locally, we can create a simple token
    const testToken = '<YOUR_JWT_TOKEN>';

    const { data, error } = await supabase.functions.invoke('ghl-import', {
      body: {
        apiKey: '<YOUR_JWT_TOKEN>',
        locationId: '<YOUR_GHL_LOCATION_ID>',
        userId: userId
      },
      headers: {
        Authorization: `Bearer ${testToken}`,
      }
    });

    if (error) {
      console.error('❌ Function error:', error);
      console.log('Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ Function response:', data);

    if (data && data.success) {
      console.log(`\n📊 Import Results:`);
      console.log(`  Records Processed: ${data.recordsProcessed}`);
      console.log(`  Records Successful: ${data.recordsSuccessful}`);
      console.log(`  Records Failed: ${data.recordsFailed}`);
      console.log(`  Records Updated: ${data.recordsUpdated}`);
      
      if (data.errors && data.errors.length > 0) {
        console.log(`\n⚠️ Errors:`);
        data.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
    } else {
      console.log('❌ Import failed:', data?.error || 'Unknown error');
      if (data?.errors) {
        console.log('Errors:', data.errors);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('Error details:', JSON.stringify(error, null, 2));
  }
}

testGHLFunction().catch(console.error); 