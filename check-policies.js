import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'http://127.0.0.1:54321',
  '<YOUR_JWT_TOKEN>'
);

async function checkPolicies() {
  try {
    console.log('🔍 Checking RLS policies for goaffpro_affiliates...');
    
    const { data, error } = await supabase
      .rpc('exec', { 
        sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
              FROM pg_policies 
              WHERE tablename = 'goaffpro_affiliates'
              ORDER BY policyname;` 
      });
      
    if (error) {
      console.error('❌ Error checking policies:', error);
      return;
    }
    
    console.log('📋 Current policies:');
    if (data && data.length > 0) {
      data.forEach((policy, index) => {
        console.log(`\nPolicy ${index + 1}:`);
        console.log(`  Name: ${policy.policyname}`);
        console.log(`  Command: ${policy.cmd}`);
        console.log(`  Roles: ${policy.roles}`);
        console.log(`  Condition: ${policy.qual}`);
      });
    } else {
      console.log('No policies found');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPolicies(); 