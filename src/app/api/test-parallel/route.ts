import { NextResponse } from 'next/server';

export async function GET() {
  const parallelApiKey = process.env.PARALLEL_AI_API;
  
  if (!parallelApiKey) {
    return NextResponse.json(
      { error: 'PARALLEL_AI_API environment variable is not set' },
      { status: 500 }
    );
  }

  // Test a simple call to Parallel AI to verify the API key works
  try {
    const response = await fetch('https://api.parallel.ai/v1/tasks/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': parallelApiKey,
      },
      body: JSON.stringify({
        input: 'test@example.com',
        task_spec: {
          output_schema: 'Test connection to Parallel AI API'
        },
        processor: 'base'
      }),
    });

    if (response.ok) {
      const data = await response.json() as { run_id?: string };
      return NextResponse.json({
        status: 'success',
        message: 'Parallel AI API connection successful',
        runId: data.run_id
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json({
        status: 'error',
        message: 'Parallel AI API error',
        error: errorText,
        statusCode: response.status
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to Parallel AI API',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
