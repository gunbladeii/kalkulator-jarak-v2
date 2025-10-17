# 🚀 Deployment Guide - Kalkulator Jarak v2

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup
Pastikan semua environment variables dah ready:

```bash
# .env.local (local development)
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Check
- ✅ Supabase database dengan 10,241+ school records
- ✅ Proper RLS (Row Level Security) policies
- ✅ Public read access untuk sekolah table

### 3. Build Test
```bash
npm run build
```

---

## 🌟 OPTION 1: VERCEL DEPLOYMENT (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy Project
```bash
# From project root directory
vercel

# Follow prompts:
# - Set up and deploy? [Y/n] Y
# - Which scope? (Choose your account)
# - Link to existing project? [y/N] N
# - What's your project's name? kalkulator-jarak-v2
# - In which directory is your code located? ./
```

### Step 4: Set Environment Variables
```bash
# Set each environment variable
vercel env add GOOGLE_MAPS_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# For production, preview, and development
```

### Step 5: Deploy Production
```bash
vercel --prod
```

**Result**: Your app will be available at `https://kalkulator-jarak-v2.vercel.app`

---

## 🔥 OPTION 2: NETLIFY DEPLOYMENT

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Build Project
```bash
npm run build
```

### Step 3: Login & Deploy
```bash
netlify login
netlify deploy --prod --dir=.next
```

### Step 4: Set Environment Variables
Go to Netlify Dashboard → Site Settings → Environment Variables:
- `GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🏗️ OPTION 3: GITHUB + VERCEL AUTO-DEPLOY

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### Step 2: Connect Vercel to GitHub
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub
4. Select your repository
5. Configure environment variables
6. Deploy!

**Auto-deployment**: Every push to main branch akan auto-deploy! 🎉

---

## 🔧 PRODUCTION OPTIMIZATIONS

### 1. Google Maps API Security
```javascript
// Restrict API key to your domain only
// Google Cloud Console → APIs & Services → Credentials
// Add your production domain: https://your-app.vercel.app/*
```

### 2. Supabase RLS Policies
```sql
-- Ensure read-only access for public
CREATE POLICY "Public read access" ON sekolah
FOR SELECT USING (true);
```

### 3. Performance Optimization
```javascript
// next.config.ts - Add compression
module.exports = {
  compress: true,
  poweredByHeader: false,
  generateEtags: false
}
```

### 4. Error Monitoring (Optional)
```bash
npm install @sentry/nextjs
```

---

## 📊 MONITORING & MAINTENANCE

### 1. Usage Analytics
- Monitor API usage via Vercel Analytics
- Track Google Maps API quota
- Supabase usage monitoring

### 2. Performance Monitoring
```bash
# Lighthouse scoring
npm install -g lighthouse
lighthouse https://your-app.vercel.app
```

### 3. Cost Management
- Google Maps: Monitor monthly usage
- Supabase: Check database usage
- Vercel: Function execution time

---

## 🔐 SECURITY CHECKLIST

- ✅ Environment variables properly set
- ✅ API keys restricted to your domain
- ✅ Supabase RLS policies active
- ✅ HTTPS enabled (automatic with Vercel)
- ✅ No sensitive data in client-side code

---

## 🚀 CUSTOM DOMAIN (Optional)

### Vercel Custom Domain
1. Domain Settings → Add Domain
2. Add CNAME record: `your-domain.com → cname.vercel-dns.com`
3. SSL automatically configured

### Example: 
`kalkulator-jarak.your-domain.com` → Production Ready! 🎉

---

## 📞 SUPPORT & UPDATES

### Deployment Updates
```bash
# Update production
git push origin main  # (if auto-deploy enabled)
# OR
vercel --prod
```

### Database Updates
- Supabase: Direct SQL updates via dashboard
- New school data: CSV import via Supabase

### Feature Updates
- Code changes → Git push → Auto-deploy
- Zero downtime deployments

---

## 🎯 FINAL PRODUCTION URL

After successful deployment:
```
🌍 Production: https://kalkulator-jarak-v2.vercel.app
📊 Analytics: Vercel Dashboard
🔧 Management: Vercel Project Settings
```

**Your distance calculator is now LIVE and accessible worldwide!** 🌟