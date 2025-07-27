# Fix Vercel Environment Variables

## Problem
Your app is showing `https://placeholder.supabase.co/auth/v1/user` error because Vercel doesn't have the correct environment variables set.

## Solution: Set Environment Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Find your project**: `the-military-gift-shop` (or whatever your project is named)
3. **Go to Settings** → **Environment Variables**
4. **Add these variables**:

```bash
VITE_SUPABASE_URL=https://<YOUR_PROJECT_ID>.supabase.co
VITE_SUPABASE_ANON_KEY=<YOUR_JWT_TOKEN>
VITE_SUPABASE_SERVICE_ROLE_KEY=<YOUR_JWT_TOKEN>
VITE_GOAFFPRO_ACCESS_TOKEN=<YOUR_GOAFFPRO_ACCESS_TOKEN>
VITE_GOAFFPRO_PUBLIC_TOKEN=<YOUR_GOAFFPRO_PUBLIC_TOKEN>
VITE_GHL_API_KEY=<YOUR_JWT_TOKEN>
VITE_GHL_LOCATION_ID=<YOUR_GHL_LOCATION_ID>
VITE_MIGHTY_NETWORKS_ZAPIER=<YOUR_MIGHTY_NETWORKS_ZAPIER>
```

5. **Set Environment** to `Production, Preview, and Development`
6. **Click "Save"**
7. **Redeploy your app** (Vercel → Deployments → Redeploy latest)

### Method 2: Vercel CLI (Alternative)

If you have Vercel CLI installed:

```bash
# Set each environment variable
vercel env add VITE_SUPABASE_URL
# Enter: https://<YOUR_PROJECT_ID>.supabase.co
# Select: Production, Preview, Development

vercel env add VITE_SUPABASE_ANON_KEY
# Enter the anon key...

# Repeat for all variables above
```

### Method 3: Environment File (Quick)

1. **Create `.env.production`** in your project root:

```bash
VITE_SUPABASE_URL=https://<YOUR_PROJECT_ID>.supabase.co
VITE_SUPABASE_ANON_KEY=<YOUR_JWT_TOKEN>
VITE_SUPABASE_SERVICE_ROLE_KEY=<YOUR_JWT_TOKEN>
VITE_GOAFFPRO_ACCESS_TOKEN=<YOUR_GOAFFPRO_ACCESS_TOKEN>
VITE_GOAFFPRO_PUBLIC_TOKEN=<YOUR_GOAFFPRO_PUBLIC_TOKEN>
VITE_GHL_API_KEY=<YOUR_JWT_TOKEN>
VITE_GHL_LOCATION_ID=<YOUR_GHL_LOCATION_ID>
VITE_MIGHTY_NETWORKS_ZAPIER=<YOUR_MIGHTY_NETWORKS_ZAPIER>
```

2. **Push to git and redeploy**

## After Setting Environment Variables

1. **Redeploy on Vercel** (this is crucial!)
2. **Test the password reset flow**:
   - Go to https://themilitarygiftshop.com/forgot-password
   - Enter your email
   - Check for reset email
   - Click the reset link
   - Should go to `/reset-password` page now

## Verification

After redeployment, check the browser console. You should see:
- ✅ No more `placeholder.supabase.co` errors
- ✅ Proper Supabase URL: `https://<YOUR_PROJECT_ID>.supabase.co`
- ✅ Password reset flow working

## Why This Happened

- Vite apps need environment variables prefixed with `VITE_`
- Vercel needs these variables set in its dashboard/CLI
- Without them, the app falls back to placeholder values
- The `placeholder.supabase.co` indicates missing `VITE_SUPABASE_URL`

## Next Steps

Once environment variables are set and redeployed:

1. **Test password reset flow end-to-end**
2. **Update Supabase email template redirect URL** (if needed)
3. **Verify all other functionality works** 