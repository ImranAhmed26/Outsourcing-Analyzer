-- Outsourcing Analyzer Database Schema
-- This file contains the SQL schema for the company_results table

-- Create the company_results table
CREATE TABLE IF NOT EXISTS company_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying by created_at (for recent searches)
CREATE INDEX IF NOT EXISTS idx_company_results_created_at ON company_results(created_at DESC);

-- Create index for efficient querying by company_name (for duplicate detection)
CREATE INDEX IF NOT EXISTS idx_company_results_company_name ON company_results(company_name);

-- Add RLS (Row Level Security) policies if needed
-- For now, we'll allow all operations since this is a hackathon project
-- In production, you would want to add proper RLS policies

-- Enable RLS on the table
ALTER TABLE company_results ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- In production, you would want more restrictive policies
CREATE POLICY "Allow all operations on company_results" ON company_results
  FOR ALL USING (true);