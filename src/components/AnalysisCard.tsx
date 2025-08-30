'use client';

import { AnalysisResult } from '@/types';
import Image from 'next/image';
import { useState } from 'react';

interface AnalysisCardProps {
  analysis: AnalysisResult;
  className?: string;
}

export default function AnalysisCard({ analysis, className = '' }: AnalysisCardProps) {
  const [logoError, setLogoError] = useState(false);

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
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // Handle logo error
  const handleLogoError = () => {
    setLogoError(true);
  };

  return (
    <div
      className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 lg:p-8 card-hover ${className}`}
    >
      {/* Header with logo and company name */}
      <div className='flex items-start space-x-4 lg:space-x-6 mb-6'>
        {/* Company Logo */}
        <div className='flex-shrink-0'>
          {analysis.logoUrl && !logoError ? (
            <div className='relative w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200'>
              <Image
                src={analysis.logoUrl}
                alt={`${analysis.companyName} logo`}
                fill
                className='object-contain p-2 lg:p-3'
                onError={handleLogoError}
                sizes='(max-width: 768px) 64px, 80px'
              />
            </div>
          ) : (
            // Fallback logo placeholder
            <div className='w-16 h-16 lg:w-20 lg:h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center shadow-sm'>
              <svg
                className='w-8 h-8 lg:w-10 lg:h-10 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                />
              </svg>
            </div>
          )}
        </div>

        {/* Company name and likelihood badge */}
        <div className='flex-1 min-w-0'>
          <h3 className='text-xl lg:text-2xl font-bold text-gray-900 truncate mb-3'>{analysis.companyName}</h3>
          <div className='flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0'>
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 shadow-sm ${getBadgeColor(
                analysis.outsourcingLikelihood
              )}`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  analysis.outsourcingLikelihood === 'High'
                    ? 'bg-green-500'
                    : analysis.outsourcingLikelihood === 'Medium'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              ></div>
              {analysis.outsourcingLikelihood} Likelihood
            </span>
            <div className='flex items-center text-sm text-gray-500'>
              <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              {formatDate(analysis.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis reasoning */}
      <div className='mb-6'>
        <div className='flex items-center mb-3'>
          <svg className='w-5 h-5 text-blue-600 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
            />
          </svg>
          <h4 className='text-lg font-semibold text-gray-800'>AI Analysis</h4>
        </div>
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-blue-500'>
          <p className='text-gray-700 leading-relaxed text-sm lg:text-base'>{analysis.reasoning}</p>
        </div>
      </div>

      {/* Possible services to outsource */}
      {analysis.possibleServices && analysis.possibleServices.length > 0 && (
        <div className='mb-6'>
          <div className='flex items-center mb-3'>
            <svg className='w-5 h-5 text-purple-600 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
              />
            </svg>
            <h4 className='text-lg font-semibold text-gray-800'>Potential Outsourcing Services</h4>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
            {analysis.possibleServices.map((service, index) => (
              <div
                key={index}
                className='group flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200 hover:from-purple-100 hover:to-pink-100 transition-all duration-200 hover:shadow-sm'
              >
                <svg className='w-4 h-4 mr-2 text-purple-500 group-hover:text-purple-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.53a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z'
                    clipRule='evenodd'
                  />
                </svg>
                {service}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis ID for reference (hidden by default, useful for debugging) */}
      <div className='mt-6 pt-4 border-t border-gray-100'>
        <div className='flex justify-between items-center'>
          <p className='text-xs text-gray-400'>Analysis ID: {analysis.id}</p>
          <div className='flex items-center text-xs text-gray-500'>
            <svg className='w-3 h-3 mr-1 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.53a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z'
                clipRule='evenodd'
              />
            </svg>
            Verified Analysis
          </div>
        </div>
      </div>
    </div>
  );
}
