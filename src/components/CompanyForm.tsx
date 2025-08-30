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

    // Set loading state with enhanced messages
    const loadingMessages = [
      'Gathering company information...',
      'Fetching recent news and updates...',
      'Analyzing job postings and hiring trends...',
      'Identifying key personnel...',
      'Processing with AI analysis...',
      'Finalizing insights...',
    ];

    let messageIndex = 0;
    let messageInterval: NodeJS.Timeout | null = null;

    onLoadingChange({
      isLoading: true,
      message: loadingMessages[messageIndex],
    });

    // Update loading message every 3 seconds
    messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      onLoadingChange({
        isLoading: true,
        message: loadingMessages[messageIndex],
      });
    }, 3000);

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
      // Clear loading state and interval
      if (messageInterval) {
        clearInterval(messageInterval);
      }
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
    <div className='w-full'>
      <form onSubmit={handleSubmit} className='relative'>
        <div className='relative'>
          <input
            type='text'
            id='companyName'
            name='companyName'
            value={formData.companyName}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            placeholder='Start a message...'
            disabled={loadingState.isLoading}
            className={`
              w-full px-4 py-4 pr-12 border border-gray-200 rounded-lg text-base
              text-gray-900 placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400
              transition-all duration-200
              ${validationError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'}
            `}
            autoComplete='organization'
            maxLength={100}
          />
          <button
            type='submit'
            disabled={loadingState.isLoading || !!validationError || !formData.companyName.trim()}
            className={`
              absolute right-2 top-1/2 transform -translate-y-1/2
              w-8 h-8 rounded-md flex items-center justify-center
              transition-all duration-200
              ${
                loadingState.isLoading || !!validationError || !formData.companyName.trim()
                  ? 'bg-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            {loadingState.isLoading ? (
              <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
            ) : (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8' />
              </svg>
            )}
          </button>
        </div>

        {/* Validation Error Display */}
        {validationError && <div className='mt-2 text-sm text-red-600'>{validationError}</div>}
      </form>
    </div>
  );
}
