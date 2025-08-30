# Database Setup

This directory contains the database schema and setup instructions for the Outsourcing Analyzer application.

## Supabase Setup

1. **Create a Supabase Project**

   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Configure Environment Variables**

   - Copy your Supabase URL and anon key to `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Create Database Schema**
   - Go to your Supabase dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `schema.sql`
   - Run the SQL to create the `company_results` table

## Database Schema

The application uses a single table `company_results` with the following structure:

- `id` (UUID, Primary Key): Unique identifier for each analysis
- `company_name` (TEXT): Name of the analyzed company
- `analysis` (JSONB): JSON object containing the analysis results
- `created_at` (TIMESTAMP): When the analysis was performed

## Database Functions

The following utility functions are available in `src/lib/supabase.ts`:

- `saveAnalysisResult()`: Save a new company analysis to the database
- `getRecentSearches()`: Retrieve the 5 most recent analyses
- `hasRecentAnalysis()`: Check if a company was analyzed in the last 24 hours
- `testSupabaseConnection()`: Test the database connection

## Testing the Connection

You can test your Supabase connection by running the test endpoint:

```
GET /api/test-connections
```

This will verify that your environment variables are correct and the database is accessible.
