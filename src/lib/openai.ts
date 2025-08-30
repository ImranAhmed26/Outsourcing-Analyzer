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

// Create enhanced structured prompt for outsourcing analysis
function createAnalysisPrompt(companyName: string, companyData: CompanyData): string {
  // Build enhanced context from available data
  let enhancedContext = '';

  if (companyData.recentNews && companyData.recentNews.length > 0) {
    enhancedContext += `\nRecent News (${companyData.recentNews.length} articles):\n`;
    companyData.recentNews.slice(0, 3).forEach((news) => {
      enhancedContext += `- ${news.title} (${news.source}, ${news.sentiment})\n`;
    });
  }

  if (companyData.jobPostings && companyData.jobPostings.length > 0) {
    enhancedContext += `\nRecent Job Postings (${companyData.jobPostings.length} positions):\n`;
    const departments = [...new Set(companyData.jobPostings.map((job) => job.department))];
    enhancedContext += `- Active hiring in: ${departments.join(', ')}\n`;
    const outsourcingJobs = companyData.jobPostings.filter((job) => job.isOutsourcingRelated);
    if (outsourcingJobs.length > 0) {
      enhancedContext += `- ${outsourcingJobs.length} outsourcing-related positions found\n`;
    }
  }

  if (companyData.keyPeople && companyData.keyPeople.length > 0) {
    enhancedContext += `\nKey Personnel:\n`;
    const cLevel = companyData.keyPeople.filter((p) => p.seniority === 'C-Level');
    const departments = [...new Set(companyData.keyPeople.map((p) => p.department).filter(Boolean))];
    enhancedContext += `- ${cLevel.length} C-level executives identified\n`;
    if (departments.length > 0) {
      enhancedContext += `- Key departments: ${departments.join(', ')}\n`;
    }
  }

  if (companyData.websiteContent) {
    const content = companyData.websiteContent;
    if (content.services && content.services.length > 0) {
      enhancedContext += `\nServices Offered: ${content.services.join(', ')}\n`;
    }
    if (content.technologies && content.technologies.length > 0) {
      enhancedContext += `\nTechnologies Used: ${content.technologies.join(', ')}\n`;
    }
  }

  if (companyData.socialMedia?.linkedin) {
    enhancedContext += `\nLinkedIn Data:\n`;
    enhancedContext += `- ${companyData.socialMedia.linkedin.employees} employees\n`;
    enhancedContext += `- Industry: ${companyData.socialMedia.linkedin.industry}\n`;
  }

  return `
Analyze the following company for their likelihood to outsource services. Use the comprehensive data provided to make an informed assessment.

Company Information:
- Name: ${companyName}
- Description: ${companyData.description || 'Not available'}
- Industry: ${companyData.industry || 'Not specified'}
- Website: ${companyData.website || 'Not available'}
${enhancedContext}

Please provide your analysis in the following JSON format:
{
  "outsourcingLikelihood": "High" | "Medium" | "Low",
  "reasoning": "2-3 sentence explanation based on the data provided",
  "possibleServices": ["service1", "service2", "service3"],
  "confidence": 85,
  "keyInsights": ["insight1", "insight2", "insight3"],
  "riskFactors": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"]
}

Enhanced Analysis Guidelines:
- Use recent news sentiment and content to gauge company stability and growth
- Consider job posting patterns (rapid hiring may indicate growth, specific roles may indicate outsourcing needs)
- Analyze key personnel structure (lean C-suite may indicate outsourcing preference)
- Factor in technology stack and services offered
- Consider company size indicators from social media data

Key Insights should include:
- Notable patterns from recent news or hiring
- Technology or service indicators
- Market position indicators

Risk Factors should include:
- Potential barriers to outsourcing (regulatory, security, etc.)
- Company characteristics that suggest in-house preference

Opportunities should include:
- Specific outsourcing scenarios that make sense
- Market conditions that favor outsourcing

Provide exactly 3-5 most relevant services they might outsource based on all available data.
`;
}

// Validate the OpenAI response structure
function validateAnalysisResponse(response: unknown): asserts response is OpenAIAnalysisResponse {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response format: Expected object');
  }

  const responseObj = response as Record<string, unknown>;

  if (!['High', 'Medium', 'Low'].includes(responseObj.outsourcingLikelihood as string)) {
    throw new Error('Invalid outsourcingLikelihood: Must be High, Medium, or Low');
  }

  if (!responseObj.reasoning || typeof responseObj.reasoning !== 'string' || responseObj.reasoning.trim().length === 0) {
    throw new Error('Invalid reasoning: Must be a non-empty string');
  }

  if (!Array.isArray(responseObj.possibleServices) || responseObj.possibleServices.length === 0) {
    throw new Error('Invalid possibleServices: Must be a non-empty array');
  }

  if (
    responseObj.possibleServices.some(
      (service: unknown) => typeof service !== 'string' || (service as string).trim().length === 0
    )
  ) {
    throw new Error('Invalid possibleServices: All services must be non-empty strings');
  }

  if (
    responseObj.confidence !== undefined &&
    (typeof responseObj.confidence !== 'number' || responseObj.confidence < 0 || responseObj.confidence > 100)
  ) {
    throw new Error('Invalid confidence: Must be a number between 0 and 100');
  }

  // Validate enhanced fields (optional)
  if (responseObj.keyInsights !== undefined) {
    if (!Array.isArray(responseObj.keyInsights)) {
      throw new Error('Invalid keyInsights: Must be an array');
    }
  }

  if (responseObj.riskFactors !== undefined) {
    if (!Array.isArray(responseObj.riskFactors)) {
      throw new Error('Invalid riskFactors: Must be an array');
    }
  }

  if (responseObj.opportunities !== undefined) {
    if (!Array.isArray(responseObj.opportunities)) {
      throw new Error('Invalid opportunities: Must be an array');
    }
  }
}

// Enhanced retry mechanism for transient failures with better error handling
export async function analyzeCompanyWithRetry(
  companyName: string,
  companyData: CompanyData,
  maxRetries: number = 3,
  baseDelay: number = 2000,
  maxDelay: number = 30000
): Promise<OpenAIAnalysisResponse> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`OpenAI analysis attempt ${attempt}/${maxRetries} for ${companyName}`);
      return await analyzeCompanyOutsourcing(companyName, companyData);
    } catch (error) {
      lastError = error as Error;

      // Don't retry for non-retryable errors (auth errors, validation errors, etc.)
      if (error && typeof error === 'object' && 'retryable' in error && !error.retryable) {
        console.log(`Non-retryable error for ${companyName}:`, error);
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        console.log(`Max retries reached for ${companyName}`);
        break;
      }

      // Enhanced exponential backoff with jitter for rate limiting
      const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.2 * exponentialDelay; // Add up to 20% jitter
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      console.log(`Retrying OpenAI analysis for ${companyName} after ${Math.round(delay)}ms (attempt ${attempt}/${maxRetries})`);

      // For rate limit errors, wait longer
      if (error && typeof error === 'object' && 'type' in error && error.type === 'RATE_LIMIT_ERROR') {
        const rateLimitDelay = Math.min(delay * 2, maxDelay); // Double the delay for rate limits
        console.log(`Rate limit detected, waiting ${Math.round(rateLimitDelay)}ms`);
        await new Promise((resolve) => setTimeout(resolve, rateLimitDelay));
      } else {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
