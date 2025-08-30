import { CompanyData, DuckDuckGoResponse, WikipediaResponse, ExternalApiError, ErrorType } from '@/types';

// Configuration constants
const API_TIMEOUT = 10000; // 10 seconds for external APIs
const CLEARBIT_LOGO_BASE_URL = 'https://logo.clearbit.com';
const DUCKDUCKGO_API_URL = 'https://api.duckduckgo.com';
const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';

/**
 * Creates a fetch request with timeout
 */
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Creates a standardized external API error
 */
export function createExternalApiError(
  apiName: 'DuckDuckGo' | 'Wikipedia' | 'Clearbit' | 'NewsAPI' | 'LinkedIn' | 'Indeed' | 'Glassdoor',
  message: string,
  statusCode: number = 500,
  details?: string
): ExternalApiError {
  return {
    type: ErrorType.EXTERNAL_API_ERROR,
    apiName,
    message,
    statusCode,
    details,
    retryable: statusCode >= 500 || statusCode === 429, // Server errors and rate limits are retryable
  };
}

/**
 * Extracts domain from company name for logo API
 */
function extractDomainFromCompanyName(companyName: string): string {
  // Simple heuristic: convert company name to potential domain
  // Remove common suffixes and convert to lowercase
  const cleanName = companyName
    .toLowerCase()
    .replace(/\s+(inc|corp|corporation|ltd|limited|llc|co|company)\.?$/i, '')
    .replace(/[^a-z0-9]/g, '');

  return `${cleanName}.com`;
}

/**
 * Fetches company data from DuckDuckGo Instant Answer API
 */
export async function fetchDuckDuckGoData(companyName: string): Promise<Partial<CompanyData>> {
  try {
    const encodedQuery = encodeURIComponent(companyName);
    const url = `${DUCKDUCKGO_API_URL}/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw createExternalApiError(
        'DuckDuckGo',
        `DuckDuckGo API returned ${response.status}`,
        response.status,
        `Failed to fetch data for company: ${companyName}`
      );
    }

    const data: DuckDuckGoResponse = await response.json();

    // Extract relevant information from DuckDuckGo response
    const companyData: Partial<CompanyData> = {
      name: companyName,
    };

    // Use Abstract or Definition as description
    if (data.Abstract) {
      companyData.description = data.Abstract;
    } else if (data.Definition) {
      companyData.description = data.Definition;
    }

    // Try to extract website from AbstractURL or DefinitionURL
    if (data.AbstractURL) {
      try {
        const url = new URL(data.AbstractURL);
        companyData.website = url.hostname;
      } catch {
        // Invalid URL, ignore
      }
    } else if (data.DefinitionURL) {
      try {
        const url = new URL(data.DefinitionURL);
        companyData.website = url.hostname;
      } catch {
        // Invalid URL, ignore
      }
    }

    return companyData;
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timeout') {
      throw createExternalApiError(
        'DuckDuckGo',
        'DuckDuckGo API request timed out',
        408,
        `Timeout after ${API_TIMEOUT}ms for company: ${companyName}`
      );
    }

    if (error instanceof Error && error.name === 'TypeError') {
      throw createExternalApiError('DuckDuckGo', 'Network error connecting to DuckDuckGo API', 0, error.message);
    }

    // Re-throw if it's already an ExternalApiError
    if (error && typeof error === 'object' && 'type' in error && error.type === ErrorType.EXTERNAL_API_ERROR) {
      throw error;
    }

    throw createExternalApiError(
      'DuckDuckGo',
      'Unexpected error fetching from DuckDuckGo API',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Fetches additional company context from Wikipedia API
 */
export async function fetchWikipediaData(companyName: string): Promise<Partial<CompanyData>> {
  try {
    const encodedQuery = encodeURIComponent(companyName);
    const url = `${WIKIPEDIA_API_URL}/${encodedQuery}`;

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      // Wikipedia returns 404 for non-existent pages, which is expected
      if (response.status === 404) {
        return { name: companyName }; // Return minimal data, not an error
      }

      throw createExternalApiError(
        'Wikipedia',
        `Wikipedia API returned ${response.status}`,
        response.status,
        `Failed to fetch data for company: ${companyName}`
      );
    }

    const data: WikipediaResponse = await response.json();

    const companyData: Partial<CompanyData> = {
      name: companyName,
    };

    // Use extract as description if available
    if (data.extract) {
      companyData.description = data.extract;
    }

    // Use description field if available and no extract
    if (!companyData.description && data.description) {
      companyData.description = data.description;
    }

    return companyData;
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timeout') {
      throw createExternalApiError(
        'Wikipedia',
        'Wikipedia API request timed out',
        408,
        `Timeout after ${API_TIMEOUT}ms for company: ${companyName}`
      );
    }

    if (error instanceof Error && error.name === 'TypeError') {
      throw createExternalApiError('Wikipedia', 'Network error connecting to Wikipedia API', 0, error.message);
    }

    // Re-throw if it's already an ExternalApiError
    if (error && typeof error === 'object' && 'type' in error && error.type === ErrorType.EXTERNAL_API_ERROR) {
      throw error;
    }

    throw createExternalApiError(
      'Wikipedia',
      'Unexpected error fetching from Wikipedia API',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Fetches company logo from Clearbit Logo API with fallback handling
 */
export async function fetchClearbitLogo(companyName: string, website?: string): Promise<string | null> {
  try {
    // Use provided website or extract domain from company name
    const domain = website || extractDomainFromCompanyName(companyName);
    const url = `${CLEARBIT_LOGO_BASE_URL}/${domain}`;

    const response = await fetchWithTimeout(url, { method: 'HEAD' }); // Use HEAD to check if logo exists

    if (response.ok) {
      return url;
    }

    // If the primary domain doesn't work, try a few common variations
    if (!website) {
      const variations = [
        `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        `${companyName.toLowerCase().replace(/\s+/g, '')}.org`,
        `${companyName.toLowerCase().replace(/\s+/g, '')}.net`,
      ];

      for (const variation of variations) {
        try {
          const variationUrl = `${CLEARBIT_LOGO_BASE_URL}/${variation}`;
          const variationResponse = await fetchWithTimeout(variationUrl, { method: 'HEAD' });

          if (variationResponse.ok) {
            return variationUrl;
          }
        } catch {
          // Continue to next variation
          continue;
        }
      }
    }

    // No logo found, return null (fallback will be handled by UI)
    return null;
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timeout') {
      throw createExternalApiError(
        'Clearbit',
        'Clearbit Logo API request timed out',
        408,
        `Timeout after ${API_TIMEOUT}ms for company: ${companyName}`
      );
    }

    if (error instanceof Error && error.name === 'TypeError') {
      // Network errors for logo API are not critical, return null
      console.warn(`Network error fetching logo for ${companyName}:`, error.message);
      return null;
    }

    // For logo API, most errors should not be thrown as they're not critical
    // Log the error and return null for fallback handling
    console.warn(`Error fetching logo for ${companyName}:`, error);
    return null;
  }
}

