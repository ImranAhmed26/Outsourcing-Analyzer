'use client';

import { useState } from 'react';
import { AnalysisResult, LoadingState } from '@/types';
import CompanyForm from '@/components/CompanyForm';
import AnalysisCard from '@/components/AnalysisCard';
import RecentSearches from '@/components/RecentSearches';

import ErrorBoundary from '@/components/ErrorBoundary';

export default function Home() {
  // State management for current analysis and UI states
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false });
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Handle successful analysis result
  const handleAnalysisResult = (result: AnalysisResult, hasWarning?: boolean) => {
    setCurrentAnalysis(result);
    setError(''); // Clear any previous errors
    setWarningMessage(''); // Clear any previous warnings

    // Show warning if analysis completed but couldn't save to history
    if (hasWarning) {
      setWarningMessage(`Analysis completed for ${result.companyName}, but couldn't save to history.`);
    }

    // Trigger refresh of recent searches to include the new analysis
    setRefreshTrigger((prev) => prev + 1);
  };

  // Handle analysis errors
  const handleAnalysisError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentAnalysis(null); // Clear current analysis on error
    setSuccessMessage(''); // Clear any success messages
    setWarningMessage(''); // Clear any warning messages
  };

  // Handle success messages
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setError(''); // Clear any previous errors
  };

  // Handle loading state changes
  const handleLoadingChange = (loading: LoadingState) => {
    setLoadingState(loading);
  };

  // Clear error and retry
  const handleRetry = () => {
    setError('');
  };

  // Clear success message
  const handleDismissSuccess = () => {
    setSuccessMessage('');
  };

  // Clear warning message
  const handleDismissWarning = () => {
    setWarningMessage('');
  };

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <header className='border-b border-gray-100 sticky top-0 bg-white'>
        <div className='max-w-6xl mx-auto px-6 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center'>
                <svg className='w-5 h-5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <span className='text-2xl p-0 font-bold text-orange-500'>Outsourcing</span>
              <span className='text-2xl font-bold text-gray-700'>Analyzer </span>
            </div>
            <nav className='hidden md:flex items-center space-x-8 text-sm text-gray-600'>
              <a href='#' className='hover:text-gray-900 transition-colors'>
                Docs
              </a>
              <button className='text-gray-900 font-medium'>Sign in</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-6xl mx-auto px-6 py-16'>
        {/* Hero Section */}
        <div className='text-center mb-16'>
          <h1 className='text-5xl font-bold text-gray-700 mb-6'>
            Validate <span className='text-orange-400'>Business Leads</span> Easily with{' '}
            <span className='text-orange-400'>AI</span> <br />
            <span className='text-3xl'> Looking for Outsourcing Services </span>
          </h1>

          <p className='text-xl text-gray-600 mb-12'>
            Better <span className='text-blue-600'>insights</span>, better <span className='text-blue-600'>accuracy</span>, more 
            <span className='text-blue-600'> conversion</span>
          </p>

          {/* Search Input */}
          <div className='max-w-2xl mx-auto mb-16'>
            <ErrorBoundary>
              <CompanyForm
                onAnalysisResult={handleAnalysisResult}
                onError={handleAnalysisError}
                onSuccess={handleSuccess}
                loadingState={loadingState}
                onLoadingChange={handleLoadingChange}
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-6 gap-8'>
          {/* Left Column - Analysis Results (4/5 width) */}
          <div className='lg:col-span-4 space-y-6'>
            {/* Success Message Display */}
            {successMessage && (
              <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
                <p className='text-sm text-green-700'>{successMessage}</p>
                <button onClick={handleDismissSuccess} className='mt-2 text-xs text-green-600 hover:text-green-700 underline'>
                  Dismiss
                </button>
              </div>
            )}

            {/* Warning Message Display */}
            {warningMessage && (
              <div className='mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                <p className='text-sm text-yellow-700'>{warningMessage}</p>
                <button onClick={handleDismissWarning} className='mt-2 text-xs text-yellow-600 hover:text-yellow-700 underline'>
                  Dismiss
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
                <p className='text-sm text-red-700'>{error}</p>
                <button onClick={handleRetry} className='mt-2 text-xs text-red-600 hover:text-red-700 underline'>
                  Try again
                </button>
              </div>
            )}

            {/* Analysis Result Display */}
            {currentAnalysis && !loadingState.isLoading && (
              <ErrorBoundary>
                <AnalysisCard analysis={currentAnalysis} />
              </ErrorBoundary>
            )}

            {/* Loading State for Analysis */}
            {loadingState.isLoading && (
              <div className='bg-white border border-gray-200 rounded-lg p-8 text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4'></div>
                <p className='text-gray-600'>{loadingState.message || 'Analyzing company...'}</p>
              </div>
            )}
          </div>

          {/* Right Column - Analysis History (1/5 width) */}
          <div className='lg:col-span-2'>
            <div className='mb-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>Analysis History</h3>
                <a href='#' className='text-sm text-blue-600 hover:text-blue-700'>
                  View All →
                </a>
              </div>

              <ErrorBoundary>
                <RecentSearches refreshTrigger={refreshTrigger} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
