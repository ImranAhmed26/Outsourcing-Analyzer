'use client';

import { useState, useCallback, useRef } from 'react';
import { CompanyFormData, LoadingState, AnalysisResult, ApiResponse } from '@/types';

interface CompanyFormProps {
  onAnalysisResult: (result: AnalysisResult, hasWarning?: boolean) => void;
  onError: (error: string) => void;
  onSuccess?: (message: string) => void;
  loadingState: LoadingState;
  onLoadingChange: (loading: LoadingState) => void;
}

export default function CompanyForm({ onAnalysisResult, onError, onSuccess, loadingState, onLoadingChange }: CompanyFormProps) {
  const [formData, setFormData] = useState<CompanyFormData>({ companyName: '' });
  const [validationError, setValidationError] = useState<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Client-side validation
  const validateInput = useCallback((companyName: string): boolean => {
    if (!companyName.trim()) {
      setValidationError('Company name is required');
      return false;
    }

    if (companyName.trim().length < 2) {
      setValidationError('Company name must be at least 2 characters long');
      return false;
    }

    if (companyName.trim().length > 100) {
      setValidationError('Company name must be less than 100 characters');
      return false;
    }

    // Basic validation for reasonable company name format
    const validNamePattern = /^[a-zA-Z0-9\s\-&.,()]+$/;
    if (!validNamePattern.test(companyName.trim())) {
      setValidationError('Company name contains invalid characters');
      return false;
    }

    setValidationError('');
    return true;
  }, []);

  // Debounced input handler
  const handleInputChange = useCallback(
    (value: string) => {
      setFormData({ companyName: value });

      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout for validation
      debounceTimeoutRef.current = setTimeout(() => {
        if (value.trim()) {
          validateInput(value);
        } else {
          setValidationError('');
        }
      }, 300); // 300ms debounce delay
    },
    [validateInput]
  );

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const companyName = formData.companyName.trim();

    // Validate input before submission
    if (!validateInput(companyName)) {
      return;
    }

    // Clear any previous errors
    onError('');

    // Set loading state
    onLoadingChange({
      isLoading: true,
      message: 'Analyzing company...',
    });

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<AnalysisResult> & { warning?: string } = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Check for warnings (e.g., analysis completed but couldn't save to history)
      const hasWarning = !!result.warning;

      // Success - pass result to parent
      onAnalysisResult(result.data, hasWarning);

      // Show success message
      if (onSuccess) {
        if (hasWarning) {
          onSuccess(`Analysis completed for ${result.data.companyName}, but couldn't save to history.`);
        } else {
          onSuccess(`Successfully analyzed ${result.data.companyName} and saved to history.`);
        }
      }

      // Clear form
      setFormData({ companyName: '' });
      setValidationError('');
    } catch (error) {
      console.error('Analysis error:', error);

      // Enhanced error handling with more specific messages
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
          onError('Unable to connect to our servers. Please check your internet connection and try again.');
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          onError('Our AI service is currently busy. Please wait a few minutes and try again.');
        } else if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
          onError('Our analysis service is temporarily unavailable. Please try again in a few minutes.');
        } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          onError('We encountered a server error. Our team has been notified. Please try again later.');
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          onError('Authentication error. Please refresh the page and try again.');
        } else if (error.message.includes('timeout')) {
          onError('The request took too long to complete. Please try again with a shorter company name.');
        } else if (error.message.includes('AI analysis') || error.message.includes('OpenAI')) {
          onError('Our AI analysis service is temporarily unavailable. Please try again later.');
        } else if (error.message.includes('company information') || error.message.includes('external')) {
          onError('We had trouble gathering company information, but you can still try the analysis.');
        } else {
          onError(error.message || 'An unexpected error occurred. Please try again.');
        }
      } else {
        onError('An unexpected error occurred. Please try again.');
      }
    } finally {
      // Clear loading state
      onLoadingChange({
        isLoading: false,
      });
    }
  };

  // Clear validation error when user starts typing after an error
  const handleFocus = () => {
    if (validationError && formData.companyName.trim()) {
      setValidationError('');
    }
  };

  return (
    <div className='w-full max-w-md mx-auto'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label htmlFor='companyName' className='block text-sm font-medium text-gray-700 mb-2'>
            Company Name
          </label>
          <input
            type='text'
            id='companyName'
            name='companyName'
            value={formData.companyName}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            placeholder='Enter company name (e.g., Apple, Microsoft)'
            disabled={loadingState.isLoading}
            className={`
              w-full px-4 py-3 border rounded-lg shadow-sm
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors duration-200
              ${validationError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
            `}
            autoComplete='organization'
            maxLength={100}
          />

          {/* Validation Error Display */}
          {validationError && (
            <p className='mt-2 text-sm text-red-600 flex items-center'>
              <svg className='w-4 h-4 mr-1 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
              {validationError}
            </p>
          )}

          {/* Character Counter */}
          <p className='mt-1 text-xs text-gray-500'>{formData.companyName.length}/100 characters</p>
        </div>

        <button
          type='submit'
          disabled={loadingState.isLoading || !!validationError || !formData.companyName.trim()}
          className={`
            w-full py-3 px-4 rounded-lg font-medium text-white
            transition-all duration-200 flex items-center justify-center
            ${
              loadingState.isLoading || !!validationError || !formData.companyName.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }
          `}
        >
          {loadingState.isLoading ? (
            <>
              <svg
                className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
              {loadingState.message || 'Analyzing...'}
            </>
          ) : (
            'Analyze Company'
          )}
        </button>
      </form>

      {/* Loading Message */}
      {loadingState.isLoading && loadingState.message && (
        <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <p className='text-sm text-blue-700 text-center'>{loadingState.message}</p>
        </div>
      )}
    </div>
  );
}
