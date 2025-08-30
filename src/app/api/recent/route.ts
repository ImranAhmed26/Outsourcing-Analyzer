import { NextResponse } from 'next/server';
import { getRecentSearches } from '@/lib/supabase';
import { RecentSearchesResponse, RecentSearch } from '@/types';

/**
 * GET /api/recent
 * Retrieves the last 5 company analyses from the database
 * Returns company name, outsourcing likelihood, and analysis date
 */
export async function GET(): Promise<NextResponse<RecentSearchesResponse>> {
  try {
    // Fetch recent searches from database
    const result = await getRecentSearches();

    if (!result.success) {
      console.error('Database error fetching recent searches:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to retrieve recent searches. Please try again later.',
        } as RecentSearchesResponse,
        { status: 500 }
      );
    }

    // Transform AnalysisResult to RecentSearch format (simplified for recent searches display)
    const recentSearches: RecentSearch[] =
      result.data?.map((analysis) => ({
        id: analysis.id,
        companyName: analysis.companyName,
        outsourcingLikelihood: analysis.outsourcingLikelihood,
        createdAt: analysis.createdAt,
      })) || [];

    return NextResponse.json({
      success: true,
      data: recentSearches,
    } as RecentSearchesResponse);
  } catch (error) {
    console.error('Unexpected error in recent searches API:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while retrieving recent searches.',
      } as RecentSearchesResponse,
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use GET to retrieve recent searches.',
    } as RecentSearchesResponse,
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use GET to retrieve recent searches.',
    } as RecentSearchesResponse,
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use GET to retrieve recent searches.',
    } as RecentSearchesResponse,
    { status: 405 }
  );
}