/**
 * Aggregates company data from multiple external APIs
 * Implements graceful degradation - continues with available data if some APIs fail
 */
export async function fetchCompanyData(companyName: string): Promise<CompanyData> {
  // Use retry mechanism for each API call
  const results = await Promise.allSettled([
    retryExternalApiCall('DuckDuckGo', () => fetchDuckDuckGoData(companyName)),
    retryExternalApiCall('Wikipedia', () => fetchWikipediaData(companyName)),
    retryExternalApiCall('Clearbit', () => fetchClearbitLogo(companyName)),
  ]);

  // Initialize with company name
  const aggregatedData: CompanyData = {
    name: companyName,
  };

  // Process DuckDuckGo results
  if (results[0].status === 'fulfilled') {
    const duckDuckGoData = results[0].value;
    if (duckDuckGoData.description) {
      aggregatedData.description = duckDuckGoData.description;
    }
    if (duckDuckGoData.website) {
      aggregatedData.website = duckDuckGoData.website;
    }
  } else {
    console.warn('DuckDuckGo API failed:', results[0].reason);
  }

  // Process Wikipedia results (prefer Wikipedia description if available)
  if (results[1].status === 'fulfilled') {
    const wikipediaData = results[1].value;
    if (wikipediaData.description) {
      // Wikipedia descriptions are often more comprehensive
      aggregatedData.description = wikipediaData.description;
    }
  } else {
    console.warn('Wikipedia API failed:', results[1].reason);
  }

  // Process Clearbit logo results
  if (results[2].status === 'fulfilled') {
    const logoUrl = results[2].value;
    if (logoUrl) {
      aggregatedData.logoUrl = logoUrl;
    }
  } else {
    console.warn('Clearbit Logo API failed:', results[2].reason);
  }

  // If we have a website but no logo, try fetching logo with the website (with retry)
  if (aggregatedData.website && !aggregatedData.logoUrl) {
    try {
      const logoUrl = await retryExternalApiCall('Clearbit', () => fetchClearbitLogo(companyName, aggregatedData.website));
      if (logoUrl) {
        aggregatedData.logoUrl = logoUrl;
      }
    } catch (error) {
      console.warn('Failed to fetch logo with website domain after retries:', error);
    }
  }

  return aggregatedData;
}

/**
 * Utility function to check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'retryable' in error) {
    return Boolean(error.retryable);
  }
  return false;
}

/**
 * Utility function to implement exponential backoff retry logic with jitter
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === maxRetries || !isRetryableError(error)) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.1 * exponentialDelay; // Add up to 10% jitter
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      console.log(`Retrying after ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Enhanced retry mechanism specifically for external API calls
 */
export async function retryExternalApiCall<T>(apiName: string, fn: () => Promise<T>, maxRetries: number = 2): Promise<T> {
  return retryWithBackoff(
    async () => {
      try {
        return await fn();
      } catch (error) {
        // Log the attempt for debugging
        console.warn(`${apiName} API call failed:`, error);
        throw error;
      }
    },
    maxRetries,
    1000, // 1 second base delay
    5000 // 5 second max delay
  );
}
