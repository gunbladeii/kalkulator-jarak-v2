# 🚀 PANDUAN DEPLOY MANUAL - VERCEL DASHBOARD

## 🎯 PROJECT SUDAH SUCCESSFULLY LINKED!
✅ **Vercel Project**: kalkulator-jarak-v2  
✅ **Project URL**: https://vercel.com/gunbladeiis-projects/kalkulator-jarak-v2

---

## ⚠️ DIPERLUKAN: SET ENVIRONMENT VARIABLES

### Step 1: Buka Vercel Dashboard
🔗 https://vercel.com/gunbladeiis-projects/kalkulator-jarak-v2/settings/environment-variables

### Step 2: Add 3 Environment Variables

#### Variable 1: GOOGLE_MAPS_API_KEY
```
Name: GOOGLE_MAPS_API_KEY
Value: [YOUR_ACTUAL_GOOGLE_MAPS_API_KEY]
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 2: NEXT_PUBLIC_SUPABASE_URL  
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [YOUR_SUPABASE_PROJECT_URL]
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 3: NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
Value: [YOUR_SUPABASE_ANON_KEY]
Environments: ✅ Production ✅ Preview ✅ Development
```

---

## 🔑 CARA DAPATKAN KEYS

### Google Maps API Key:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create new API Key OR use existing
3. Enable: Directions API, Distance Matrix API, Places API
4. Copy the API key

### Supabase Keys:
1. Go to: https://app.supabase.com/project/[your-project]/settings/api
2. Copy "Project URL" untuk NEXT_PUBLIC_SUPABASE_URL
3. Copy "anon public" key untuk NEXT_PUBLIC_SUPABASE_ANON_KEY

---

## 🚀 REDEPLOY AFTER SETTING ENV

### Option 1: Via Vercel Dashboard
1. Go to Deployments tab
2. Click "Redeploy" on latest deployment  
3. ✅ Use existing Build Cache: NO (unchecked)
4. Click "Redeploy"

### Option 2: Via CLI (if env set)
```bash
vercel --prod
```

---

## 🎉 EXPECTED RESULT

After successful deployment:
```
✅ Production: https://kalkulator-jarak-v2-[hash].vercel.app
📊 All APIs working
🗺️ Google Maps integration active  
💾 Supabase database connected
🧠 Route optimization functional
```

---

## ⚡ QUICK LINKS

- 🔧 **Project Settings**: https://vercel.com/gunbladeiis-projects/kalkulator-jarak-v2/settings
- 🌍 **Environment Variables**: https://vercel.com/gunbladeiis-projects/kalkulator-jarak-v2/settings/environment-variables  
- 📊 **Deployments**: https://vercel.com/gunbladeiis-projects/kalkulator-jarak-v2
- 📈 **Analytics**: https://vercel.com/gunbladeiis-projects/kalkulator-jarak-v2/analytics

---

## 🔧 TROUBLESHOOTING

### Build Failed "supabaseUrl is required"
❌ Problem: Environment variables not set
✅ Solution: Set all 3 env vars in Vercel dashboard

### Build Failed "Invalid API Key"  
❌ Problem: Google Maps API key invalid/restricted
✅ Solution: Check API key restrictions & enable required APIs

### 500 Error on deployed site
❌ Problem: Database connection or API limits
✅ Solution: Check Supabase status & Google Maps quota

---

## 🎯 FINAL STEP

Ko perlu **manually set environment variables** via Vercel dashboard, then **redeploy**. 
Lepas tu your app akan fully functional online! 🚀✨