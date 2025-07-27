# 🚀 Complete Supabase Migration Guide

## Overview
This guide will help you migrate your existing Supabase database to a new MC project database with:
- Complete schema and data migration
- RLS policies preservation
- Super admin user creation (sage@myai.ad)
- Old user cleanup after verification

## 📋 Prerequisites

1. **Access to existing Supabase project** (the working one)
2. **PostgreSQL client** (`psql` command available)
3. **Node.js** installed for running scripts
4. **Supabase account** to create new project

## 🔄 Migration Process

### **Phase 1: Export Existing Database**

#### Step 1: Get Existing Database Credentials
From your existing Supabase project dashboard:
1. Go to **Settings** → **Database**
2. Note down:
   - Project ID (from URL: `https://PROJECT_ID.supabase.co`)
   - Database password
3. Go to **Settings** → **API**
4. Copy your **service_role** key

#### Step 2: Update Export Script
Edit `export-existing-supabase.js` and replace:
```javascript
const EXISTING_SUPABASE_URL = 'https://your-existing-project-id.supabase.co';
const EXISTING_SERVICE_ROLE_KEY = 'your-existing-service-role-key';
const EXISTING_DB_PASSWORD = 'your-existing-db-password';
const EXISTING_PROJECT_ID = 'your-existing-project-id';
```

#### Step 3: Run Export
```bash
node export-existing-supabase.js
```

This creates:
- `mc_schema_export.sql` - Database schema
- `mc_data_export.sql` - Application data
- `mc_rls_export.sql` - RLS policies
- `mc_users_export.json` - User list
- `MC_MIGRATION_INSTRUCTIONS.md` - Instructions

### **Phase 2: Create New Supabase Project**

#### Step 4: Create New Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `MC Affiliate Platform`
   - **Database Password**: `T3sla12e!`
   - **Region**: Choose closest to your users
4. Wait for project to be ready (2-3 minutes)

#### Step 5: Get New Project Credentials
From your new project dashboard:
1. Note the **Project ID** from the URL
2. Go to **Settings** → **API**
3. Copy:
   - **Project URL** (anon public)
   - **anon public** key
   - **service_role** secret key

### **Phase 3: Import to New Database**

#### Step 6: Update Setup Script
Edit `setup-new-supabase.js` and replace:
```javascript
const NEW_SUPABASE_URL = 'https://your-new-project-id.supabase.co';
const NEW_SERVICE_ROLE_KEY = 'your-new-service-role-key';
const NEW_PROJECT_ID = 'your-new-project-id';
```

#### Step 7: Run Database Setup
```bash
node setup-new-supabase.js
```

This will:
- Import database schema
- Import all data (excluding auth tables)
- Create super admin user (sage@myai.ad)
- Generate `.env.mc` with new credentials
- Verify the setup

### **Phase 4: Configure Application**

#### Step 8: Update Environment Variables
1. Copy your **anon key** from Supabase dashboard
2. Edit `.env.mc` and replace `your-new-anon-key-from-supabase-dashboard`
3. Add your other API keys:
   - GoAffPro tokens
   - GHL API key and location ID
   - Mighty Networks Zapier key
   - Shopify access token

#### Step 9: Test Application
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

### **Phase 5: Verification & Cleanup**

#### Step 10: Verify Everything Works
Test all major features:
- [ ] Login/logout functionality
- [ ] User dashboard loads
- [ ] Affiliate data displays correctly
- [ ] Import functions work
- [ ] All integrations connect
- [ ] Database queries execute properly

#### Step 11: Clean Up Old Users (Optional)
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

- [ ] **Database Connection**: App connects to new database
- [ ] **Authentication**: Can login with sage@myai.ad
- [ ] **Data Integrity**: All affiliate data is present
- [ ] **RLS Policies**: Security policies are working
- [ ] **API Integrations**: All external APIs connect
- [ ] **User Permissions**: Correct access levels
- [ ] **Performance**: Queries execute at expected speed

## 📁 Files Created

After migration, you'll have:
- `mc_schema_export.sql` - Original schema backup
- `mc_data_export.sql` - Original data backup
- `mc_rls_export.sql` - RLS policies backup
- `mc_users_export.json` - Original users list
- `.env.mc` - New environment configuration
- `user_cleanup_report.json` - Cleanup report (if run)

## 🔒 Security Notes

1. **Credentials**: All scripts use placeholder credentials - update before running
2. **Backups**: Keep exports as backups of your original database
3. **Testing**: Always test thoroughly before removing old users
4. **Super Admin**: sage@myai.ad has full access - protect this account
5. **API Keys**: Update all API keys in environment files

## 🎯 Success Criteria

Migration is successful when:
- ✅ New database contains all original data
- ✅ Super admin can login and access all features
- ✅ All integrations work correctly
- ✅ RLS policies protect data appropriately
- ✅ Application performs as expected
- ✅ Old users cleaned up (if desired)

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all credentials are correct
3. Ensure PostgreSQL client is installed
4. Check Supabase project status in dashboard
5. Review console logs for specific error messages

---

**⚠️ Important**: Always keep backups of your original database until you're 100% confident the migration is successful! 