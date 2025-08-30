'use client';

import { useState } from 'react';
import { AnalysisResult, LoadingState } from '@/types';
import CompanyForm from '@/components/CompanyForm';
import AnalysisCard from '@/components/AnalysisCard';
import RecentSearches from '@/components/RecentSearches';
import ErrorMessage from '@/components/ErrorMessage';
import SuccessMessage from '@/components/SuccessMessage';
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
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      {/* Header */}
      <header className='bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8'>
          <div className='text-center'>
            <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl gradient-text'>Outsourcing Analyzer</h1>
            <p className='mt-3 text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed'>
              Discover whether a company is likely to outsource services with AI-powered analysis
            </p>
            <div className='mt-4 flex justify-center'>
              <div className='flex items-center space-x-2 text-sm text-gray-500'>
                <svg className='w-4 h-4 text-blue-500' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>Powered by AI</span>
                <span className='text-gray-300'>•</span>
                <span>Instant Analysis</span>
                <span className='text-gray-300'>•</span>
                <span>Smart Insights</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12'>
        {/* Responsive Grid Layout */}
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8'>
          {/* Left Column - Company Form and Analysis Result */}
          <div className='xl:col-span-2 space-y-6 lg:space-y-8'>
            {/* Company Input Form */}
            <ErrorBoundary>
              <div className='bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 lg:p-8 card-hover'>
                <div className='text-center mb-6 lg:mb-8'>
                  <h2 className='text-xl lg:text-2xl font-semibold text-gray-900 mb-2'>Analyze a Company</h2>
                  <p className='text-gray-600 text-sm lg:text-base'>Enter a company name to get instant outsourcing insights</p>
                </div>
                <CompanyForm
                  onAnalysisResult={handleAnalysisResult}
                  onError={handleAnalysisError}
                  onSuccess={handleSuccess}
                  loadingState={loadingState}
                  onLoadingChange={handleLoadingChange}
                />
              </div>
            </ErrorBoundary>

            {/* Success Message Display */}
            {successMessage && (
              <SuccessMessage
                title='Analysis Complete'
                message={successMessage}
                type='success'
                onDismiss={handleDismissSuccess}
                className='shadow-lg card-hover'
              />
            )}

            {/* Warning Message Display */}
            {warningMessage && (
              <SuccessMessage
                title='Analysis Complete with Warning'
                message={warningMessage}
                type='warning'
                onDismiss={handleDismissWarning}
                className='shadow-lg card-hover'
              />
            )}

            {/* Error Display */}
            {error && (
              <ErrorMessage
                title='Analysis Failed'
                message={error}
                type='error'
                onRetry={handleRetry}
                className='shadow-lg card-hover'
              />
            )}

            {/* Analysis Result Display */}
            {currentAnalysis && !loadingState.isLoading && (
              <ErrorBoundary>
                <div className='space-y-4 lg:space-y-6'>
                  <div className='flex items-center justify-between'>
                    <h2 className='text-xl lg:text-2xl font-semibold text-gray-900'>Analysis Result</h2>
                    <div className='flex items-center text-sm text-gray-500'>
                      <svg className='w-4 h-4 mr-1 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.53a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z'
                          clipRule='evenodd'
                        />
                      </svg>
                      Analysis Complete
                    </div>
                  </div>
                  <AnalysisCard analysis={currentAnalysis} className='shadow-lg' />
                </div>
              </ErrorBoundary>
            )}

            {/* Loading State for Analysis */}
            {loadingState.isLoading && (
              <div className='bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-8 lg:p-12'>
                <div className='flex flex-col items-center justify-center space-y-6'>
                  <div className='relative'>
                    <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-200'></div>
                    <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0'></div>
                  </div>
                  <div className='text-center max-w-md'>
                    <h3 className='text-lg lg:text-xl font-medium text-gray-900 mb-2'>
                      {loadingState.message || 'Analyzing company...'}
                    </h3>
                    <p className='text-sm lg:text-base text-gray-500 leading-relaxed'>
                      This may take a few moments while we gather and analyze company data
                    </p>
                    <div className='mt-4 flex justify-center space-x-1'>
                      <div className='w-2 h-2 bg-blue-600 rounded-full animate-bounce'></div>
                      <div className='w-2 h-2 bg-blue-600 rounded-full animate-bounce' style={{ animationDelay: '0.1s' }}></div>
                      <div className='w-2 h-2 bg-blue-600 rounded-full animate-bounce' style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Welcome Message - Show when no analysis and not loading */}
            {!currentAnalysis && !loadingState.isLoading && !error && (
              <div className='bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-8 lg:p-12 card-hover'>
                <div className='text-center'>
                  <div className='mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-6'>
                    <svg className='h-10 w-10 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z'
                      />
                    </svg>
                  </div>
                  <h3 className='text-lg lg:text-xl font-medium text-gray-900 mb-3'>Ready to Analyze</h3>
                  <p className='text-gray-500 max-w-lg mx-auto leading-relaxed text-sm lg:text-base'>
                    Enter a company name above to get an AI-powered analysis of their outsourcing likelihood, complete with
                    reasoning and potential services they might outsource.
                  </p>
                  <div className='mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm'>
                    <div className='flex items-center justify-center space-x-2 text-gray-600'>
                      <svg className='w-5 h-5 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.53a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span>Instant Results</span>
                    </div>
                    <div className='flex items-center justify-center space-x-2 text-gray-600'>
                      <svg className='w-5 h-5 text-blue-500' fill='currentColor' viewBox='0 0 20 20'>
                        <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                      <span>AI-Powered</span>
                    </div>
                    <div className='flex items-center justify-center space-x-2 text-gray-600'>
                      <svg className='w-5 h-5 text-purple-500' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span>Detailed Insights</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Recent Searches */}
          <div className='xl:col-span-1'>
            <ErrorBoundary>
              <RecentSearches refreshTrigger={refreshTrigger} className='sticky top-24' />
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='bg-white/80 backdrop-blur-sm border-t border-gray-200/50 mt-16 lg:mt-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12'>
          <div className='text-center'>
            <div className='flex justify-center items-center space-x-2 text-sm text-gray-500 mb-4'>
              <svg className='w-4 h-4 text-blue-500' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z'
                  clipRule='evenodd'
                />
              </svg>
              <span>Powered by AI</span>
              <span className='text-gray-300'>•</span>
              <span>Built for quick outsourcing opportunity assessment</span>
            </div>
            <p className='text-xs text-gray-400'>© 2025 Outsourcing Analyzer. Analyze companies with confidence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
