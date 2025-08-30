#!/usr/bin/env node

/**
 * Database setup script for Outsourcing Analyzer
 * This script helps verify the database connection and provides setup instructions
 */

const { testSupabaseConnection } = require('../src/lib/supabase');

async function setupDatabase() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    const result = await testSupabaseConnection();

    if (result.success) {
      console.log('✅ Supabase connection successful!');
      console.log(`   ${result.message}\n`);

      if (result.needsSchema) {
        console.log('📋 Next steps:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to the SQL Editor');
        console.log('3. Copy and paste the contents of database/schema.sql');
        console.log('4. Run the SQL to create the company_results table\n');
      } else {
        console.log('🎉 Database is ready to use!');
      }
    } else {
      console.log('❌ Supabase connection failed:');
      console.log(`   ${result.message}\n`);
      console.log('🔧 Troubleshooting:');
      console.log('1. Check your .env.local file has the correct Supabase URL and anon key');
      console.log('2. Verify your Supabase project is active');
      console.log('3. Make sure your environment variables are properly formatted\n');
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
