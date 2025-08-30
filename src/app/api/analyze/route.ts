import { NextRequest, NextResponse } from 'next/server';
import { fetchCompanyData } from '@/lib/external-apis';
import { analyzeCompanyWithRetry } from '@/lib/openai';
import { saveAnalysisResult, hasRecentAnalysis } from '@/lib/supabase';
import { AnalyzeRequest, AnalyzeResponse, ErrorType, ValidationError } from '@/types';

// Input validation function
function validateAnalyzeRequest(body: any): { isValid: boolean; error?: ValidationError } {
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

  if (!body.companyName || typeof body.companyName !== 'string') {
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

  const trimmedName = body.companyName.trim();
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
    } catch (error) {
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

    // Step 1: Fetch company data from external APIs
    let companyData;
    try {
      companyData = await fetchCompanyData(companyName);
    } catch (error) {
      console.error('Error fetching company data:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch company information. Please try again later.',
        } as AnalyzeResponse,
        { status: 503 }
      );
    }

    // Step 2: Analyze with OpenAI
    let analysisResult;
    try {
      analysisResult = await analyzeCompanyWithRetry(companyName, companyData);
    } catch (error: any) {
      console.error('Error analyzing company with OpenAI:', error);

      // Handle specific OpenAI errors
      if (error.type === ErrorType.RATE_LIMIT_ERROR) {
        return NextResponse.json(
          {
            success: false,
            error: 'AI analysis service is currently busy. Please try again in a few minutes.',
          } as AnalyzeResponse,
          { status: 429 }
        );
      }

      if (error.type === ErrorType.OPENAI_API_ERROR) {
        if (error.statusCode === 401) {
          return NextResponse.json(
            {
              success: false,
              error: 'AI analysis service is temporarily unavailable. Please try again later.',
            } as AnalyzeResponse,
            { status: 503 }
          );
        }

        if (error.retryable) {
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

    // Step 3: Prepare analysis data for saving
    const analysisData = {
      outsourcingLikelihood: analysisResult.outsourcingLikelihood,
      reasoning: analysisResult.reasoning,
      possibleServices: analysisResult.possibleServices,
      logoUrl: companyData.logoUrl,
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
            logoUrl: companyData.logoUrl,
            createdAt: new Date(),
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
          logoUrl: companyData.logoUrl,
          createdAt: new Date(),
        },
        warning: 'Analysis completed but could not be saved to history.',
      } as AnalyzeResponse & { warning: string });
    }

    // Step 5: Return successful result
    const finalResult = {
      id: savedResult.id,
      companyName: savedResult.company_name,
      outsourcingLikelihood: savedResult.analysis.outsourcingLikelihood,
      reasoning: savedResult.analysis.reasoning,
      possibleServices: savedResult.analysis.possibleServices,
      logoUrl: savedResult.analysis.logoUrl,
      createdAt: new Date(savedResult.created_at),
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
