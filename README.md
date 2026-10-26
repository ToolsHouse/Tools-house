# Tools House - React + Supabase Inventory System

A modern, full-featured inventory and accounting system for hardware/tools shops, built with React, Vite, Tailwind CSS, and Supabase.

## 🚀 Features

- **Dashboard**: Real-time overview of sales, inventory, and financial metrics
- **Products Management**: Complete CRUD operations with stock tracking and low-stock alerts
- **Customers Management**: Customer accounts, balance tracking, and detailed statements
- **Sales & Invoices**: Professional invoice creation with automatic stock updates
- **Suppliers Management**: Supplier accounts and balance tracking
- **Purchases**: Purchase invoices with automatic stock updates
- **Expenses Tracking**: Record and categorize business expenses
- **Comprehensive Reports**: Daily reports, sales reports, profit analysis
- **WhatsApp Integration**: Send professional Arabic invoice messages via WhatsApp
- **Backup & Restore**: Export and import complete system backups
- **Arabic RTL Interface**: Full Arabic language support with right-to-left layout
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Secure Authentication**: Supabase Auth with Row Level Security (RLS)

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Routing**: React Router
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📋 Prerequisites

- Node.js 18 or higher
- A Supabase account (free tier works)
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/tools-house-react.git
   cd tools-house-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   **Step 1: Create a Supabase project (if not already done)**
   
   a. Go to [supabase.com](https://supabase.com)
   b. Sign up or log in with your GitHub account
   c. Click "New Project"
   d. Fill in project details (name, database password, region)
   e. Wait for the project to be created (1-2 minutes)

   **Step 2: Get your Supabase credentials**
   
   a. Go to **Settings** → **API**
   b. Copy the **Project URL**
   c. Copy the **anon / public key** (NOT the service_role key)

   **Step 3: Run the database setup script**
   
   a. Go to the **SQL Editor** in your Supabase dashboard
   b. Click "New Query"
   c. Copy the entire content of `supabase/setup.sql`
   d. Paste it into the SQL Editor
   e. Click "Run" (or press Ctrl+Enter)
   
   This single script creates:
   - All tables (profiles, customers, suppliers, products, sales, etc.)
   - All indexes for performance
   - All Row Level Security (RLS) policies
   - All database functions (balance calculations, stock management)
   - All triggers (automatic stock updates, timestamps)
   
   **Important:** The script is idempotent - safe to rerun without deleting data.

   **Step 4: Create the 5 Auth users via Supabase Dashboard**
   
   ⚠️ **IMPORTANT:** Auth users must be created via the Dashboard for security reasons. Do NOT use SQL.
   
   a. Go to **Authentication** → **Users**
   b. For each user, click "Add user" and enter:
   
   | Username | Email | Password | Metadata |
   |----------|-------|---------|----------|
   | memo | memo@toolshouse.local | 122000 | username: memo |
   | wahba | wahba@toolshouse.local | 414243 | username: wahba |
   | mohamed | mohamed@toolshouse.local | 115599 | username: mohamed |
   | fahmi | fahmi@toolshouse.local | 121314 | username: fahmi |
   | yousef | yousef@toolshouse.local | 454647 | username: yousef |
   
   c. For each user:
      - Email: `username@toolshouse.local`
      - Password: (from table above)
      - ✅ Click "Auto Confirm User" (required!)
      - Add user metadata:
        - Key: `username`
        - Value: the username
      - Click "Create user"
   
   **Step 5: Link profiles to Auth users**
   
   The `setup.sql` script includes profile setup queries at the end. After creating the 5 Auth users in Step 4:
   
   a. Go to **SQL Editor**
   b. Run the profile setup queries from Part 7 of `supabase/setup.sql`
   c. Run the verification query from Part 8 to confirm
   
   Alternatively, you can re-run the entire `setup.sql` script - it's safe to rerun.

4. **Configure environment variables**

   a. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

   b. Add your Supabase credentials to `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   ⚠️ **IMPORTANT**: 
   - Replace the placeholder values with your actual Supabase credentials
   - Use the `anon` key, NOT the `service_role` key
   - Never commit `.env.local` to version control

5. **Run the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000` (or the next available port if 3000 is in use)

6. **Log in**
   - Open the application in your browser
   - Enter your username (e.g., `memo`)
   - Enter your password (e.g., `122000`)
   - Click "تسجيل الدخول" (Login)
   - You should be redirected to the dashboard

## 🗄️ Database Schema

The application uses the following tables:

- **profiles**: User profiles linked to Supabase Auth (includes username)
- **customers**: Customer information and balances
- **suppliers**: Supplier information and balances
- **products**: Product inventory with pricing and stock levels
- **sales**: Sales invoices
- **sale_items**: Individual items in sales
- **customer_payments**: Customer payment records
- **purchases**: Purchase invoices
- **purchase_items**: Individual items in purchases
- **supplier_payments**: Supplier payment records
- **expenses**: Business expenses
- **cash_transactions**: Cash flow tracking
- **stock_movements**: Stock movement history for tracking inventory changes

### Key Relationships

- Customer → Sales → Sale Items → Products
- Supplier → Purchases → Purchase Items → Products
- Customer → Customer Payments
- Supplier → Supplier Payments
- Products → Stock Movements (tracks all inventory changes)

### Automatic Stock Management

The application uses PostgreSQL database triggers to automatically manage stock:

- **Sales**: When a sale item is added, stock is automatically decreased
- **Purchases**: When a purchase item is added, stock is automatically increased
- **Stock Movements**: All stock changes are recorded in the `stock_movements` table
- **Transaction Safety**: Stock updates are atomic and consistent

This ensures:
- Stock levels are always accurate
- No race conditions or manual updates needed
- Complete audit trail of all inventory changes
- Database-level integrity guarantees

### Balance Calculations

**Customer Balance:**
```
Opening Balance + Total Sales Due - Total Payments = Current Balance
```

**Supplier Balance:**
```
Opening Balance + Total Purchases Due - Total Payments = Current Balance
```

## 🔐 Security

### Authentication System

**IMPORTANT:** This application uses **static frontend-only authentication** for demonstration purposes.

**How it works:**
- Login credentials are hardcoded in the frontend code
- Authentication only protects the React application UI
- It does NOT protect the Supabase database directly
- Anyone with the Supabase anon key can access the database via API
- This is NOT secure for production use

**Supported accounts:**
- memo / 122000
- wahba / 414243
- mohamed / 115599
- fahmi / 121314
- yousef / 454647

**Session Management:**
- Sessions are stored in localStorage
- Logout clears the session and redirects to login
- Protected routes redirect unauthenticated users to login

**Database Security:**
- The Supabase database uses Row Level Security (RLS) policies
- RLS policies require `auth.role() = 'authenticated'` for database access
- Since this app uses static auth (not Supabase Auth), RLS may block database operations
- To fix this, either:
  1. Create real Supabase Auth users and switch to Supabase Auth
  2. Disable RLS policies (not recommended for production)
  3. Modify RLS policies to allow anonymous access (not recommended for production)

**For Production:**
- Use real Supabase Auth with proper user management
- Implement proper session management via Supabase Auth
- Keep RLS policies enabled
- Never use hardcoded credentials
- Use environment variables for sensitive data

### Row Level Security (RLS)

All database tables are protected with Row Level Security policies:

- Only authenticated users can read/write data
- Users can only access their own profile
- All business operations require authentication
- No public access to sensitive data

### Important Security Notes

- ❌ NEVER commit `.env.local` to version control
- ❌ NEVER use service-role keys in the frontend
- ✅ Only use the anon/publishable key in the frontend
- ✅ All sensitive operations are protected by RLS
- ✅ Authentication is required for all business operations

## 📱 Usage

### First Time Setup

1. Run the development server: `npm run dev`
2. Open `http://localhost:3000` in your browser
3. Log in with one of the configured usernames:
   - memo / 122000
   - wahba / 414243
   - mohamed / 115599
   - fahmi / 121314
   - yousef / 454647
4. Start adding suppliers, products, and customers

### Daily Workflow

1. **Add Products**: Add your inventory with purchase prices and selling prices
2. **Add Customers**: Register your customers
3. **Create Sales**: Create sales invoices
   - Select customer (or cash sale)
   - Add products and quantities
   - Set payment amount
   - Stock is automatically updated
4. **Send Invoices**: Use WhatsApp to send invoice details to customers
5. **Record Payments**: Collect payments from customers
6. **View Reports**: Check daily reports and profit analysis

### Backup & Restore

**Backup:**
1. Go to Settings → Backup & Restore
2. Click "Export Backup"
3. Save the JSON file

**Restore:**
1. Go to Settings → Backup & Restore
2. Select a backup JSON file
3. Review the preview
4. Click "Restore Backup"
5. Data will be merged with existing data

## 🐳 WhatsApp Integration

The application generates professional Arabic invoice messages for WhatsApp:

- Formats Egyptian phone numbers automatically (010/011/012/015 → +20)
- Creates detailed invoice with products, quantities, and prices
- Shows payment status (paid/partial/due)
- Opens WhatsApp web/app with pre-filled message
- User manually attaches and sends

**No WhatsApp API required** - uses wa.me deep links.

## 📊 Reports

### Daily Report

Shows comprehensive daily financial data:
- Total sales value
- Cash collected (from sales + payments)
- New credit sales
- Old debt payments
- Expenses
- Number of invoices
- Quantity sold
- Cost of goods sold
- Gross profit
- Net profit

Date range options:
- Today
- Yesterday
- Custom date range

### General Reports

Overview of all business data:
- Total sales and purchases
- Total collected and due amounts
- Stock value
- Net profit
- Customer and supplier counts

## 🚢 Deployment to GitHub Pages

### Automatic Deployment

1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Enable GitHub Pages
4. Add secrets in repository settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Push to main branch - it will auto-deploy

### Manual Build

```bash
npm run build
```

The built files will be in the `dist` directory.

### Vite Configuration

The project is configured for GitHub Pages deployment with the base path set to `/tools-house-react/`. If you deploy to a different path, update `vite.config.js`:

```javascript
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Log in with username (memo, wahba, mohamed, fahmi, yousef)
- [ ] Log in with correct password
- [ ] Login fails with incorrect credentials
- [ ] Log out
- [ ] Protected routes redirect to login
- [ ] Session persists across page refreshes

**Products:**
- [ ] Create product
- [ ] Edit product
- [ ] Deactivate product
- [ ] Search products
- [ ] Low stock warning

**Customers:**
- [ ] Create customer
- [ ] Edit customer
- [ ] View customer statement
- [ ] Product summary in statement
- [ ] Search customers

**Sales:**
- [ ] Create cash sale
- [ ] Create credit sale
- [ ] Add multiple products
- [ ] Stock decreases
- [ ] Customer balance updates
- [ ] View sale details
- [ ] WhatsApp message generation

**Purchases:**
- [ ] Create purchase
- [ ] Stock increases
- [ ] Supplier balance updates
- [ ] View purchase details

**Payments:**
- [ ] Record customer payment
- [ ] Record supplier payment
- [ ] Balance updates correctly

**Reports:**
- [ ] Daily report accuracy
- [ ] Sales total calculation
- [ ] Cash collected calculation
- [ ] Credit sales calculation
- [ ] Expenses calculation
- [ ] Profit calculation

**Backup:**
- [ ] Export backup
- [ ] Validate backup structure
- [ ] Restore backup
- [ ] Data integrity after restore

## 📝 Project Structure

```
tools-house-react/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment
├── public/
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Main layout with navigation
│   ├── contexts/
│   │   └── AuthContext.jsx     # Supabase authentication context
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Dashboard.jsx       # Dashboard with metrics
│   │   ├── Products.jsx       # Products management
│   │   ├── Customers.jsx       # Customers management
│   │   ├── CustomerStatement.jsx # Customer statement
│   │   ├── Sales.jsx           # Sales list
│   │   ├── CreateSale.jsx      # Create sale
│   │   ├── SaleDetails.jsx     # Sale details
│   │   ├── Suppliers.jsx       # Suppliers management
│   │   ├── Purchases.jsx      # Purchases list
│   │   ├── CreatePurchase.jsx  # Create purchase
│   │   ├── PurchaseDetails.jsx # Purchase details
│   │   ├── Expenses.jsx        # Expenses management
│   │   ├── Reports.jsx         # General reports
│   │   ├── DailyReport.jsx     # Daily report
│   │   └── Settings.jsx        # Settings & backup
│   ├── App.jsx                 # Main app with routing
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── supabase/
│   └── schema.sql              # Database schema
├── .env.example               # Environment variables example
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the existing issues on GitHub
- Review the documentation above
- Ensure your Supabase project is properly configured

## � Troubleshooting

### Common Issues

**"Missing Supabase environment variables"**
- Ensure `.env.local` exists in the project root
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set
- Restart the development server after adding environment variables

**"Invalid login credentials"**
- Verify the user exists in Supabase Auth (Authentication → Users)
- Check that the email format is `username@toolshouse.local`
- Ensure the password is correct
- Make sure the user has the `username` metadata field set

**"Relation does not exist"**
- Run the `supabase/schema.sql` in the SQL Editor
- Check that all tables were created successfully
- Verify the SQL execution completed without errors

**"Row level security policy violation"**
- Ensure you are logged in
- Check that RLS policies are enabled on all tables
- Verify the user is authenticated in Supabase Auth

**"Stock not updating"**
- Verify the database triggers are created (check in SQL Editor)
- Check the `stock_movements` table for records
- Ensure the schema.sql was executed completely

**"Build fails"**
- Run `npm install` to ensure all dependencies are installed
- Check for any TypeScript or linting errors
- Clear the cache: `npm run build` after `rm -rf node_modules/.vite`

**Database connection errors**
- Verify your Supabase project URL is correct
- Check that the anon key is valid (not expired)
- Ensure you have internet connectivity
- Check Supabase status page for outages

## �🔗 Important Links

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## 📊 Data Integrity

The application follows these principles:

1. **Historical Records**: Sales and purchases are never hard-deleted
2. **Soft Deletion**: Products, customers, and suppliers are deactivated instead of deleted
3. **Transaction Safety**: Critical operations use proper error handling
4. **Stock Accuracy**: Stock updates are atomic and validated
5. **Balance Consistency**: Balances are calculated from transactions

## ⚠️ Important Notes

- The Laravel project in the parent directory is untouched and remains functional
- This React version is a complete rewrite using modern technologies
- Both versions can coexist for comparison or migration purposes
- Database schema is similar but adapted for PostgreSQL/Supabase

## 🎯 Future Enhancements

Potential features for future versions:
- PDF invoice generation
- Barcode scanning
- Multi-currency support
- Advanced analytics
- Mobile app (React Native)
- Offline support with PWA
- Email notifications
- Advanced user roles and permissions
