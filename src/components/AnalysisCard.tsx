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
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Header with logo and company name */}
      <div className='flex items-start space-x-4 mb-4'>
        {/* Company Logo */}
        <div className='flex-shrink-0'>
          {analysis.logoUrl && !logoError ? (
            <div className='relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200'>
              <Image
                src={analysis.logoUrl}
                alt={`${analysis.companyName} logo`}
                fill
                className='object-contain p-2'
                onError={handleLogoError}
                sizes='64px'
              />
            </div>
          ) : (
            // Fallback logo placeholder
            <div className='w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center'>
              <svg
                className='w-8 h-8 text-gray-400'
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
          <h3 className='text-xl font-semibold text-gray-900 truncate mb-2'>{analysis.companyName}</h3>
          <div className='flex items-center space-x-2'>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getBadgeColor(
                analysis.outsourcingLikelihood
              )}`}
            >
              {analysis.outsourcingLikelihood} Likelihood
            </span>
            <span className='text-sm text-gray-500'>{formatDate(analysis.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Analysis reasoning */}
      <div className='mb-4'>
        <h4 className='text-sm font-medium text-gray-700 mb-2'>Analysis</h4>
        <p className='text-gray-600 leading-relaxed'>{analysis.reasoning}</p>
      </div>

      {/* Possible services to outsource */}
      {analysis.possibleServices && analysis.possibleServices.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-gray-700 mb-2'>Possible Services to Outsource</h4>
          <div className='flex flex-wrap gap-2'>
            {analysis.possibleServices.map((service, index) => (
              <span
                key={index}
                className='inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200'
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Analysis ID for reference (hidden by default, useful for debugging) */}
      <div className='mt-4 pt-4 border-t border-gray-100'>
        <p className='text-xs text-gray-400'>Analysis ID: {analysis.id}</p>
      </div>
    </div>
  );
}
