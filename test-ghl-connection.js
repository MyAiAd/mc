import fetch from 'node-fetch';

const apiKey = process.env.VITE_GHL_API_KEY || '<YOUR_GHL_API_KEY>';
const locationId = process.env.VITE_GHL_LOCATION_ID || '<YOUR_GHL_LOCATION_ID>';
const baseUrl = 'https://services.leadconnectorhq.com';

async function testGHLConnection() {
  console.log('🔄 Testing GHL API connection...');
  console.log(`Location ID: ${locationId}`);
  console.log(`API Key: ${apiKey.substring(0, 20)}...`);
  
  const endpoints = [
    `/contacts/?locationId=${locationId}&limit=5`,
    `/locations/${locationId}`,
    `/locations/${locationId}/contacts?limit=5`
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing endpoint: ${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success! Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
  }
}

testGHLConnection().catch(console.error); 