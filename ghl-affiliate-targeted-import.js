// TARGETED GHL Affiliate Import - Only import actual affiliates, not all contacts
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

class TargetedGHLAffiliateImport {
  constructor() {
    this.config = {
      apiKey: '<YOUR_JWT_TOKEN>',
      locationId: '<YOUR_GHL_LOCATION_ID>',
      baseUrl: 'https://rest.gohighlevel.com/v1'
    };

    // Define affiliate identification criteria
    this.affiliateCriteria = {
      tags: [
        'jennaz-affiliate',
        'reaction-affiliate',
        'affiliate',
        'partner',
        'referral'
      ],
      sources: [
        'affiliate signup',
        'rise signup',
        'partner signup'
      ]
    };

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    this.supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    this.serviceRoleClient = createClient(supabaseUrl, serviceRoleKey);
  }

  isAffiliate(contact) {
    // Check if contact has affiliate tags
    const hasAffiliateTags = contact.tags && contact.tags.some(tag => 
      this.affiliateCriteria.tags.some(affiliateTag => 
        tag.toLowerCase().includes(affiliateTag.toLowerCase())
      )
    );

    // Check if contact has affiliate source
    const hasAffiliateSource = contact.source && 
      this.affiliateCriteria.sources.some(affiliateSource => 
        contact.source.toLowerCase().includes(affiliateSource.toLowerCase())
      );

    return hasAffiliateTags || hasAffiliateSource;
  }

