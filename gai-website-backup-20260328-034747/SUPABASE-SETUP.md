# Supabase Setup Guide for GAi Connect

This guide will help you set up Supabase for production with multiple users.

## Prerequisites

- A Supabase account (free tier is fine to start)
- Access to your Supabase project

---

## Step 1: Create Supabase Project

1. **Go to:** https://supabase.com
2. **Click:** "Start your project"
3. **Sign up** with GitHub or email
4. **Create new project:**
   - Name: `gai-connect` (or your preference)
   - Database Password: `YourSecurePassword123!` (SAVE THIS!)
   - Region: Choose closest to your users
5. **Wait** for project to be created (~2 minutes)

---

## Step 2: Get Your API Keys

1. Go to **Settings** → **API**
2. Copy the following values:

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
```

---

## Step 3: Configure the Code

1. Open `supabase-client.js` in your project folder
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';  // Your Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';  // Your anon key
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIs...';  // Your service role key
```

---

## Step 4: Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run**

This will create:
- `users` table - User accounts
- `services` table - Service listings
- `messages` table - Private messages
- `memberships` table - Subscription tracking
- `connections` table - User connections
- `audit_log` table - Activity logging

---

## Step 5: Configure Authentication (Optional but Recommended)

1. Go to **Authentication** → **Settings**
2. Configure:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: Add your Netlify/Vercel domain
3. Under **Providers**:
   - Enable **Email** (for password auth)
   - Optionally enable **Google**, **GitHub**, etc.

---

## Step 6: Enable Row Level Security (RLS)

The schema already includes RLS policies, but verify they're active:

1. Go to **Authentication** → **Policies**
2. You should see policies for each table

---

## Step 7: Deploy Your Site

1. Zip your project folder
2. Deploy to Netlify: https://app.netlify.com/drop

---

## Testing Your Setup

### Test Registration
1. Go to your deployed site
2. Click "Create Account"
3. Fill in the form
4. Submit
5. Check Supabase Dashboard → Table Editor → users

### Test Admin Login
1. Go to Login page
2. Click "Admin Login"
3. Enter:
   - Username: `admin`
   - Password: `GAiAdmin2024!`
4. You should see the Admin Control Center

---

## Troubleshooting

### "Supabase not configured" error
- Make sure you updated `supabase-client.js` with your actual keys
- Make sure the file is in the same folder as your HTML files

### "Registration failed" error
- Check Supabase Dashboard for errors
- Verify your email/password meets Supabase requirements
- Check browser console for more details

### Users not saving
- Check Supabase Table Editor to see if data is being saved
- Verify RLS policies aren't blocking inserts

---

## Production Checklist

- [ ] Replace placeholder API keys
- [ ] Run database schema
- [ ] Configure email templates (Authentication → Email Templates)
- [ ] Set up rate limiting (optional)
- [ ] Configure custom domain
- [ ] Enable 2FA for admin account
- [ ] Set up backup policies

---

## File Structure After Setup

```
gai-website/
├── index.html
├── welcome.html
├── dashboard.html
├── auth.html
├── admin.html
├── services.html
├── profile.html
├── messenger.html
├── subscription.html
├── theme.html
├── memory.html
├── tools.html
├── error.html
├── ceo-dashboard.html
├── telegram-login.html
├── telegram-mini-app.html
├── gai-user.js
├── gai-agents.js
├── supabase-client.js ⭐ (NEW)
├── supabase-schema.sql ⭐ (NEW)
├── SUPABASE-SETUP.md ⭐ (NEW)
├── package.json
├── sitemap.xml
├── robots.txt
└── error.html
```

---

## Security Notes

⚠️ **Important:**
- Never commit `SUPABASE_SERVICE_KEY` to version control
- Use environment variables in production
- Enable email verification for new users
- Set up proper RLS policies for sensitive data
- Monitor usage in Supabase Dashboard

---

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.gg/supabase
- GAi Connect Support: Contact your development team
