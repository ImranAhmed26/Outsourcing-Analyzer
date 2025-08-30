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
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='text-center'>
            <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>Outsourcing Analyzer</h1>
            <p className='mt-2 text-lg text-gray-600 max-w-2xl mx-auto'>
              Discover whether a company is likely to outsource services with AI-powered analysis
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Responsive Grid Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Column - Company Form and Analysis Result */}
          <div className='lg:col-span-2 space-y-8'>
            {/* Company Input Form */}
            <ErrorBoundary>
              <div className='bg-white rounded-lg shadow-lg border border-gray-200 p-6'>
                <h2 className='text-xl font-semibold text-gray-900 mb-6 text-center'>Analyze a Company</h2>
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
                className='shadow-lg'
              />
            )}

            {/* Warning Message Display */}
            {warningMessage && (
              <SuccessMessage
                title='Analysis Complete with Warning'
                message={warningMessage}
                type='warning'
                onDismiss={handleDismissWarning}
                className='shadow-lg'
              />
            )}

            {/* Error Display */}
            {error && (
              <ErrorMessage title='Analysis Failed' message={error} type='error' onRetry={handleRetry} className='shadow-lg' />
            )}

            {/* Analysis Result Display */}
            {currentAnalysis && !loadingState.isLoading && (
              <ErrorBoundary>
                <div className='space-y-4'>
                  <h2 className='text-xl font-semibold text-gray-900'>Analysis Result</h2>
                  <AnalysisCard analysis={currentAnalysis} className='shadow-lg' />
                </div>
              </ErrorBoundary>
            )}

            {/* Loading State for Analysis */}
            {loadingState.isLoading && (
              <div className='bg-white rounded-lg shadow-lg border border-gray-200 p-8'>
                <div className='flex flex-col items-center justify-center space-y-4'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
                  <div className='text-center'>
                    <h3 className='text-lg font-medium text-gray-900'>{loadingState.message || 'Analyzing company...'}</h3>
                    <p className='text-sm text-gray-500 mt-1'>
                      This may take a few moments while we gather and analyze company data
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Welcome Message - Show when no analysis and not loading */}
            {!currentAnalysis && !loadingState.isLoading && !error && (
              <div className='bg-white rounded-lg shadow-lg border border-gray-200 p-8'>
                <div className='text-center'>
                  <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4'>
                    <svg className='h-8 w-8 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z'
                      />
                    </svg>
                  </div>
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>Ready to Analyze</h3>
                  <p className='text-gray-500 max-w-md mx-auto'>
                    Enter a company name above to get an AI-powered analysis of their outsourcing likelihood, complete with
                    reasoning and potential services they might outsource.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Recent Searches */}
          <div className='lg:col-span-1'>
            <ErrorBoundary>
              <RecentSearches refreshTrigger={refreshTrigger} className='sticky top-8' />
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='bg-white border-t border-gray-200 mt-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='text-center text-sm text-gray-500'>
            <p>Powered by AI • Built for quick outsourcing opportunity assessment</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
