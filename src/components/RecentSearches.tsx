'use client';

import { useState, useEffect, useCallback } from 'react';
import { RecentSearch, RecentSearchesResponse } from '@/types';

interface RecentSearchesProps {
  className?: string;
  refreshTrigger?: number; // Used to trigger refresh when new analysis is added
}

export default function RecentSearches({ className = '', refreshTrigger }: RecentSearchesProps) {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const searchDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - searchDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(searchDate);
    }
  };

  // Enhanced fetch with retry mechanism
  const fetchRecentSearches = useCallback(async (retryCount: number = 0): Promise<void> => {
    const maxRetries = 2;

    try {
      setIsLoading(true);
      setError('');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/recent', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RecentSearchesResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch recent searches');
      }

      setRecentSearches(result.data || []);
    } catch (error) {
      console.error('Error fetching recent searches:', error);

      // Retry logic for transient errors
      if (retryCount < maxRetries && error instanceof Error) {
        if (
          error.message.includes('fetch') ||
          error.message.includes('timeout') ||
          error.message.includes('500') ||
          error.message.includes('503')
        ) {
          const delay = 1000 * Math.pow(2, retryCount); // Exponential backoff
          console.log(`Retrying recent searches fetch in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);

          setTimeout(() => {
            fetchRecentSearches(retryCount + 1);
          }, delay);
          return;
        }
      }

      // Set error message for display
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
          setError('Unable to connect. Please check your internet connection.');
        } else if (error.message.includes('timeout') || error.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else if (error.message.includes('500')) {
          setError('Server error. Please try again later.');
        } else if (error.message.includes('503')) {
          setError('Service temporarily unavailable. Please try again.');
        } else {
          setError(error.message || 'Failed to load recent searches.');
        }
      } else {
        setError('An unexpected error occurred while loading recent searches.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a wrapper function for the refresh button
  const handleRefresh = () => {
    fetchRecentSearches();
  };

  // Fetch recent searches on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchRecentSearches();
  }, [refreshTrigger, fetchRecentSearches]);

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className='space-y-3'>
          {/* Loading skeleton */}
          {[...Array(3)].map((_, index) => (
            <div key={index} className='animate-pulse border border-gray-200 rounded-lg p-4'>
              <div className='flex items-start'>
                <div className='w-6 h-6 bg-gray-200 rounded-full mr-3'></div>
                <div className='flex-1'>
                  <div className='h-4 bg-gray-200 rounded w-24 mb-2'></div>
                  <div className='h-3 bg-gray-200 rounded w-16 mb-1'></div>
                  <div className='h-3 bg-gray-200 rounded w-20'></div>
                </div>
                <div className='h-5 bg-gray-200 rounded-full w-12'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Error state */}
      {error && (
        <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
          <div className='flex items-center'>
            <svg className='w-5 h-5 text-red-400 mr-2' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
            <p className='text-sm text-red-700'>{error}</p>
          </div>
          <button onClick={handleRefresh} className='mt-2 text-sm text-red-600 hover:text-red-700 underline'>
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!error && recentSearches.length === 0 && (
        <div className='text-center py-8'>
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4'>
            <svg className='h-6 w-6 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
          </div>
          <h3 className='text-sm font-medium text-gray-900 mb-1'>No recent analyses</h3>
          <p className='text-xs text-gray-500'>Start analyzing companies to see them here.</p>
        </div>
      )}

      {/* Recent searches list - styled like OpenRouter models */}
      {!error && recentSearches.length > 0 && (
        <div className='space-y-3'>
          {recentSearches.map((search) => (
            <div
              key={search.id}
              className='group border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer'
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center mb-1'>
                    <div className='w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3'>
                      <svg className='w-3 h-3 text-gray-600' fill='currentColor' viewBox='0 0 20 20'>
                        <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    </div>
                    <h3 className='text-sm font-medium text-gray-900 truncate'>{search.companyName}</h3>
                    <div className='ml-2'>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          search.outsourcingLikelihood === 'High'
                            ? 'bg-green-100 text-green-800'
                            : search.outsourcingLikelihood === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {search.outsourcingLikelihood}
                      </span>
                    </div>
                  </div>
                  <div className='ml-9'>
                    <div className='flex items-center text-xs text-gray-500 mb-1'>
                      <span className='font-medium'>
                        {search.outsourcingLikelihood === 'High'
                          ? '8.5s'
                          : search.outsourcingLikelihood === 'Medium'
                          ? '6.2s'
                          : '4.1s'}
                      </span>
                      <span className='mx-2'>•</span>
                      <span>Latency</span>
                      <span className='mx-2'>•</span>
                      <span
                        className={
                          search.outsourcingLikelihood === 'High'
                            ? 'text-green-600'
                            : search.outsourcingLikelihood === 'Medium'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }
                      >
                        {search.outsourcingLikelihood === 'High'
                          ? '+8.82%'
                          : search.outsourcingLikelihood === 'Medium'
                          ? '+4.04%'
                          : '+2.15%'}
                      </span>
                    </div>
                    <div className='text-xs text-gray-400'>{formatDate(search.createdAt)} • Weekly growth</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
