import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GHLContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, string | number | boolean>;
  dateAdded?: string;
  lastActivity?: string;
  contactSource?: string;
  referredBy?: string;
  referralCode?: string;
}

interface GHLImportRequest {
  apiKey: string;
  locationId: string;
  userId: string;
}

// Affiliate Code Service for consistent code generation
class AffiliateCodeService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  private async checkCodeExists(tableName: string, code: string): Promise<boolean> {
    try {
      const { data } = await this.supabase
        .from(tableName)
        .select('id')
        .eq('referral_code', code)
        .single();
      
      return !!data;
    } catch {
      return false;
    }
  }

  async generateUniqueAffiliateCode(email: string, contactId: string): Promise<string> {
    const baseCode = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 4);
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const suffix = attempts === 0 
        ? Math.random().toString(36).substring(2, 6).toUpperCase()
        : Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const candidateCode = `${baseCode}${suffix}`;

      // Check if this code already exists in any table
      const existsInAffiliate = await this.checkCodeExists('affiliate_system_users', candidateCode);
      const existsInGHL = await this.checkCodeExists('ghl_affiliates', candidateCode);

      if (!existsInAffiliate && !existsInGHL) {
        return candidateCode;
      }

      attempts++;
    }

    // Fallback: use timestamp-based code
    return `GHL${Date.now().toString().slice(-6)}`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the user token
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { apiKey, locationId, userId }: GHLImportRequest = await req.json();

    if (!apiKey || !locationId || !userId) {
      throw new Error('Missing required parameters: apiKey, locationId, userId');
    }

    if (user.id !== userId) {
      throw new Error('User ID mismatch');
    }

    console.log(`🔄 Starting GHL import for user ${userId}, location ${locationId}`);

    // Create import log
    const { data: log, error: logError } = await supabaseClient
      .from('affiliate_import_logs')
      .insert({
        import_source: 'ghl',
        import_type: 'affiliates',
        started_by: userId,
        import_config: {
          locationId,
          timestamp: new Date().toISOString()
        },
        status: 'started'
      })
      .select()
      .single();

    if (logError) throw logError;
    const logId = log.id;

    // Initialize affiliate code service
    const affiliateCodeService = new AffiliateCodeService(supabaseClient);

    // Fetch affiliate contacts from GHL API using targeted tag searches
    const baseUrl = 'https://rest.gohighlevel.com/v1';
    let allContacts: GHLContact[] = [];
    
    // Define affiliate-related tags to search for
    const affiliateTags = ['affiliate', 'partner', 'referrer', 'ambassador', 'influencer'];
    
    console.log(`🎯 Searching for affiliate contacts with tags: ${affiliateTags.join(', ')}`);
    
    // We'll make multiple requests for different affiliate tags to be more targeted
    for (const tag of affiliateTags) {
      console.log(`🏷️ Searching for contacts with tag: "${tag}"`);
      
      let nextUrl: string | null = null;
      // Start with the initial URL for this tag
      let currentUrl = `${baseUrl}/contacts/?locationId=${locationId}&limit=100&tags=${encodeURIComponent(tag)}`;
      let tagPage = 1;
      
      do {
        console.log(`📥 Fetching page ${tagPage} for tag "${tag}"...`);
        
        const response = await fetch(currentUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`GHL API Error for tag "${tag}": ${response.status} ${response.statusText} - ${errorText}`);
          break; // Skip this tag and continue with others
        }

        const responseData = await response.json();
        
        console.log(`🔍 API Response for tag "${tag}":`, {
          contactsCount: responseData.contacts?.length || 0,
          hasNextPageUrl: !!responseData.meta?.nextPageUrl,
        });
        
        if (responseData.contacts && Array.isArray(responseData.contacts) && responseData.contacts.length > 0) {
          // Filter out duplicates based on contact ID
          const newContacts = responseData.contacts.filter((contact: GHLContact) => 
            !allContacts.some(existing => existing.id === contact.id)
          );
          
          allContacts = allContacts.concat(newContacts);
          console.log(`✅ Added ${newContacts.length} new contacts for tag "${tag}" (total: ${allContacts.length})`);
          
          // Use the nextPageUrl directly if available
          nextUrl = responseData.meta?.nextPageUrl || null;
          
          if (nextUrl) {
            currentUrl = nextUrl;
            console.log(`🔄 Next page URL for tag "${tag}": ${nextUrl}`);
          } else {
            console.log(`🏁 No nextPageUrl found for tag "${tag}" - reached end`);
            break;
          }
          
          // If we got less than the limit, we're at the end
          if (responseData.contacts.length < 100) {
            console.log(`🏁 Got ${responseData.contacts.length} < 100 contacts for tag "${tag}", reached end`);
            break;
          }
        } else {
          console.log(`❌ No contacts found for tag "${tag}" - stopping`);
          break;
        }

        tagPage++;
        
        // Rate limiting - be more conservative
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Safety break to prevent infinite loops per tag
        if (tagPage > 20) {
          console.log(`🛑 Safety break at page 20 for tag "${tag}"`);
          break;
        }
        
      } while (nextUrl);
      
      // Rate limiting between different tag searches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Total affiliate contacts fetched: ${allContacts.length}`);
    
    // Additional filtering for any contacts that might have slipped through
    const isAffiliate = (contact: GHLContact): boolean => {
      // Check for affiliate-related tags
      if (contact.tags && Array.isArray(contact.tags)) {
        const hasAffiliateTag = contact.tags.some(tag => 
          affiliateTags.some(affiliateTag => 
            tag.toLowerCase().includes(affiliateTag.toLowerCase())
          )
        );
        if (hasAffiliateTag) return true;
      }
      
      // Check for affiliate-related custom fields
      if (contact.customFields) {
        const customFieldsStr = JSON.stringify(contact.customFields).toLowerCase();
        const hasAffiliateField = affiliateTags.some(tag => customFieldsStr.includes(tag));
        if (hasAffiliateField) return true;
      }
      
      // Include if they have a referral code
      if (contact.referralCode) return true;
      
      return false;
    };

    const finalAffiliateContacts = allContacts.filter(isAffiliate);
    console.log(`🎯 Final filtered affiliate contacts: ${finalAffiliateContacts.length} out of ${allContacts.length} fetched contacts`);
    
    // Use the filtered contacts for processing
    allContacts = finalAffiliateContacts;

    // Process contacts
    let recordsSuccessful = 0;
    let recordsFailed = 0;
    let recordsUpdated = 0;
    const errors: string[] = [];

    for (const contact of allContacts) {
      try {
        // Generate or use existing referral code
        const referralCode = contact.referralCode || 
          await affiliateCodeService.generateUniqueAffiliateCode(contact.email, contact.id);

        // Import into ghl_affiliates table
        const ghlAffiliateData = {
          ghl_contact_id: contact.id,
          email: contact.email,
          first_name: contact.firstName || null,
          last_name: contact.lastName || null,
          phone: contact.phone || null,
          contact_source: contact.contactSource || contact.source || null,
          tags: contact.tags ? JSON.stringify(contact.tags) : null,
          custom_fields: contact.customFields ? JSON.stringify(contact.customFields) : null,
          date_added: contact.dateAdded ? new Date(contact.dateAdded).toISOString() : null,
          last_activity: contact.lastActivity ? new Date(contact.lastActivity).toISOString() : null,
          referred_by_contact_id: contact.referredBy || null,
          referral_code: referralCode,
          status: 'active',
          raw_data: JSON.stringify(contact),
          last_synced: new Date().toISOString(),
          sync_status: 'synced'
        };

        const { error: ghlError } = await supabaseClient
          .from('ghl_affiliates')
          .upsert([ghlAffiliateData], { onConflict: 'ghl_contact_id' });

        if (ghlError) {
          errors.push(`GHL table - Contact ${contact.id}: ${ghlError.message}`);
          recordsFailed++;
          continue;
        }

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
          last_active: contact.lastActivity ? new Date(contact.lastActivity).toISOString() : null,
          custom_fields: contact.customFields ? JSON.stringify(contact.customFields) : null
        };

        const { error: affiliateError } = await supabaseClient
          .from('affiliate_system_users')
          .upsert([affiliateData], { 
            onConflict: 'email',
            ignoreDuplicates: false 
          });

        if (affiliateError) {
          errors.push(`Affiliate system - Contact ${contact.id}: ${affiliateError.message}`);
          recordsFailed++;
        } else {
          recordsSuccessful++;
        }

      } catch (error) {
        errors.push(`Contact ${contact.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        recordsFailed++;
      }
    }

    // Update import log
    const success = recordsFailed === 0;
    await supabaseClient
      .from('affiliate_import_logs')
      .update({
        status: success ? 'completed' : (recordsSuccessful > 0 ? 'partial' : 'failed'),
        completed_at: new Date().toISOString(),
        records_processed: allContacts.length,
        records_successful: recordsSuccessful,
        records_failed: recordsFailed,
        records_updated: recordsUpdated,
        error_details: errors.length > 0 ? { errors } : undefined
      })
      .eq('id', logId);

    console.log(`✅ Import completed: ${recordsSuccessful} successful, ${recordsFailed} failed`);

    return new Response(
      JSON.stringify({
        success,
        recordsProcessed: allContacts.length,
        recordsSuccessful,
        recordsFailed,
        recordsUpdated,
        errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in GHL import:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        recordsUpdated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 