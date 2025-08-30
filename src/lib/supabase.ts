import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database operations
export interface AnalysisResult {
  id: string;
  companyName: string;
  outsourcingLikelihood: 'High' | 'Medium' | 'Low';
  reasoning: string;
  possibleServices: string[];
  logoUrl?: string;
  createdAt: Date;
}

export interface CompanyResultRow {
  id: string;
  company_name: string;
  analysis: {
    outsourcingLikelihood: 'High' | 'Medium' | 'Low';
    reasoning: string;
    possibleServices: string[];
    logoUrl?: string;
  };
  created_at: string;
}

// Database utility functions

/**
 * Save an analysis result to the database
 * @param companyName - The name of the company analyzed
 * @param analysis - The analysis result from OpenAI
 * @returns Promise with the saved result or error
 */
export async function saveAnalysisResult(
  companyName: string,
  analysis: {
    outsourcingLikelihood: 'High' | 'Medium' | 'Low';
    reasoning: string;
    possibleServices: string[];
    logoUrl?: string;
  }
): Promise<{ success: boolean; data?: CompanyResultRow; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('company_results')
      .insert({
        company_name: companyName,
        analysis: analysis,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving analysis result:', error);
      return {
        success: false,
        error: `Failed to save analysis: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data as CompanyResultRow,
    };
  } catch (error) {
    console.error('Unexpected error saving analysis result:', error);
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Retrieve the most recent 5 analysis results
 * @returns Promise with recent searches or error
 */
export async function getRecentSearches(): Promise<{
  success: boolean;
  data?: AnalysisResult[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase.from('company_results').select('*').order('created_at', { ascending: false }).limit(5);

    if (error) {
      console.error('Error fetching recent searches:', error);
      return {
        success: false,
        error: `Failed to fetch recent searches: ${error.message}`,
      };
    }

    // Transform database rows to AnalysisResult format
    const transformedData: AnalysisResult[] = (data as CompanyResultRow[]).map((row) => ({
      id: row.id,
      companyName: row.company_name,
      outsourcingLikelihood: row.analysis.outsourcingLikelihood,
      reasoning: row.analysis.reasoning,
      possibleServices: row.analysis.possibleServices,
      logoUrl: row.analysis.logoUrl,
      createdAt: new Date(row.created_at),
    }));

    return {
      success: true,
      data: transformedData,
    };
  } catch (error) {
    console.error('Unexpected error fetching recent searches:', error);
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if a company has been analyzed recently (within last 24 hours)
 * @param companyName - The name of the company to check
 * @returns Promise with boolean result or error
 */
export async function hasRecentAnalysis(companyName: string): Promise<{
  success: boolean;
  hasRecent?: boolean;
  data?: AnalysisResult;
  error?: string;
}> {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data, error } = await supabase
      .from('company_results')
      .select('*')
      .eq('company_name', companyName)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking recent analysis:', error);
      return {
        success: false,
        error: `Failed to check recent analysis: ${error.message}`,
      };
    }

    if (data && data.length > 0) {
      const row = data[0] as CompanyResultRow;
      const transformedData: AnalysisResult = {
        id: row.id,
        companyName: row.company_name,
        outsourcingLikelihood: row.analysis.outsourcingLikelihood,
        reasoning: row.analysis.reasoning,
        possibleServices: row.analysis.possibleServices,
        logoUrl: row.analysis.logoUrl,
        createdAt: new Date(row.created_at),
      };

      return {
        success: true,
        hasRecent: true,
        data: transformedData,
      };
    }

    return {
      success: true,
      hasRecent: false,
    };
  } catch (error) {
    console.error('Unexpected error checking recent analysis:', error);
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Test function to verify Supabase connection
export async function testSupabaseConnection() {
  try {
    // Test connection by trying to query the company_results table
    const { data, error } = await supabase.from('company_results').select('count').limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        // Table doesn't exist yet - this is expected for new projects
        return {
          success: true,
          message: 'Supabase connection successful (table needs to be created)',
          needsSchema: true,
        };
      } else {
        return {
          success: false,
          message: `Supabase connection failed: ${error.message}`,
          details: error,
        };
      }
    }

    return {
      success: true,
      message: 'Supabase connection successful and table exists',
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      message: `Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error,
    };
  }
}
