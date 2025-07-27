// Quick script to check order data fields
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'http://localhost:54321',
  '<YOUR_JWT_TOKEN>'
);

async function checkOrderFields() {
  console.log('🔍 Checking order data structure...');
  
  const { data, error } = await supabase
    .from('goaffpro_orders')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('📊 Available order fields:');
    const order = data[0];
    Object.keys(order).forEach(key => {
      const value = order[key];
      let displayValue;
      if (value === null) {
        displayValue = 'null';
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value).substring(0, 100) + '...';
      } else {
        displayValue = String(value);
      }
      console.log(`  ${key}: ${displayValue}`);
    });
    
    // Check if products field has useful data
    if (order.products) {
      console.log('\n🛍️ Products data structure:');
      console.log(JSON.stringify(order.products, null, 2));
    }
  } else {
    console.log('❌ No order data found');
  }
}

checkOrderFields().catch(console.error); 