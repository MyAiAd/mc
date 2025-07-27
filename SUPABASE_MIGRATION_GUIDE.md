# 🚀 Complete Supabase Migration Guide

## Overview
This guide will help you migrate your **existing remote Supabase database** to a **new remote Supabase database** for the MC project with:
- Complete schema and data migration
- RLS policies preservation
- Super admin user creation (sage@myai.ad)
- Old user cleanup after verification

## 📋 Prerequisites

1. **Access to existing remote Supabase project** (the working one) ✅ **COMPLETED**
2. **PostgreSQL client** (`psql` command available) - ✅ **Verified available**
3. **Node.js** installed for running scripts - ✅ **Verified available**
4. **Supabase account** to create new project
5. **Service role key** from existing project (for admin access) ✅ **USED**

## 🔄 Migration Process

### **✅ Phase 1: COMPLETED - Export from Existing Remote Database**

#### ✅ Step 1: Connection Test - COMPLETED
- **Status**: ✅ **SUCCESSFUL**
- **Users Found**: 6 users
- **Tables Found**: 7 tables with data
- **Total Rows**: 18 rows exported

#### ✅ Step 2: Database Export - COMPLETED
- **Status**: ✅ **SUCCESSFUL**
- **Method**: API-based export (no direct PostgreSQL connection required)
- **Files Created**:
  - `mc_users_export.json` - 6 users exported
  - `mc_data_export.json` - 18 rows across 7 tables
  - `mc_schema_export.sql` - Database schema
  - `MC_MIGRATION_INSTRUCTIONS.md` - Migration summary

#### 📊 Export Summary
- **Users**: 6 (including sage@myai.ad)
- **Tables with Data**: 
  - `users`: 1 row
  - `commission_plans`: 8 rows
  - `goaffpro_orders`: 8 rows
  - `rag_documents`: 1 row
- **Empty Tables**: `affiliates`, `shopify_products`, `shopify_orders`

### **🚀 Phase 2: NEXT STEP - Create New Remote Supabase Project**

#### Step 3: Create New Remote Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `MC Affiliate Platform`
   - **Database Password**: `T3sla12e!`
   - **Region**: Choose closest to your users
4. Wait for project to be ready (2-3 minutes)

#### Step 4: Get New Remote Project Credentials
From your new **remote** project dashboard:
1. Note the **Project ID** from the URL
2. Go to **Settings** → **API**
3. Copy:
   - **Project URL** (anon public)
   - **anon public** key
   - **service_role** secret key

### **📥 Phase 3: Import to New Remote Database**

#### Step 5: Update Setup Script
Edit `setup-new-supabase-api.js` and replace:
```javascript
const NEW_SUPABASE_URL = 'https://your-new-project-id.supabase.co';
const NEW_SERVICE_ROLE_KEY = 'your-new-service-role-key';
```

#### Step 6: Import to Remote Database
```bash
node setup-new-supabase-api.js
```

This connects to your **remote** new database and:
- Creates super admin user (sage@myai.ad)
- Imports all exported data
- Generates `.env.mc` with new credentials
- Verifies the setup

### **🔧 Phase 4: Configure Application**

#### Step 7: Update Environment Variables
1. Copy your **anon key** from new Supabase dashboard
2. Edit `.env.mc` and replace `your-new-anon-key-from-supabase-dashboard`
3. Add your other API keys:
   - GoAffPro tokens
   - GHL API key and location ID
   - Mighty Networks Zapier key
   - Shopify access token

#### Step 8: Test Application
1. Copy `.env.mc` to `.env`:
   ```bash
   cp .env.mc .env
   ```
2. Start your application:
   ```bash
   npm run dev
   ```
3. Test login with:
   - **Email**: `sage@myai.ad`
   - **Password**: `T3sla12e!`

### **🧹 Phase 5: Verification & Cleanup**

#### Step 9: Verify Everything Works
Test all major features:
- [ ] Login/logout functionality
- [ ] User dashboard loads
- [ ] Affiliate data displays correctly
- [ ] Import functions work
- [ ] All integrations connect
- [ ] Database queries execute properly

