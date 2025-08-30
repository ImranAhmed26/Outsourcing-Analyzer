import { NextResponse } from 'next/server';
import { testSupabaseConnection } from '@/lib/supabase';
import { testOpenAIConnection } from '@/lib/openai';

export async function GET() {
  try {
    // Test both connections
    const [supabaseResult, openaiResult] = await Promise.all([testSupabaseConnection(), testOpenAIConnection()]);

    return NextResponse.json({
      success: true,
      results: {
        supabase: supabaseResult,
        openai: openaiResult,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
