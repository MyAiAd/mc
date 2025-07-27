import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  console.error('Available variables:');
  console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('- VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceRoleKey);
  process.exit(1);
}

// Your GHL credentials
const ghlConfig = {
  apiKey: '<YOUR_JWT_TOKEN>',
  locationId: '<YOUR_GHL_LOCATION_ID>'
};

// Create a simplified GHL service for testing
class SimpleGHLService {
  constructor(supabase, serviceRoleClient, config) {
    this.supabase = supabase;
    this.serviceRoleClient = serviceRoleClient;
    this.config = {
      baseUrl: 'https://rest.gohighlevel.com/v1',
      ...config
    };
  }

  async fetchContacts() {
    console.log('🔄 Fetching contacts from Go High Level...');
    
    let allContacts = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore && allContacts.length < 1000) { // Safety limit
      console.log(`📥 Fetching page ${page}...`);
      
      const url = `${this.config.baseUrl}/contacts/?locationId=${this.config.locationId}&limit=100&skip=${(page - 1) * 100}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`GHL API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.contacts && data.contacts.length > 0) {
        allContacts.push(...data.contacts);
        console.log(`✅ Page ${page}: ${data.contacts.length} contacts (total: ${allContacts.length})`);
        
        // Check if we got fewer contacts than the limit - means we're done
        hasMore = data.contacts.length === 100;
        page++;
      } else {
        hasMore = false;
      }
      
      // Rate limiting - be nice to the API
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }

    console.log(`✅ Total contacts fetched: ${allContacts.length}`);
    return allContacts;
  }

  async importAffiliates(userId) {
    console.log('🔄 Starting import process...');
    
    const result = {
      success: false,
      recordsProcessed: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      recordsUpdated: 0,
      errors: [],
      warnings: []
    };

    try {
      const contacts = await this.fetchContacts();
      result.recordsProcessed = contacts.length;

      console.log('🔄 Processing GHL contacts into affiliate system...');

      for (const contact of contacts) {
        try {
          // Import into GHL affiliates table
          const ghlAffiliateData = {
            ghl_contact_id: contact.id,
            email: contact.email,
            first_name: contact.firstName || null,
            last_name: contact.lastName || null,
            phone: contact.phone || null,
            contact_source: contact.source || null,
            tags: contact.tags ? JSON.stringify(contact.tags) : null,
            date_added: contact.dateAdded ? new Date(contact.dateAdded).toISOString() : null,
            last_activity: contact.lastActivity ? new Date(contact.lastActivity).toISOString() : null,
            status: 'active',
            raw_data: JSON.stringify(contact),
            last_synced: new Date().toISOString(),
            sync_status: 'synced'
          };

          const { error: ghlError } = await this.serviceRoleClient
            .from('ghl_affiliates')
            .upsert([ghlAffiliateData], { onConflict: 'ghl_contact_id' });

          if (ghlError) {
            result.errors.push(`GHL table - Contact ${contact.id}: ${ghlError.message}`);
            result.recordsFailed++;
            continue;
          }

          // Generate referral code
          const referralCode = this.generateReferralCode(contact);

          // Import into main affiliate system
          const affiliateData = {
            email: contact.email,
            first_name: contact.firstName || null,
            last_name: contact.lastName || null,
            phone: contact.phone || null,
            referral_code: referralCode,
            primary_source: 'ghl',
            ghl_contact_id: contact.id,
            status: 'active',
            signup_date: contact.dateAdded ? new Date(contact.dateAdded).toISOString() : new Date().toISOString(),
            last_active: contact.lastActivity ? new Date(contact.lastActivity).toISOString() : null
          };

          const { error: affiliateError } = await this.serviceRoleClient
            .from('affiliate_system_users')
            .upsert([affiliateData], { 
              onConflict: 'email',
              ignoreDuplicates: false 
            });

          if (affiliateError) {
            result.errors.push(`Affiliate system - Contact ${contact.id}: ${affiliateError.message}`);
            result.recordsFailed++;
          } else {
            result.recordsSuccessful++;
          }

        } catch (error) {
          result.errors.push(`Contact ${contact.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.recordsFailed++;
        }
      }

      result.success = result.recordsSuccessful > 0;
      return result;

    } catch (error) {
      result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  generateReferralCode(contact) {
    const name = (contact.firstName || contact.lastName || contact.email?.split('@')[0] || 'user').toLowerCase();
    const random = Math.random().toString(36).substring(2, 6);
    return `${name}-${random}`.substring(0, 20);
  }
}

async function testGHLImport() {
  console.log('🚀 Starting GHL Affiliates Import Test');
  console.log(`Location ID: ${ghlConfig.locationId}`);
  console.log(`API Key: ${ghlConfig.apiKey.substring(0, 30)}...`);
  
  try {
    // Initialize Supabase clients
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const serviceRoleClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Test database connection
    console.log('\n🔍 Testing database connection...');
    const { data: testData, error: testError } = await serviceRoleClient
      .from('ghl_affiliates')
      .select('*', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Initialize GHL Import Service
    const ghlService = new SimpleGHLService(supabase, serviceRoleClient, ghlConfig);
    
    // Test API connection by fetching a few contacts
    console.log('\n🔍 Testing GHL API connection...');
    const contacts = await ghlService.fetchContacts();
    console.log(`✅ Successfully fetched ${contacts.length} contacts from GHL`);
    
    if (contacts.length > 0) {
      console.log('\nSample contact:');
      const sample = contacts[0];
      console.log(`- ID: ${sample.id}`);
      console.log(`- Name: ${sample.firstName || ''} ${sample.lastName || ''}`);
      console.log(`- Email: ${sample.email}`);
      console.log(`- Source: ${sample.source || 'N/A'}`);
      console.log(`- Tags: ${sample.tags ? sample.tags.join(', ') : 'None'}`);
    }
    
    // Start the import process
    console.log('\n🔄 Starting affiliate import process...');
    const userId = 'test-import-user';
    
    const importResult = await ghlService.importAffiliates(userId);
    
    console.log('\n📊 Import Results:');
    console.log(`✅ Success: ${importResult.success}`);
    console.log(`📝 Records Processed: ${importResult.recordsProcessed}`);
    console.log(`✅ Records Successful: ${importResult.recordsSuccessful}`);
    console.log(`❌ Records Failed: ${importResult.recordsFailed}`);
    console.log(`🔄 Records Updated: ${importResult.recordsUpdated}`);
    
    if (importResult.errors.length > 0) {
      console.log('\n❌ Errors:');
      importResult.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (importResult.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      importResult.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    // Check the data in the database
    console.log('\n🔍 Checking imported data...');
    
    // Note: Use service role client for accurate counts (bypasses RLS)
    const { data: ghlAffiliates, error: ghlError, count: ghlCount } = await serviceRoleClient
      .from('ghl_affiliates')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (ghlError) {
      console.error('❌ Error fetching GHL affiliates:', ghlError);
    } else {
      console.log(`📊 GHL Affiliates table contains ${ghlCount} total records (showing first 5)`);
      console.log(`💡 Note: Regular client might show fewer due to RLS policies`);
    }
    
    const { data: affiliateSystemUsers, error: affiliateError, count: affCount } = await serviceRoleClient
      .from('affiliate_system_users')
      .select('*', { count: 'exact' })
      .eq('primary_source', 'ghl')
      .limit(5);
    
    if (affiliateError) {
      console.error('❌ Error fetching affiliate system users:', affiliateError);
    } else {
      console.log(`📊 Affiliate System Users from GHL: ${affCount} total records (showing first 5)`);
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

// Run the test
testGHLImport().catch(console.error); 