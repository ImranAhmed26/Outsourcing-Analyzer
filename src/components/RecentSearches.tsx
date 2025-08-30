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

  // Get badge color based on outsourcing likelihood
  const getBadgeColor = (likelihood: 'High' | 'Medium' | 'Low') => {
    switch (likelihood) {
      case 'High':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
      <div className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 ${className}`}>
        <div className='flex items-center mb-6'>
          <svg className='w-5 h-5 text-gray-600 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
          <h2 className='text-lg lg:text-xl font-semibold text-gray-900'>Recent Searches</h2>
        </div>
        <div className='space-y-3'>
          {/* Loading skeleton */}
          {[...Array(3)].map((_, index) => (
            <div key={index} className='animate-pulse'>
              <div className='flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100'>
                <div className='flex-1'>
                  <div className='h-4 bg-gray-300 rounded-lg w-32 mb-2'></div>
                  <div className='h-3 bg-gray-300 rounded-lg w-20'></div>
                </div>
                <div className='h-6 bg-gray-300 rounded-full w-20'></div>
              </div>
            </div>
          ))}
        </div>
        <div className='mt-6 text-center'>
          <div className='inline-flex items-center text-sm text-gray-500 bg-blue-50 px-4 py-2 rounded-full'>
            <div className='animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full'></div>
            Loading recent searches...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 ${className}`}>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center'>
          <svg className='w-5 h-5 text-gray-600 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
          <h2 className='text-lg lg:text-xl font-semibold text-gray-900'>Recent Searches</h2>
        </div>
        {recentSearches.length > 0 && (
          <button
            onClick={handleRefresh}
            className='p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200'
            title='Refresh recent searches'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
          </button>
        )}
      </div>

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
        <div className='text-center py-8 lg:py-12'>
          <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4'>
            <svg className='h-8 w-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
          </div>
          <h3 className='text-base font-semibold text-gray-900 mb-2'>No recent searches</h3>
          <p className='text-sm text-gray-500 leading-relaxed max-w-xs mx-auto'>
            Start by analyzing a company to see your search history here.
          </p>
        </div>
      )}

      {/* Recent searches list */}
      {!error && recentSearches.length > 0 && (
        <div className='space-y-3'>
          {recentSearches.map((search, index) => (
            <div
              key={search.id}
              className='group flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200 cursor-pointer'
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className='flex-1 min-w-0'>
                <div className='flex items-center mb-1'>
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      search.outsourcingLikelihood === 'High'
                        ? 'bg-green-500'
                        : search.outsourcingLikelihood === 'Medium'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  ></div>
                  <h3 className='text-sm font-semibold text-gray-900 truncate group-hover:text-blue-900'>{search.companyName}</h3>
                </div>
                <div className='flex items-center text-xs text-gray-500'>
                  <svg className='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  {formatDate(search.createdAt)}
                </div>
              </div>
              <div className='flex-shrink-0 ml-4'>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 shadow-sm transition-all duration-200 ${getBadgeColor(
                    search.outsourcingLikelihood
                  )} group-hover:shadow-md`}
                >
                  {search.outsourcingLikelihood}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer with count */}
      {!error && recentSearches.length > 0 && (
        <div className='mt-6 pt-4 border-t border-gray-100'>
          <div className='flex items-center justify-center text-xs text-gray-500'>
            <svg className='w-3 h-3 mr-1 text-blue-500' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.53a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z'
                clipRule='evenodd'
              />
            </svg>
            Showing {recentSearches.length} of your most recent searches
          </div>
        </div>
      )}
    </div>
  );
}
