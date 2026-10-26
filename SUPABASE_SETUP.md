# Supabase Setup Guide

This guide will help you set up Supabase for the Tools House React application.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up or log in with your GitHub account
4. Click "New Project"
5. Fill in the project details:
   - **Name**: tools-house (or any name you prefer)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose the region closest to you
6. Click "Create new project"
7. Wait for the project to be created (this may take 1-2 minutes)

## Step 2: Get Your Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: Found under "Project API keys"
   - **anon / public key**: Found under "Project API keys"

⚠️ **IMPORTANT**: Only use the `anon` key in your frontend. NEVER use the `service_role` key in the frontend.

## Step 3: Set Up the Database Schema

1. Go to the **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy the entire content of `supabase/schema.sql` from this project
4. Paste it into the SQL Editor
5. Click "Run" (or press Ctrl+Enter)

This will create:
- All required tables
- Indexes for performance
- Row Level Security (RLS) policies
- Helper functions for balance calculations
- Triggers for automatic timestamp updates

## Step 4: Configure Environment Variables

1. In your project root, create a file named `.env.local`
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

Example:
```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Save the file
4. **NEVER** commit `.env.local` to version control (it's already in `.gitignore`)

## Step 5: Enable Email Authentication (Optional)

By default, Supabase has email authentication enabled. To verify:

1. Go to **Authentication** → **Providers**
2. Make sure "Email" is enabled
3. You can optionally:
   - Enable email confirmation
   - Configure custom email templates
   - Set up email SMTP settings

## Step 6: Create Your First User

There are two ways to create your first admin user:

### Option A: Through the Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click "Add user"
3. Enter email and password
4. Click "Auto Confirm User" (to skip email verification for testing)
5. Click "Create user"

### Option B: Through the Application

1. Start your development server: `npm run dev`
2. Open `http://localhost:3000`
3. Click "Sign Up"
4. Enter your email and password
5. The application will automatically create a profile for you

## Step 7: Verify RLS Policies

After running the schema SQL, all tables should have RLS enabled. To verify:

1. Go to **Database** → **Tables**
2. Click on any table (e.g., `customers`)
3. Go to the **RLS Policies** tab
4. You should see policies like:
   - "Authenticated users can view customers"
   - "Authenticated users can insert customers"
   - etc.

## Step 8: Test the Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`

3. Try to log in with your user credentials

4. If successful, you should see the dashboard

## Troubleshooting

### "Error: Invalid API key"
- Make sure you're using the `anon` key, not the `service_role` key
- Check that the URL is correct (no trailing slashes)

### "Error: Relation does not exist"
- Make sure you ran the schema.sql in the SQL Editor
- Check that all tables were created successfully

### "Error: Row level security policy violation"
- Make sure you're logged in
- Check that RLS policies are enabled and correct
- Verify your user is authenticated

### "Error: Connection refused"
- Check your internet connection
- Verify the Supabase project URL is correct
- Check that Supabase services are running (check status page)

### Authentication Issues
- Check that email provider is enabled in Authentication → Providers
- If using email confirmation, make sure to click the confirmation link
- For testing, use "Auto Confirm User" option

## Security Best Practices

1. **Never commit secrets**: `.env.local` is in `.gitignore` for this reason
2. **Use environment variables**: All sensitive data should be in environment variables
3. **RLS is essential**: All tables have RLS policies - don't disable them
4. **Anon key only**: The frontend should only use the anon/public key
5. **Service role key**: Keep this secret and never use it in frontend code
6. **Regular backups**: Use the built-in backup feature regularly

## Production Deployment

When deploying to production:

1. **GitHub Pages**:
   - Add secrets in GitHub repository settings:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - The GitHub Actions workflow will use these secrets

2. **Other Platforms**:
   - Add the same environment variables to your hosting platform
   - Vercel, Netlify, and others have specific ways to add env vars

3. **Database**:
   - Keep your Supabase project secure
   - Monitor usage in the Supabase dashboard
   - Set up alerts for unusual activity

## Additional Configuration

### Custom Domain (Optional)

If you want to use a custom domain for Supabase:

1. Go to **Settings** → **General**
2. Scroll to "Custom Domain"
3. Follow the instructions to set up your domain

### Database Extensions

The schema uses the `uuid-ossp` extension. It's enabled by default in the schema.sql.

### Storage (Optional)

If you want to add file uploads (e.g., product images):

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket
3. Configure RLS policies for the bucket
4. Update the application to handle file uploads

## Monitoring

Monitor your Supabase project:

1. **Dashboard**: Overview of database usage, API calls, etc.
2. **Database Logs**: View SQL queries and errors
3. **API Logs**: View API requests and responses
4. **Auth Logs**: View authentication events

## Support

If you encounter issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the error messages in the browser console
3. Check the Supabase dashboard logs
4. Make sure all steps in this guide were completed correctly

## Next Steps

After completing this setup:

1. Read the main [README.md](README.md) for application usage
2. Start adding your business data (suppliers, products, customers)
3. Test all features (sales, purchases, reports)
4. Set up regular backups
5. Deploy to production when ready
