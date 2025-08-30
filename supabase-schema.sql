-- Supabase Database Schema for Outsourcing Analyzer
-- This file contains the SQL commands to create the required tables

-- Create the company_results table
CREATE TABLE IF NOT EXISTS company_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    analysis JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_results_company_name ON company_results(company_name);
CREATE INDEX IF NOT EXISTS idx_company_results_created_at ON company_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_results_company_created ON company_results(company_name, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE company_results IS 'Stores analysis results for companies analyzed by the Outsourcing Analyzer';
COMMENT ON COLUMN company_results.id IS 'Unique identifier for each analysis result';
COMMENT ON COLUMN company_results.company_name IS 'Name of the company that was analyzed';
COMMENT ON COLUMN company_results.analysis IS 'JSON object containing the analysis results from OpenAI';
COMMENT ON COLUMN company_results.created_at IS 'Timestamp when the analysis was performed';

-- Example of the expected analysis JSON structure:
-- {
--   "outsourcingLikelihood": "High" | "Medium" | "Low",
--   "reasoning": "Explanation of the analysis",
--   "possibleServices": ["Service 1", "Service 2", "Service 3"],
--   "logoUrl": "https://example.com/logo.png" (optional)
-- }

-- Enable Row Level Security (RLS) for better security
ALTER TABLE company_results ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- In production, you might want to restrict this based on user authentication
CREATE POLICY "Allow all operations on company_results" ON company_results
    FOR ALL USING (true);

-- Optional: Create a function to clean up old records (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_company_results()
RETURNS void AS $$
BEGIN
    DELETE FROM company_results 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a view for recent searches (last 5 results)
CREATE OR REPLACE VIEW recent_company_searches AS
SELECT 
    id,
    company_name,
    analysis,
    created_at
FROM company_results
ORDER BY created_at DESC
LIMIT 5;