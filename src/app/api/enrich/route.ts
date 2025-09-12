import { NextRequest, NextResponse } from 'next/server';
import { 
  EnrichmentRequest, 
  EnrichmentResponse, 
  EnrichmentResult,
  ParallelTaskRunRequest,
  ParallelTaskRun,
  ParallelTaskResult,
  CompanyEnrichmentData
} from '@/types/enrichment';

const PARALLEL_API_BASE_URL = 'https://api.parallel.ai/v1';
const PARALLEL_API_KEY = process.env.PARALLEL_AI_API;

if (!PARALLEL_API_KEY) {
  throw new Error('PARALLEL_AI_API environment variable is not set');
}

// Task specification for company enrichment from email
const getTaskSpec = () => ({
  input_schema: {
    type: "json",
    json_schema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Email address to analyze and find company information for"
        }
      },
      required: ["email"]
    }
  },
  output_schema: {
    type: "json",
    json_schema: {
      type: "object",
      properties: {
        companyName: {
          type: "string",
          description: "The official name of the company associated with this email domain"
        },
        companyDescription: {
          type: "string",
          description: "A detailed description of what the company does, their business model, and key services/products (2-4 sentences)"
        },
        industry: {
          type: "string",
          description: "The primary industry or sector the company operates in (e.g., Software, Healthcare, Finance, etc.)"
        },
        employeeCount: {
          type: "string",
          enum: [
            "1-10 employees",
            "11-50 employees", 
            "51-200 employees",
            "201-500 employees",
            "501-1000 employees",
            "1001-5000 employees",
            "5001-10000 employees",
            "10001+ employees"
          ],
          description: "The estimated number of employees at the company. Choose the most accurate range based on reliable sources."
        },
        yearFounded: {
          type: "string",
          description: "The year the company was founded in YYYY format"
        },
        headquarters: {
          type: "string",
          description: "The location of the company's main headquarters (City, State/Country format)"
        },
        revenue: {
          type: "string",
          description: "The company's annual revenue if publicly available (include currency and year, e.g., '$10M (2023)')"
        },
        fundingRaised: {
          type: "string",
          description: "Total funding raised by the company if available (include currency, e.g., '$5M Series A')"
        },
        fundingStage: {
          type: "string",
          description: "Current funding stage (e.g., Seed, Series A, Series B, Public, Private, Bootstrapped)"
        },
        techStack: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of key technologies, programming languages, or platforms the company uses (limit to 5-8 most relevant)"
        },
        subsidiaries: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of notable subsidiaries or companies owned by this organization (if any)"
        }
      },
      required: [
        "companyName",
        "companyDescription", 
        "industry",
        "employeeCount",
        "yearFounded",
        "headquarters"
      ],
      additionalProperties: false
    }
  }
});

async function createTaskRun(email: string): Promise<ParallelTaskRun> {
  const taskRequest: ParallelTaskRunRequest = {
    input: { email },
    task_spec: getTaskSpec(),
    processor: "base" // Using 'core' for better quality results
  };

  const response = await fetch(`${PARALLEL_API_BASE_URL}/tasks/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': PARALLEL_API_KEY!,
    },
    body: JSON.stringify(taskRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create task run: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function getTaskResult(runId: string): Promise<ParallelTaskResult> {
  const response = await fetch(`${PARALLEL_API_BASE_URL}/tasks/runs/${runId}/result`, {
    headers: {
      'x-api-key': PARALLEL_API_KEY!,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get task result: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function pollForResult(runId: string, maxAttempts: number = 60, delayMs: number = 5000): Promise<ParallelTaskResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await getTaskResult(runId);
      
      if (result.run.status === 'completed') {
        return result;
      } else if (result.run.status === 'failed') {
        throw new Error(`Task failed: ${result.run.run_id}`);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error(`Task did not complete within ${maxAttempts * delayMs / 1000} seconds`);
}

async function enrichEmail(email: string): Promise<EnrichmentResult> {
  try {
    // Create task run
    const taskRun = await createTaskRun(email);
    
    // Poll for result
    const taskResult = await pollForResult(taskRun.run_id);
    
    // Transform the result to our format
    const enrichmentData: CompanyEnrichmentData = {
      companyName: taskResult.output.content.companyName || '',
      companyDescription: taskResult.output.content.companyDescription || '',
      industry: taskResult.output.content.industry || '',
      employeeCount: taskResult.output.content.employeeCount || '1-10 employees',
      yearFounded: taskResult.output.content.yearFounded || '',
      headquarters: taskResult.output.content.headquarters || '',
      revenue: taskResult.output.content.revenue || 'Not available',
      fundingRaised: taskResult.output.content.fundingRaised || 'Not available',
      fundingStage: taskResult.output.content.fundingStage || 'Unknown',
      techStack: taskResult.output.content.techStack || [],
      subsidiaries: taskResult.output.content.subsidiaries || [],
    };

    return {
      email,
      status: 'success',
      data: enrichmentData,
      runId: taskRun.run_id,
    };
  } catch (error) {
    console.error(`Error enriching email ${email}:`, error);
    return {
      email,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: EnrichmentRequest = await request.json();
    
    if (!body.emails || !Array.isArray(body.emails)) {
      return NextResponse.json(
        { error: 'Invalid request: emails array is required' },
        { status: 400 }
      );
    }

    if (body.emails.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: emails array cannot be empty' },
        { status: 400 }
      );
    }

    if (body.emails.length > 50) {
      return NextResponse.json(
        { error: 'Invalid request: maximum 50 emails allowed per request' },
        { status: 400 }
      );
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = body.emails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email format(s): ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Process emails concurrently with a limit to avoid overwhelming the API
    const CONCURRENT_LIMIT = 5;
    const results: EnrichmentResult[] = [];
    
    for (let i = 0; i < body.emails.length; i += CONCURRENT_LIMIT) {
      const batch = body.emails.slice(i, i + CONCURRENT_LIMIT);
      const batchPromises = batch.map(email => enrichEmail(email));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    const response: EnrichmentResponse = {
      results,
      totalProcessed: results.length,
      successCount,
      errorCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in enrichment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