  async fetchAllContactsWithFiltering() {
    console.log('🎯 Fetching ALL contacts and filtering for affiliates...');
    console.log(`📋 Affiliate criteria:`);
    console.log(`   🏷️ Tags: ${this.affiliateCriteria.tags.join(', ')}`);
    console.log(`   📍 Sources: ${this.affiliateCriteria.sources.join(', ')}`);
    console.log('');

    let allContacts = [];
    let affiliateContacts = [];
    let page = 1;
    let startAfter = null;
    let startAfterId = null;

    try {
      while (allContacts.length < 2000) { // Safety limit
        console.log(`📥 Page ${page}: Fetching contacts...`);
        
        let url = `${this.config.baseUrl}/contacts/?locationId=${this.config.locationId}&limit=100`;
        
        if (startAfter && startAfterId) {
          url += `&startAfter=${startAfter}&startAfterId=${startAfterId}`;
        }

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
          
          // Filter for affiliates
          const pageAffiliates = data.contacts.filter(contact => this.isAffiliate(contact));
          affiliateContacts.push(...pageAffiliates);
          
          console.log(`   📊 Page results: ${data.contacts.length} total, ${pageAffiliates.length} affiliates`);
          console.log(`   📈 Running totals: ${allContacts.length} total, ${affiliateContacts.length} affiliates`);
          
          // Show affiliate examples
          if (pageAffiliates.length > 0) {
            pageAffiliates.slice(0, 2).forEach(affiliate => {
              console.log(`      ✅ ${affiliate.firstName || ''} ${affiliate.lastName || ''} - Tags: ${JSON.stringify(affiliate.tags || [])} - Source: ${affiliate.source || 'N/A'}`);
            });
          }
          
          // Extract cursor for next page
          if (data.meta && data.meta.startAfter && data.meta.startAfterId) {
            startAfter = data.meta.startAfter;
            startAfterId = data.meta.startAfterId;
          } else {
            console.log(`   ⚠️ No cursor info - stopping`);
            break;
          }
          
          if (data.contacts.length < 100) {
            console.log(`   🏁 Got ${data.contacts.length} < 100 contacts, reached end`);
            break;
          }
        } else {
          console.log(`   ❌ No contacts in response`);
          break;
        }
        
        page++;
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (page > 100) {
          console.log('🛑 Safety break at page 100');
          break;
        }
      }

      console.log(`\\n📊 FILTERING RESULTS:`);
      console.log(`=`.repeat(50));
      console.log(`📞 Total contacts scanned: ${allContacts.length}`);
      console.log(`🎯 Affiliates identified: ${affiliateContacts.length}`);
      console.log(`📊 Affiliate percentage: ${((affiliateContacts.length / allContacts.length) * 100).toFixed(1)}%`);
      
      return affiliateContacts;

    } catch (error) {
      console.error('❌ Error fetching contacts:', error.message);
      throw error;
    }
  }

  async processAffiliates(affiliates) {
    console.log(`\\n🔄 Processing ${affiliates.length} identified affiliates...`);
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    for (const contact of affiliates) {
      processed++;
      
      if (processed % 25 === 0) {
        console.log(`   📊 Progress: ${processed}/${affiliates.length} (${successful} success, ${failed} failed, ${skipped} skipped)`);
      }

      try {
        // Check if already exists
        const { data: existingAffiliate } = await this.serviceRoleClient
          .from('ghl_affiliates')
          .select('id')
          .eq('ghl_contact_id', contact.id)
          .single();

        if (existingAffiliate) {
          skipped++;
          continue;
        }

        // Create GHL affiliate record
        const { error: ghlError } = await this.serviceRoleClient
          .from('ghl_affiliates')
          .insert({
            ghl_contact_id: contact.id,
            first_name: contact.firstName || '',
            last_name: contact.lastName || '',
            email: contact.email || '',
            phone: contact.phone || '',
            contact_source: contact.source || '',
            tags: contact.tags || [],
            raw_data: contact,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (ghlError) {
          console.error(`❌ Failed to insert GHL affiliate:`, ghlError);
          failed++;
          continue;
        }

        // Create affiliate system user
        const affiliateData = {
          email: contact.email || '',
          first_name: contact.firstName || '',
          last_name: contact.lastName || '',
          phone: contact.phone || '',
          primary_source: 'ghl',
          status: 'active',
          ghl_contact_id: contact.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: affiliateError } = await this.serviceRoleClient
          .from('affiliate_system_users')
          .insert(affiliateData);

        if (affiliateError) {
          console.error(`❌ Failed to insert affiliate user:`, affiliateError);
          failed++;
        } else {
          successful++;
        }

      } catch (error) {
        console.error(`❌ Error processing contact ${contact.id}:`, error.message);
        failed++;
      }
    }

    return { successful, failed, skipped, processed };
  }

  async run() {
    console.log('🎯 TARGETED GHL AFFILIATE IMPORT');
    console.log('='.repeat(50));
    console.log('Only importing contacts with affiliate indicators');
    console.log('');
    
    try {
      // Fetch and filter for affiliates
      const affiliates = await this.fetchAllContactsWithFiltering();
      
      if (affiliates.length === 0) {
        console.log('❌ No affiliates found with current criteria');
        return;
      }

      console.log(`\\n🎯 Found ${affiliates.length} affiliates out of all contacts`);
      console.log('This matches your expectation of 300-400 active affiliates!');
      console.log('');

      // Process affiliates
      const results = await this.processAffiliates(affiliates);
      
      // Final database check
      console.log('\\n🔍 Final database state...');
      
      const { count: ghlCount } = await this.serviceRoleClient
        .from('ghl_affiliates')
        .select('*', { count: 'exact', head: true });
        
      const { count: affCount } = await this.serviceRoleClient
        .from('affiliate_system_users')
        .select('*', { count: 'exact', head: true });
      
      console.log(`\\n📊 TARGETED IMPORT RESULTS:`);
      console.log(`=`.repeat(50));
      console.log(`✅ New affiliates imported: ${results.successful}`);
      console.log(`⏭️ Existing affiliates skipped: ${results.skipped}`);
      console.log(`❌ Failed imports: ${results.failed}`);
      console.log(`📊 Total GHL Affiliates: ${ghlCount}`);
      console.log(`📊 Total Affiliate Users: ${affCount}`);
      console.log(`🎯 Target 300-400: ${affCount >= 300 ? '✅ ACHIEVED' : affCount >= 200 ? '🟡 CLOSE' : '⚠️ BELOW TARGET'}`);
      
    } catch (error) {
      console.error('❌ Import failed:', error.message);
    }
  }
}

// Run targeted affiliate import
const importService = new TargetedGHLAffiliateImport();
importService.run().catch(console.error); 