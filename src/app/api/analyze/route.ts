import { NextRequest, NextResponse } from 'next/server';
import { fetchCompanyData } from '@/lib/external-apis';
import { analyzeCompanyWithRetry } from '@/lib/openai';
import { saveAnalysisResult, hasRecentAnalysis } from '@/lib/supabase';
import { AnalyzeRequest, AnalyzeResponse, ErrorType, ValidationError } from '@/types';

// Input validation function
function validateAnalyzeRequest(body: unknown): { isValid: boolean; error?: ValidationError } {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Request body is required and must be a valid JSON object',
        statusCode: 400,
        retryable: false,
      },
    };
  }

  const requestBody = body as Record<string, unknown>;

  if (!requestBody.companyName || typeof requestBody.companyName !== 'string') {
    return {
      isValid: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Company name is required and must be a string',
        field: 'companyName',
        statusCode: 400,
        retryable: false,
      },
    };
  }

  const trimmedName = requestBody.companyName.trim();
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Company name must be at least 2 characters long',
        field: 'companyName',
        statusCode: 400,
        retryable: false,
      },
    };
  }

  if (trimmedName.length > 100) {
    return {
      isValid: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Company name must be less than 100 characters',
        field: 'companyName',
        statusCode: 400,
        retryable: false,
      },
    };
  }

  return { isValid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: AnalyzeRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        } as AnalyzeResponse,
        { status: 400 }
      );
    }

    // Validate input
    const validation = validateAnalyzeRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error!.message,
        } as AnalyzeResponse,
        { status: validation.error!.statusCode || 400 }
      );
    }

    const companyName = body.companyName.trim();

    // Check for recent analysis (optional optimization)
    try {
      const recentCheck = await hasRecentAnalysis(companyName);
      if (recentCheck.success && recentCheck.hasRecent && recentCheck.data) {
        // Return cached result if found within last 24 hours
        return NextResponse.json({
          success: true,
          data: recentCheck.data,
        } as AnalyzeResponse);
      }
    } catch (error) {
      // Continue with fresh analysis if recent check fails
      console.warn('Failed to check recent analysis, proceeding with fresh analysis:', error);
    }

    // Step 1: Fetch basic company data from external APIs
    let basicCompanyData;
    try {
      basicCompanyData = await fetchCompanyData(companyName);
    } catch (error) {
      console.error('Error fetching basic company data:', error);
      basicCompanyData = {
        name: companyName,
        description: `Analysis for ${companyName} (limited data available due to external service issues)`,
      };
    }

    // Step 1.5: Fetch enhanced company data (news, jobs, people, etc.)
    let enhancedCompanyData;
    try {
      const { fetchEnhancedCompanyData } = await import('@/lib/enhanced-apis');
      enhancedCompanyData = await fetchEnhancedCompanyData(companyName, basicCompanyData);
      console.log(`Enhanced data collected for ${companyName}`);
    } catch (error) {
      console.error('Error fetching enhanced company data:', error);
      enhancedCompanyData = basicCompanyData; // Fallback to basic data
    }

    // Step 2: Analyze with OpenAI using enhanced data
    let analysisResult;
    try {
      analysisResult = await analyzeCompanyWithRetry(companyName, enhancedCompanyData);
    } catch (error: unknown) {
      console.error('Error analyzing company with OpenAI:', error);

      // Handle specific OpenAI errors
      if (error && typeof error === 'object' && 'type' in error && error.type === ErrorType.RATE_LIMIT_ERROR) {
        return NextResponse.json(
          {
            success: false,
            error: 'AI analysis service is currently busy. Please try again in a few minutes.',
          } as AnalyzeResponse,
          { status: 429 }
        );
      }

      if (error && typeof error === 'object' && 'type' in error && error.type === ErrorType.OPENAI_API_ERROR) {
        if ('statusCode' in error && error.statusCode === 401) {
          return NextResponse.json(
            {
              success: false,
              error: 'AI analysis service is temporarily unavailable. Please try again later.',
            } as AnalyzeResponse,
            { status: 503 }
          );
        }

        if ('retryable' in error && error.retryable) {
          return NextResponse.json(
            {
              success: false,
              error: 'AI analysis failed. Please try again.',
            } as AnalyzeResponse,
            { status: 503 }
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to analyze company. Please try again later.',
        } as AnalyzeResponse,
        { status: 500 }
      );
    }

    // Step 3: Prepare enhanced analysis data for saving
    const analysisData = {
      outsourcingLikelihood: analysisResult.outsourcingLikelihood,
      reasoning: analysisResult.reasoning,
      possibleServices: analysisResult.possibleServices,
      logoUrl: enhancedCompanyData.logoUrl,
      confidence: analysisResult.confidence,
      keyInsights: analysisResult.keyInsights || [],
      riskFactors: analysisResult.riskFactors || [],
      opportunities: analysisResult.opportunities || [],
      // Enhanced activity data
      recentActivity: {
        newsCount: enhancedCompanyData.recentNews?.length || 0,
        jobPostingsCount: enhancedCompanyData.jobPostings?.length || 0,
        hiringTrends: enhancedCompanyData.jobPostings?.length > 5 ? 'Active hiring' : 'Limited hiring',
      },
    };

    // Step 4: Save to database
    let savedResult;
    try {
      const saveResult = await saveAnalysisResult(companyName, analysisData);
      if (!saveResult.success) {
        // Log the database error but don't fail the request
        console.error('Failed to save analysis result:', saveResult.error);

        // Return the analysis result even if saving failed
        return NextResponse.json({
          success: true,
          data: {
            id: 'temp-' + Date.now(), // Temporary ID since save failed
            companyName,
            outsourcingLikelihood: analysisResult.outsourcingLikelihood,
            reasoning: analysisResult.reasoning,
            possibleServices: analysisResult.possibleServices,
            logoUrl: enhancedCompanyData.logoUrl,
            createdAt: new Date(),
            confidence: analysisResult.confidence,
            keyInsights: analysisResult.keyInsights || [],
            riskFactors: analysisResult.riskFactors || [],
            opportunities: analysisResult.opportunities || [],
            keyPeople: enhancedCompanyData.keyPeople || [],
            recentActivity: {
              newsCount: enhancedCompanyData.recentNews?.length || 0,
              jobPostingsCount: enhancedCompanyData.jobPostings?.length || 0,
              hiringTrends: enhancedCompanyData.jobPostings?.length > 5 ? 'Active hiring' : 'Limited hiring',
            },
          },
          warning: 'Analysis completed but could not be saved to history.',
        } as AnalyzeResponse & { warning: string });
      }
      savedResult = saveResult.data!;
    } catch (error) {
      console.error('Unexpected error saving analysis result:', error);

      // Return the analysis result even if saving failed
      return NextResponse.json({
        success: true,
        data: {
          id: 'temp-' + Date.now(), // Temporary ID since save failed
          companyName,
          outsourcingLikelihood: analysisResult.outsourcingLikelihood,
          reasoning: analysisResult.reasoning,
          possibleServices: analysisResult.possibleServices,
          logoUrl: enhancedCompanyData.logoUrl,
          createdAt: new Date(),
          confidence: analysisResult.confidence,
          keyInsights: analysisResult.keyInsights || [],
          riskFactors: analysisResult.riskFactors || [],
          opportunities: analysisResult.opportunities || [],
          keyPeople: enhancedCompanyData.keyPeople || [],
          recentActivity: {
            newsCount: enhancedCompanyData.recentNews?.length || 0,
            jobPostingsCount: enhancedCompanyData.jobPostings?.length || 0,
            hiringTrends: enhancedCompanyData.jobPostings?.length > 5 ? 'Active hiring' : 'Limited hiring',
          },
        },
        warning: 'Analysis completed but could not be saved to history.',
      } as AnalyzeResponse & { warning: string });
    }

    // Step 5: Return successful result with enhanced data
    const finalResult = {
      id: savedResult.id,
      companyName: savedResult.company_name,
      outsourcingLikelihood: savedResult.analysis.outsourcingLikelihood,
      reasoning: savedResult.analysis.reasoning,
      possibleServices: savedResult.analysis.possibleServices,
      logoUrl: savedResult.analysis.logoUrl,
      createdAt: new Date(savedResult.created_at),
      confidence: savedResult.analysis.confidence || 0,
      keyInsights: savedResult.analysis.keyInsights || [],
      riskFactors: savedResult.analysis.riskFactors || [],
      opportunities: savedResult.analysis.opportunities || [],
      keyPeople: enhancedCompanyData.keyPeople || [],
      recentActivity: savedResult.analysis.recentActivity || {
        newsCount: 0,
        jobPostingsCount: 0,
        hiringTrends: 'No data',
      },
    };

    return NextResponse.json({
      success: true,
      data: finalResult,
    } as AnalyzeResponse);
  } catch (error) {
    console.error('Unexpected error in analyze endpoint:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
      } as AnalyzeResponse,
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to analyze a company.',
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to analyze a company.',
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to analyze a company.',
    },
    { status: 405 }
  );
}
