# Quick Database Setup Guide

## The "Error fetching user profile" Issue

If you're seeing this error, it means the `user_profiles` table doesn't exist in your Supabase database yet, or the user doesn't have permission to access it.

## Solution Steps:

### 1. Apply the Database Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `database/schema.sql` from this project
4. Paste it into the SQL Editor
5. Click **Run** to execute the schema

### 2. Verify Tables Created
After running the schema, you should see these tables in your **Table Editor**:
- `user_profiles`
- `products`
- `boms`
- `bom_lines`
- `manufacturing_orders`
- `work_orders`
- `stock_ledger`

### 3. Test Authentication
1. Try logging in again
2. The app should now create user profiles automatically

## What the Updated Code Does:

The auth provider has been updated to:
- ✅ Handle missing database tables gracefully
- ✅ Create default user profiles when tables don't exist
- ✅ Provide better error messages
- ✅ Continue working even if the database isn't set up yet

## Temporary Workaround:

Even without the database schema, the app will now work with in-memory user profiles. Users will have:
- **Role**: `operator` by default
- **Email**: From their authentication
- **Name**: From Google OAuth or email

Once you apply the database schema, the app will start using the proper database tables.