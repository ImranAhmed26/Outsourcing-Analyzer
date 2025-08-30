# Supabase Database Setup Guide

## 🎯 Overview

Your Outsourcing Analyzer application requires a Supabase database table to store analysis results. This guide will help you set it up.

## 📋 Required Table Structure

The application expects a table called `company_results` with the following structure:

| Column         | Type               | Description                         |
| -------------- | ------------------ | ----------------------------------- |
| `id`           | UUID (Primary Key) | Unique identifier for each analysis |
| `company_name` | TEXT               | Name of the analyzed company        |
| `analysis`     | JSONB              | Analysis results from OpenAI        |
| `created_at`   | TIMESTAMP          | When the analysis was performed     |

## 🚀 Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**

   - Visit [supabase.com](https://supabase.com)
   - Navigate to your project

2. **Open the SQL Editor**

   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Schema Creation Script**
   - Copy the entire contents of `supabase-schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to your project directory
cd your-project-directory

# Run the schema file
supabase db reset --db-url "your-supabase-db-url"
```

### Option 3: Manual Table Creation

If you prefer to create the table manually:

1. Go to "Table Editor" in your Supabase dashboard
2. Click "Create a new table"
3. Set table name: `company_results`
4. Add columns:
   - `id`: UUID, Primary Key, Default: `gen_random_uuid()`
   - `company_name`: text, Required
   - `analysis`: jsonb, Required
   - `created_at`: timestamptz, Default: `now()`

## 🔧 Verification

After creating the table, you can verify it works by:

1. **Test the connection** by visiting: `http://localhost:3000/api/test-connections`
2. **Try analyzing a company** through the web interface
3. **Check the table** in Supabase dashboard to see if data is being saved

## 📊 Expected Data Format

The `analysis` column will store JSON data like this:

```json
{
  "outsourcingLikelihood": "High",
  "reasoning": "This company shows strong indicators for outsourcing...",
  "possibleServices": ["Customer Support", "IT Services", "Accounting"],
  "logoUrl": "https://logo.clearbit.com/company.com"
}
```

## 🔒 Security Notes

The schema includes:

- **Row Level Security (RLS)** enabled
- **Basic policy** allowing all operations (suitable for development)
- **Indexes** for better query performance

For production, consider:

- Adding user authentication
- Restricting RLS policies
- Adding data validation constraints

## 🧹 Maintenance

The schema includes:

- **Indexes** for fast queries on company names and dates
- **Cleanup function** to remove old records (optional)
- **Recent searches view** for quick access to latest results

## ❓ Troubleshooting

### Common Issues:

1. **"relation does not exist" error**

   - The table hasn't been created yet
   - Run the schema creation script

2. **Permission denied errors**

   - Check your Supabase environment variables
   - Verify RLS policies are set correctly

3. **Connection errors**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
   - Check if your Supabase project is active

### Testing Connection:

You can test your setup by running:

```bash
npm run dev
```

Then visit: `http://localhost:3000/api/test-connections`

## 🎉 Next Steps

Once your database is set up:

1. Test the application by analyzing a company
2. Check the Supabase dashboard to see stored results
3. Verify the "Recent Searches" section shows your analyses

Your Outsourcing Analyzer should now be fully functional with persistent data storage!
