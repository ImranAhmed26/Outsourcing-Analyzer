'use client';

import { useState, useEffect } from 'react';
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
  const fetchRecentSearches = async (retryCount: number = 0): Promise<void> => {
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
  };

  // Create a wrapper function for the refresh button
  const handleRefresh = () => {
    fetchRecentSearches();
  };

  // Fetch recent searches on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchRecentSearches();
  }, [refreshTrigger]); // fetchRecentSearches is stable, no need to include it

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>Recent Searches</h2>
        <div className='space-y-3'>
          {/* Loading skeleton */}
          {[...Array(3)].map((_, index) => (
            <div key={index} className='animate-pulse'>
              <div className='flex items-center justify-between p-3 border border-gray-100 rounded-lg'>
                <div className='flex-1'>
                  <div className='h-4 bg-gray-200 rounded w-32 mb-2'></div>
                  <div className='h-3 bg-gray-200 rounded w-20'></div>
                </div>
                <div className='h-6 bg-gray-200 rounded-full w-20'></div>
              </div>
            </div>
          ))}
        </div>
        <div className='mt-4 text-center'>
          <div className='inline-flex items-center text-sm text-gray-500'>
            <svg
              className='animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400'
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
            Loading recent searches...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-semibold text-gray-900'>Recent Searches</h2>
        {recentSearches.length > 0 && (
          <button
            onClick={handleRefresh}
            className='text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200'
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
        <div className='text-center py-8'>
          <svg className='mx-auto h-12 w-12 text-gray-400 mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
          <h3 className='text-sm font-medium text-gray-900 mb-1'>No recent searches</h3>
          <p className='text-sm text-gray-500'>Start by analyzing a company to see your search history here.</p>
        </div>
      )}

      {/* Recent searches list */}
      {!error && recentSearches.length > 0 && (
        <div className='space-y-3'>
          {recentSearches.map((search) => (
            <div
              key={search.id}
              className='flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-200'
            >
              <div className='flex-1 min-w-0'>
                <h3 className='text-sm font-medium text-gray-900 truncate'>{search.companyName}</h3>
                <p className='text-xs text-gray-500 mt-1'>{formatDate(search.createdAt)}</p>
              </div>
              <div className='flex-shrink-0 ml-4'>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getBadgeColor(
                    search.outsourcingLikelihood
                  )}`}
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
        <div className='mt-4 pt-4 border-t border-gray-100'>
          <p className='text-xs text-gray-500 text-center'>Showing {recentSearches.length} of your most recent searches</p>
        </div>
      )}
    </div>
  );
}
