import { getErrorMessage, categorizeError, ErrorType } from '../error-utils';

describe('Error Handling Utilities', () => {
  describe('getErrorMessage', () => {
    it('should return network error message for fetch errors', () => {
      const error = new Error('fetch failed');
      const message = getErrorMessage(error);
      expect(message).toContain('Unable to connect');
    });

    it('should return timeout error message for timeout errors', () => {
      const error = new Error('timeout occurred');
      const message = getErrorMessage(error);
      expect(message).toContain('took too long');
    });

    it('should return rate limit error message for 429 errors', () => {
      const error = new Error('429 rate limit exceeded');
      const message = getErrorMessage(error);
      expect(message).toContain('Too many requests');
    });

    it('should return OpenAI error message for AI-related errors', () => {
      const error = new Error('OpenAI API failed');
      const message = getErrorMessage(error);
      expect(message).toContain('AI analysis service');
    });

    it('should return database error message for database errors', () => {
      const error = new Error('Supabase connection failed');
      const message = getErrorMessage(error);
      expect(message).toContain('save your analysis');
    });

    it('should return the original message for unknown errors', () => {
      const error = new Error('Custom error message');
      const message = getErrorMessage(error);
      expect(message).toBe('Custom error message');
    });

    it('should handle string errors', () => {
      const message = getErrorMessage('String error');
      expect(message).toBe('String error');
    });

    it('should handle unknown error types', () => {
      const message = getErrorMessage(null);
      expect(message).toContain('unexpected happened');
    });
  });

  describe('categorizeError', () => {
    it('should categorize network errors correctly', () => {
      const error = new Error('fetch failed');
      const category = categorizeError(error);
      expect(category.type).toBe(ErrorType.NETWORK_ERROR);
      expect(category.isRetryable).toBe(true);
      expect(category.suggestedAction).toContain('internet connection');
    });

    it('should categorize timeout errors correctly', () => {
      const error = new Error('timeout occurred');
      const category = categorizeError(error);
      expect(category.type).toBe(ErrorType.NETWORK_ERROR);
      expect(category.isRetryable).toBe(true);
      expect(category.suggestedAction).toContain('timed out');
    });

    it('should categorize rate limit errors correctly', () => {
      const error = new Error('429 rate limit');
      const category = categorizeError(error);
      expect(category.type).toBe(ErrorType.API_ERROR);
      expect(category.isRetryable).toBe(true);
      expect(category.suggestedAction).toContain('Wait a few minutes');
    });

    it('should categorize auth errors as non-retryable', () => {
      const error = new Error('401 Unauthorized');
      const category = categorizeError(error);
      expect(category.type).toBe(ErrorType.API_ERROR);
      expect(category.isRetryable).toBe(false);
      expect(category.suggestedAction).toContain('Refresh the page');
    });

    it('should categorize service unavailable errors correctly', () => {
      const error = new Error('503 Service Unavailable');
      const category = categorizeError(error);
      expect(category.type).toBe(ErrorType.API_ERROR);
      expect(category.isRetryable).toBe(true);
      expect(category.suggestedAction).toContain('Try again later');
    });

    it('should handle unknown errors', () => {
      const category = categorizeError('unknown');
      expect(category.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(category.isRetryable).toBe(true);
      expect(category.suggestedAction).toContain('contact support');
    });
  });
});
