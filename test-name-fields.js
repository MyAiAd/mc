import { createClient } from '@supabase/supabase-js';

// Configuration with service role key
const goaffproConfig = {
  accessToken: '<YOUR_GOAFFPRO_ACCESS_TOKEN>',
  baseUrl: 'https://api.goaffpro.com/v1'
};

const supabaseConfig = {
  url: 'http://localhost:54321',
  serviceRoleKey: '<YOUR_JWT_TOKEN>'
};

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);

async function fetchGoAffProNames() {
  console.log('🔍 Fetching affiliate names from GoAffPro...\n');
  
  try {
    const fields = 'id,email,first_name,last_name,name,status';
    const response = await fetch(`${goaffproConfig.baseUrl}/admin/affiliates?fields=${fields}`, {
      headers: {
        'X-GOAFFPRO-ACCESS-TOKEN': goaffproConfig.accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.total_results} affiliates from GoAffPro`);
    
    data.affiliates.forEach(affiliate => {
      console.log(`- ${affiliate.name} (${affiliate.email}): First="${affiliate.first_name}", Last="${affiliate.last_name}"`);
    });
    
    return data.affiliates;
  } catch (error) {
    console.error('❌ Error fetching from GoAffPro:', error);
    throw error;
  }
}

async function updateNamesInDatabase(affiliates) {
  console.log('\n📝 Updating names in database using service role...\n');
  
  for (const affiliate of affiliates) {
    try {
      console.log(`\nProcessing: ${affiliate.name} (${affiliate.email})`);
      
      // Update with service role key (bypasses RLS)
      const { data, error } = await supabase
        .from('goaffpro_affiliates')
        .update({
          first_name: affiliate.first_name || null,
          last_name: affiliate.last_name || null,
          updated_at: new Date().toISOString()
        })
        .eq('goaffpro_id', affiliate.id.toString())
        .select();
      
      if (error) {
        console.error(`❌ Error updating ${affiliate.email}:`, error);
      } else {
        console.log(`✅ Updated ${affiliate.name}: ${data.length} row(s) affected`);
        if (data.length > 0) {
          console.log(`   First: "${data[0].first_name}", Last: "${data[0].last_name}"`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${affiliate.email}:`, error);
    }
  }
}

async function verifyUpdates() {
  console.log('\n🔍 Verifying updates...\n');
  
  try {
    const { data, error } = await supabase
      .from('goaffpro_affiliates')
      .select('goaffpro_id, email, first_name, last_name')
      .order('email');
    
    if (error) {
      console.error('❌ Error verifying:', error);
      return;
    }
    
    console.log('📊 Current database state:');
    data.forEach(record => {
      const displayName = record.first_name && record.last_name 
        ? `${record.first_name} ${record.last_name}`
        : record.first_name || record.last_name || 'No Name';
      console.log(`- ${displayName} (${record.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error verifying:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting name update with service role key...\n');
    
    // Fetch names from GoAffPro
    const affiliates = await fetchGoAffProNames();
    
    // Update database with service role
    await updateNamesInDatabase(affiliates);
    
    // Verify the updates
    await verifyUpdates();
    
    console.log('\n🎉 Name update completed!');
    console.log('💡 Names should now be properly stored in the database.');
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

main(); 