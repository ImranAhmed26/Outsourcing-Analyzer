'use client';

import React from 'react';

interface LoadingIndicatorProps {
  emails: string[];
  currentProcessing: string;
}

export function LoadingIndicator({ emails, currentProcessing }: LoadingIndicatorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <svg 
            className="animate-spin h-6 w-6 text-blue-600" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Enriching Company Data
          </h3>
          <p className="text-sm text-gray-600">
            {currentProcessing}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Processing Emails
          </span>
          <span className="text-sm text-gray-500">
            {emails.length} email{emails.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000 animate-pulse"
            style={{ width: '100%' }}
          />
        </div>

        {/* Email List */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {emails.map((email, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-2 text-sm"
            >
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" />
              </div>
              <span className="text-gray-700 truncate">
                {email}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            <svg 
              className="h-5 w-5 text-blue-400 mt-0.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800">
              Processing Information
            </h4>
            <div className="mt-1 text-sm text-blue-700 space-y-1">
              <p>• Analyzing email domains to identify companies</p>
              <p>• Gathering comprehensive company information</p>
              <p>• Validating data across multiple reliable sources</p>
              <p>• Processing time: 30 seconds to 5 minutes per email</p>
            </div>
          </div>
        </div>
      </div>

      {/* Animated dots */}
      <div className="flex justify-center space-x-1">
        <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
