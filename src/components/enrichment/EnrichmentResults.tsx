'use client';

import React, { useState } from 'react';
import { EnrichmentResult } from '@/types/enrichment';
import { Badge } from '@/components/ui/badge';

interface EnrichmentResultsProps {
  results: EnrichmentResult[];
}

export function EnrichmentResults({ results }: EnrichmentResultsProps) {
  const [selectedResult, setSelectedResult] = useState<EnrichmentResult | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const successResults = results.filter(r => r.status === 'success');
  const errorResults = results.filter(r => r.status === 'error');

  const exportToCSV = () => {
    const headers = [
      'Email',
      'Status',
      'Company Name',
      'Industry',
      'Employee Count',
      'Year Founded',
      'Headquarters',
      'Revenue',
      'Funding Raised',
      'Funding Stage',
      'Tech Stack',
      'Subsidiaries',
      'Error'
    ];

    const csvData = results.map(result => [
      result.email,
      result.status,
      result.data?.companyName || '',
      result.data?.industry || '',
      result.data?.employeeCount || '',
      result.data?.yearFounded || '',
      result.data?.headquarters || '',
      result.data?.revenue || '',
      result.data?.fundingRaised || '',
      result.data?.fundingStage || '',
      result.data?.techStack?.join('; ') || '',
      result.data?.subsidiaries?.join('; ') || '',
      result.error || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrichment-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ResultCard = ({ result }: { result: EnrichmentResult }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedResult(result)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {result.status === 'success' && result.data?.companyName 
              ? result.data.companyName 
              : result.email}
          </h3>
          <p className="text-sm text-gray-500 truncate">{result.email}</p>
        </div>
        <Badge 
          variant={result.status === 'success' ? 'default' : 'destructive'}
          className="ml-2"
        >
          {result.status}
        </Badge>
      </div>

      {result.status === 'success' && result.data ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {result.data.companyDescription}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Industry:</span>
              <p className="text-gray-600">{result.data.industry}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Employees:</span>
              <p className="text-gray-600">{result.data.employeeCount}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Founded:</span>
              <p className="text-gray-600">{result.data.yearFounded}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Location:</span>
              <p className="text-gray-600 truncate">{result.data.headquarters}</p>
            </div>
          </div>

          {result.data.techStack && result.data.techStack.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700">Tech Stack:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {result.data.techStack.slice(0, 3).map((tech, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tech}
                  </Badge>
                ))}
                {result.data.techStack.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{result.data.techStack.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-red-600">
          {result.error}
        </div>
      )}
    </div>
  );

  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email / Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Industry
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Founded
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {results.map((result, index) => (
            <tr 
              key={index}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedResult(result)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {result.status === 'success' && result.data?.companyName 
                      ? result.data.companyName 
                      : result.email}
                  </div>
                  <div className="text-sm text-gray-500">
                    {result.email}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {result.data?.industry || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {result.data?.employeeCount || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {result.data?.yearFounded || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge 
                  variant={result.status === 'success' ? 'default' : 'destructive'}
                >
                  {result.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Enrichment Results
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {successResults.length} successful, {errorResults.length} failed out of {results.length} total
          </p>
        </div>
        
        <div className="flex space-x-3">
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm rounded-l-md ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm rounded-r-md ${
                viewMode === 'table' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Table
            </button>
          </div>
          
          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, index) => (
              <ResultCard key={index} result={result} />
            ))}
          </div>
        ) : (
          <TableView />
        )}
      </div>

      {/* Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedResult.status === 'success' && selectedResult.data?.companyName 
                      ? selectedResult.data.companyName 
                      : selectedResult.email}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedResult.email}</p>
                </div>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedResult.status === 'success' && selectedResult.data ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Company Description</h4>
                    <p className="text-gray-700">{selectedResult.data.companyDescription}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="font-medium text-gray-600">Industry:</dt>
                          <dd className="text-gray-800">{selectedResult.data.industry}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-600">Employee Count:</dt>
                          <dd className="text-gray-800">{selectedResult.data.employeeCount}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-600">Year Founded:</dt>
                          <dd className="text-gray-800">{selectedResult.data.yearFounded}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-600">Headquarters:</dt>
                          <dd className="text-gray-800">{selectedResult.data.headquarters}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Financial Information</h4>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="font-medium text-gray-600">Revenue:</dt>
                          <dd className="text-gray-800">{selectedResult.data.revenue}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-600">Funding Raised:</dt>
                          <dd className="text-gray-800">{selectedResult.data.fundingRaised}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-600">Funding Stage:</dt>
                          <dd className="text-gray-800">{selectedResult.data.fundingStage}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {selectedResult.data.techStack && selectedResult.data.techStack.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Technology Stack</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedResult.data.techStack.map((tech, index) => (
                          <Badge key={index} variant="outline">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedResult.data.subsidiaries && selectedResult.data.subsidiaries.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Subsidiaries</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {selectedResult.data.subsidiaries.map((subsidiary, index) => (
                          <li key={index}>{subsidiary}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Enrichment Failed</h4>
                  <p className="text-gray-600">{selectedResult.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
