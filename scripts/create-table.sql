-- Create the company_results table in Supabase
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS company_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_company_results_created_at ON company_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_results_company_name ON company_results(company_name);

-- Enable RLS (Row Level Security)
ALTER TABLE company_results ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for hackathon purposes)
CREATE POLICY "Allow all operations on company_results" ON company_results
  FOR ALL USING (true);