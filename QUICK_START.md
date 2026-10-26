# Quick Start Guide

Get Tools House React up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project creation (1-2 minutes)
3. Go to Settings → API and copy:
   - Project URL
   - anon/public key

## Step 3: Run Database Schema

1. In Supabase, go to SQL Editor
2. Copy the content of `supabase/schema.sql`
3. Paste and run it

## Step 4: Configure Environment

Create `.env.local`:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

## Step 5: Run the App

```bash
npm run dev
```

Open `http://localhost:3000`

## Step 6: Create Your Account

1. Click "Sign Up"
2. Enter email and password
3. Log in

You're ready to go! Start adding:
- Suppliers
- Products
- Customers
- Sales

## Need Help?

- Full documentation: [README.md](README.md)
- Supabase setup: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
