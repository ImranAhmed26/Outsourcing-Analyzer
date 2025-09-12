'use client';

import React, { useState } from 'react';
import { EmailInputForm } from '../../components/enrichment/EmailInputForm';
import { EnrichmentResults } from '../../components/enrichment/EnrichmentResults';
import { LoadingIndicator } from '../../components/enrichment/LoadingIndicator';
import { 
  EnrichmentRequest, 
  EnrichmentResponse, 
  EnrichmentResult 
} from '@/types/enrichment';

export default function EnrichmentPage() {
  const [results, setResults] = useState<EnrichmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [processingEmails, setProcessingEmails] = useState<string[]>([]);

  const handleEnrichment = async (emails: string[]) => {
    setIsLoading(true);
    setError('');
    setResults([]);
    setProcessingEmails(emails);

    try {
      const request: EnrichmentRequest = { emails };
      
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to enrich emails');
      }

      const data: EnrichmentResponse = await response.json();
      setResults(data.results);
      
      if (data.errorCount > 0) {
        setError(`${data.errorCount} out of ${data.totalProcessed} emails failed to process`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Enrichment error:', err);
    } finally {
      setIsLoading(false);
      setProcessingEmails([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Email Company Enrichment
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enrich email addresses with comprehensive company data including company name, 
            industry, employee count, funding information, and more using AI-powered research.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <EmailInputForm 
              onSubmit={handleEnrichment}
              isLoading={isLoading}
            />
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <LoadingIndicator 
                emails={processingEmails}
                currentProcessing="Enriching company data..."
              />
            </div>
          )}

          {/* Error Message */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg 
                    className="h-5 w-5 text-red-400" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Enrichment Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && !isLoading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <EnrichmentResults results={results} />
            </div>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              How it works
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                • Enter email addresses manually or upload a CSV file
              </p>
              <p>
                • Our AI analyzes each email domain to identify the associated company
              </p>
              <p>
                • We gather comprehensive company data from multiple reliable sources
              </p>
              <p>
                • Results include company details, financial information, and technology stack
              </p>
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Processing time varies based on data availability. 
                Complex enrichment may take 30 seconds to 5 minutes per email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
