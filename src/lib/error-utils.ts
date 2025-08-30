// Error types for different failure scenarios
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  OPENAI_ERROR = 'OPENAI_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  retryable?: boolean;
}

// User-friendly error messages mapping
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection and try again.',
  [ErrorType.API_ERROR]: 'There was a problem with our service. Please try again in a few moments.',
  [ErrorType.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorType.EXTERNAL_API_ERROR]: "We're having trouble getting company information. The analysis may be limited.",
  [ErrorType.OPENAI_ERROR]: 'Our AI analysis service is temporarily unavailable. Please try again later.',
  [ErrorType.DATABASE_ERROR]: "We couldn't save your analysis to history, but you can still view the results.",
  [ErrorType.UNKNOWN_ERROR]: 'Something unexpected happened. Please try again or contact support if the problem persists.',
};

export function createAppError(type: ErrorType, originalError?: Error, customMessage?: string): AppError {
  return {
    type,
    message: customMessage || ERROR_MESSAGES[type],
    originalError,
    retryable: [ErrorType.NETWORK_ERROR, ErrorType.API_ERROR, ErrorType.EXTERNAL_API_ERROR, ErrorType.OPENAI_ERROR].includes(
      type
    ),
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific error patterns with more comprehensive matching
    if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      return ERROR_MESSAGES[ErrorType.NETWORK_ERROR];
    }
    if (error.message.includes('OpenAI') || error.message.includes('AI') || error.message.includes('analysis')) {
      return ERROR_MESSAGES[ErrorType.OPENAI_ERROR];
    }
    if (error.message.includes('Supabase') || error.message.includes('database') || error.message.includes('save')) {
      return ERROR_MESSAGES[ErrorType.DATABASE_ERROR];
    }
    if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      return 'The request took too long to complete. Please try again.';
    }
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'Authentication error. Please refresh the page and try again.';
    }
    if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
      return 'Service temporarily unavailable. Please try again in a few minutes.';
    }
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR];
}

// Enhanced error categorization for better user experience
export function categorizeError(error: unknown): { type: ErrorType; isRetryable: boolean; suggestedAction: string } {
  if (error instanceof Error) {
    if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        isRetryable: true,
        suggestedAction: 'Check your internet connection and try again.',
      };
    }
    if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        isRetryable: true,
        suggestedAction: 'The request timed out. Try again or use a shorter company name.',
      };
    }
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return {
        type: ErrorType.API_ERROR,
        isRetryable: true,
        suggestedAction: 'Wait a few minutes before trying again.',
      };
    }
    if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
      return {
        type: ErrorType.API_ERROR,
        isRetryable: true,
        suggestedAction: 'Service is temporarily down. Try again later.',
      };
    }
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return {
        type: ErrorType.API_ERROR,
        isRetryable: false,
        suggestedAction: 'Refresh the page and try again.',
      };
    }
  }

  return {
    type: ErrorType.UNKNOWN_ERROR,
    isRetryable: true,
    suggestedAction: 'Try again or contact support if the problem persists.',
  };
}

export function isRetryableError(error: AppError | Error | unknown): boolean {
  if (error && typeof error === 'object' && 'type' in error) {
    const appError = error as AppError;
    return appError.retryable ?? false;
  }

  if (error instanceof Error) {
    // Network errors and temporary service errors are typically retryable
    return (
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.message.includes('503') ||
      error.message.includes('502')
    );
  }

  return false;
}