#### Step 10: Clean Up Old Users (Optional)
Once you've verified everything works:

1. Edit `cleanup-old-users.js` and update credentials:
   ```javascript
   const NEW_SUPABASE_URL = 'https://your-new-project-id.supabase.co';
   const NEW_SERVICE_ROLE_KEY = 'your-new-service-role-key';
   ```

2. Review users to be deleted:
   ```bash
   node cleanup-old-users.js
   ```

3. If you want to proceed with deletion, edit the script:
   ```javascript
   const CONFIRM_DELETE = true; // Change from false to true
   ```

4. Run cleanup again:
   ```bash
   node cleanup-old-users.js
   ```

## 🔧 Troubleshooting

### Common Issues

#### Connection Test Fails
- **Issue**: Cannot connect to existing remote database
- **Solution**: 
  - Verify project URL and service role key
  - Check if existing project is active
  - Ensure you have admin access

#### Schema Import Errors
- **Issue**: Some tables already exist
- **Solution**: This is normal for Supabase built-in tables, continue with data import

#### Data Import Errors
- **Issue**: Foreign key constraint violations
- **Solution**: Check if schema import completed successfully first

#### User Creation Fails
- **Issue**: User already exists
- **Solution**: Check if user was created in a previous run

#### Connection Errors
- **Issue**: Can't connect to database
- **Solution**: Verify database password and project ID are correct

### Verification Checklist

Before considering migration complete:

- [x] **Connection Test**: Can connect to existing remote database ✅ **COMPLETED**
- [x] **Export Success**: All files created successfully ✅ **COMPLETED**
- [ ] **New Project**: New remote database created
- [ ] **Import Success**: Schema and data imported
- [ ] **Super Admin**: Can login with sage@myai.ad
- [ ] **Data Integrity**: All affiliate data is present
- [ ] **RLS Policies**: Security policies are working
- [ ] **API Integrations**: All external APIs connect
- [ ] **User Permissions**: Correct access levels
- [ ] **Performance**: Queries execute at expected speed

## 📁 Files Created

After migration, you'll have:
- `mc_users_export.json` - Original users backup ✅ **CREATED**
- `mc_data_export.json` - Original data backup ✅ **CREATED**
- `mc_schema_export.sql` - Original schema backup ✅ **CREATED**
- `MC_MIGRATION_INSTRUCTIONS.md` - Migration summary ✅ **CREATED**
- `.env.mc` - New environment configuration (will be created)
- `user_cleanup_report.json` - Cleanup report (if run)

## 🔒 Security Notes

1. **Credentials**: All scripts use placeholder credentials - update before running
2. **Service Role Key**: Use service role key (not anon key) for admin operations
3. **Backups**: Keep exports as backups of your original database
4. **Testing**: Always test thoroughly before removing old users
5. **Super Admin**: sage@myai.ad has full access - protect this account
6. **API Keys**: Update all API keys in environment files

## 🎯 Success Criteria

Migration is successful when:
- ✅ Can connect to existing remote database ✅ **COMPLETED**
- ✅ Export completes without errors ✅ **COMPLETED**
- [ ] New remote database contains all original data
- [ ] Super admin can login and access all features
- [ ] All integrations work correctly
- [ ] RLS policies protect data appropriately
- [ ] Application performs as expected
- [ ] Old users cleaned up (if desired)

## 📞 Support

If you encounter issues:
1. Run `node test-remote-connection.js` first to verify connectivity
2. Check the troubleshooting section above
3. Verify all credentials are correct
4. Ensure PostgreSQL client is installed
5. Check Supabase project status in dashboard
6. Review console logs for specific error messages

---

**⚠️ Important**: 
- This process works with **remote Supabase databases**, not local ones
- Always keep backups of your original database until you're 100% confident the migration is successful
- Use **service role keys** for admin operations, not anon keys

## 🎉 **CURRENT STATUS: READY FOR NEW PROJECT CREATION**

**✅ COMPLETED:**
- Connection test to existing database
- Export of all data and users
- Migration tools prepared

**🚀 NEXT STEP:**
Create your new Supabase project and proceed with the import! 