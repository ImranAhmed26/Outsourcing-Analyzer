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
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header with logo and company name */}
      <div className='flex items-start space-x-4 mb-6'>
        {/* Company Logo */}
        <div className='flex-shrink-0'>
          {analysis.logoUrl && !logoError ? (
            <div className='relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-200'>
              <Image
                src={analysis.logoUrl}
                alt={`${analysis.companyName} logo`}
                fill
                className='object-contain p-2'
                onError={handleLogoError}
                sizes='48px'
              />
            </div>
          ) : (
            // Fallback logo placeholder
            <div className='w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center'>
              <svg className='w-6 h-6 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>{analysis.companyName}</h3>
          <div className='flex items-center space-x-3'>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                analysis.outsourcingLikelihood === 'High'
                  ? 'bg-green-100 text-green-800'
                  : analysis.outsourcingLikelihood === 'Medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {analysis.outsourcingLikelihood} Likelihood
            </span>
            <span className='text-sm text-gray-500'>{formatDate(analysis.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Analysis reasoning */}
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-2'>
          <h4 className='text-sm font-medium text-gray-900'>Analysis</h4>
          {analysis.confidence && <span className='text-xs text-gray-500'>{analysis.confidence}% confidence</span>}
        </div>
        <p className='text-sm text-gray-600 leading-relaxed'>{analysis.reasoning}</p>
      </div>

      {/* Key Insights */}
      {analysis.keyInsights && analysis.keyInsights.length > 0 && (
        <div className='mb-6'>
          <h4 className='text-sm font-medium text-gray-900 mb-2'>Key Insights</h4>
          <ul className='space-y-1'>
            {analysis.keyInsights.map((insight, index) => (
              <li key={index} className='text-xs text-gray-600 flex items-start'>
                <span className='w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0'></span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Activity */}
      {analysis.recentActivity && (
        <div className='mb-6'>
          <h4 className='text-sm font-medium text-gray-900 mb-2'>Recent Activity</h4>
          <div className='grid grid-cols-3 gap-4 text-center'>
            <div className='bg-gray-50 rounded-lg p-2'>
              <div className='text-lg font-semibold text-gray-900'>{analysis.recentActivity.newsCount}</div>
              <div className='text-xs text-gray-500'>News Articles</div>
            </div>
            <div className='bg-gray-50 rounded-lg p-2'>
              <div className='text-lg font-semibold text-gray-900'>{analysis.recentActivity.jobPostingsCount}</div>
              <div className='text-xs text-gray-500'>Job Postings</div>
            </div>
            <div className='bg-gray-50 rounded-lg p-2'>
              <div className='text-xs font-medium text-gray-700'>{analysis.recentActivity.hiringTrends}</div>
              <div className='text-xs text-gray-500'>Hiring Status</div>
            </div>
          </div>
        </div>
      )}

      {/* Key People */}
      {analysis.keyPeople && analysis.keyPeople.length > 0 && (
        <div className='mb-6'>
          <h4 className='text-sm font-medium text-gray-900 mb-2'>Key People</h4>
          <div className='space-y-2'>
            {analysis.keyPeople.slice(0, 3).map((person, index) => (
              <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded-lg'>
                <div>
                  <div className='text-sm font-medium text-gray-900'>{person.name}</div>
                  <div className='text-xs text-gray-500'>{person.title}</div>
                </div>
                {(person.email || person.predictedEmail) && (
                  <div className='text-xs text-blue-600 font-mono'>
                    {person.email || person.predictedEmail}
                    {person.predictedEmail && !person.email && <span className='text-gray-400 ml-1'>(predicted)</span>}
                  </div>
                )}
              </div>
            ))}
            {analysis.keyPeople.length > 3 && (
              <div className='text-xs text-gray-500 text-center'>+{analysis.keyPeople.length - 3} more people</div>
            )}
          </div>
        </div>
      )}

      {/* Possible services to outsource */}
      {analysis.possibleServices && analysis.possibleServices.length > 0 && (
        <div className='mb-6'>
          <h4 className='text-sm font-medium text-gray-900 mb-2'>Potential Services</h4>
          <div className='flex flex-wrap gap-2'>
            {analysis.possibleServices.map((service, index) => (
              <span
                key={index}
                className='inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700'
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Risk Factors and Opportunities */}
      {((analysis.riskFactors && analysis.riskFactors.length > 0) ||
        (analysis.opportunities && analysis.opportunities.length > 0)) && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {analysis.riskFactors && analysis.riskFactors.length > 0 && (
            <div>
              <h4 className='text-sm font-medium text-red-700 mb-2'>Risk Factors</h4>
              <ul className='space-y-1'>
                {analysis.riskFactors.map((risk, index) => (
                  <li key={index} className='text-xs text-red-600 flex items-start'>
                    <span className='w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0'></span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.opportunities && analysis.opportunities.length > 0 && (
            <div>
              <h4 className='text-sm font-medium text-green-700 mb-2'>Opportunities</h4>
              <ul className='space-y-1'>
                {analysis.opportunities.map((opportunity, index) => (
                  <li key={index} className='text-xs text-green-600 flex items-start'>
                    <span className='w-1 h-1 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0'></span>
                    {opportunity}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
