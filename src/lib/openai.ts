import OpenAI from 'openai';
import { CompanyData, OpenAIAnalysisResponse, ErrorType, OpenAIApiError, RateLimitError } from '@/types';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('Missing OpenAI API key');
}

export const openai = new OpenAI({
  apiKey: apiKey,
});

// Test function to verify OpenAI connection
export async function testOpenAIConnection() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello" if you can hear me.',
        },
      ],
      max_tokens: 10,
    });

    if (response.choices[0]?.message?.content) {
      return {
        success: true,
        message: 'OpenAI connection successful',
        response: response.choices[0].message.content,
      };
    } else {
      return {
        success: false,
        message: 'OpenAI connection failed: No response received',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `OpenAI connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Main function to analyze company outsourcing likelihood
export async function analyzeCompanyOutsourcing(companyName: string, companyData: CompanyData): Promise<OpenAIAnalysisResponse> {
  try {
    const prompt = createAnalysisPrompt(companyName, companyData);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            "You are an expert business analyst specializing in outsourcing trends and company analysis. You provide accurate, data-driven assessments of companies' likelihood to outsource services.",
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more consistent analysis
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content received from OpenAI');
    }

    // Parse the JSON response
    const analysisResult = JSON.parse(content) as OpenAIAnalysisResponse;

    // Validate the response structure
    validateAnalysisResponse(analysisResult);

    return analysisResult;
  } catch (error) {
    // Handle different types of OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        // Rate limiting error
        const rateLimitError: RateLimitError = {
          type: ErrorType.RATE_LIMIT_ERROR,
          message: 'OpenAI API rate limit exceeded. Please try again later.',
          apiName: 'OpenAI',
          statusCode: 429,
          retryable: true,
        };
        throw rateLimitError;
      } else if (error.status === 401) {
        // Authentication error
        const authError: OpenAIApiError = {
          type: ErrorType.OPENAI_API_ERROR,
          message: 'OpenAI API authentication failed. Please check your API key.',
          apiName: 'OpenAI',
          statusCode: 401,
          retryable: false,
        };
        throw authError;
      } else {
        // Other API errors
        const apiError: OpenAIApiError = {
          type: ErrorType.OPENAI_API_ERROR,
          message: `OpenAI API error: ${error.message}`,
          apiName: 'OpenAI',
          statusCode: error.status || 500,
          retryable: error.status ? error.status >= 500 : false,
        };
        throw apiError;
      }
    } else if (error instanceof SyntaxError) {
      // JSON parsing error
      const parseError: OpenAIApiError = {
        type: ErrorType.OPENAI_API_ERROR,
        message: 'Failed to parse OpenAI response. The response format was invalid.',
        apiName: 'OpenAI',
        statusCode: 500,
        retryable: true,
      };
      throw parseError;
    } else {
      // Unknown error
      const unknownError: OpenAIApiError = {
        type: ErrorType.OPENAI_API_ERROR,
        message: `Unexpected error during OpenAI analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        apiName: 'OpenAI',
        statusCode: 500,
        retryable: true,
      };
      throw unknownError;
    }
  }
}

// Create structured prompt for outsourcing analysis
function createAnalysisPrompt(companyName: string, companyData: CompanyData): string {
  return `
Analyze the following company for their likelihood to outsource services. Consider factors such as company size, industry, business model, cost structure, and current market trends.

Company Information:
- Name: ${companyName}
- Description: ${companyData.description || 'Not available'}
- Industry: ${companyData.industry || 'Not specified'}
- Website: ${companyData.website || 'Not available'}

Please provide your analysis in the following JSON format:
{
  "outsourcingLikelihood": "High" | "Medium" | "Low",
  "reasoning": "1-2 sentence explanation of why this company would or would not outsource services",
  "possibleServices": ["service1", "service2", "service3"],
  "confidence": 85
}

Analysis Guidelines:
- High: Companies with clear cost pressures, non-core functions, or industries known for outsourcing
- Medium: Companies that might outsource some functions but have mixed indicators
- Low: Companies likely to keep most functions in-house due to security, control, or strategic reasons

Consider these factors:
1. Industry trends (tech companies often outsource customer support, manufacturing companies outsource logistics)
2. Company size (larger companies more likely to outsource non-core functions)
3. Business model (service companies vs. product companies)
4. Cost optimization needs
5. Regulatory requirements that might prevent outsourcing

Possible services to consider: Customer Support, IT Services, Accounting/Finance, Human Resources, Marketing, Manufacturing, Logistics, Data Entry, Software Development, Legal Services, Facilities Management.

Provide exactly 3-5 most relevant services they might outsource based on their industry and business model.
`;
}

// Validate the OpenAI response structure
function validateAnalysisResponse(response: any): asserts response is OpenAIAnalysisResponse {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response format: Expected object');
  }

  if (!['High', 'Medium', 'Low'].includes(response.outsourcingLikelihood)) {
    throw new Error('Invalid outsourcingLikelihood: Must be High, Medium, or Low');
  }

  if (!response.reasoning || typeof response.reasoning !== 'string' || response.reasoning.trim().length === 0) {
    throw new Error('Invalid reasoning: Must be a non-empty string');
  }

  if (!Array.isArray(response.possibleServices) || response.possibleServices.length === 0) {
    throw new Error('Invalid possibleServices: Must be a non-empty array');
  }

  if (response.possibleServices.some((service: any) => typeof service !== 'string' || service.trim().length === 0)) {
    throw new Error('Invalid possibleServices: All services must be non-empty strings');
  }

  if (
    response.confidence !== undefined &&
    (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 100)
  ) {
    throw new Error('Invalid confidence: Must be a number between 0 and 100');
  }
}

// Retry mechanism for transient failures
export async function analyzeCompanyWithRetry(
  companyName: string,
  companyData: CompanyData,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<OpenAIAnalysisResponse> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await analyzeCompanyOutsourcing(companyName, companyData);
    } catch (error) {
      lastError = error as Error;

      // Don't retry for non-retryable errors
      if (error && typeof error === 'object' && 'retryable' in error && !error.retryable) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
