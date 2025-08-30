'use client';

import AnalysisCard from './AnalysisCard';
import { AnalysisResult } from '@/types';

export default function AnalysisCardDemo() {
  // Sample analysis data for testing
  const sampleAnalysis: AnalysisResult = {
    id: 'demo-analysis-123',
    companyName: 'TechCorp Solutions',
    outsourcingLikelihood: 'High',
    reasoning:
      'TechCorp Solutions shows strong indicators for outsourcing potential due to their focus on core business operations and cost optimization strategies. The company has a history of leveraging external partnerships for non-core functions.',
    possibleServices: ['Customer Support', 'Data Entry', 'Software Development', 'Digital Marketing', 'Accounting'],
    logoUrl: 'https://logo.clearbit.com/techcrunch.com',
    createdAt: new Date('2024-01-15T10:30:00Z'),
  };

  const sampleAnalysisWithoutLogo: AnalysisResult = {
    id: 'demo-analysis-456',
    companyName: 'Local Business Inc',
    outsourcingLikelihood: 'Medium',
    reasoning:
      'Local Business Inc demonstrates moderate outsourcing potential with some operational areas that could benefit from external expertise.',
    possibleServices: ['Bookkeeping', 'IT Support'],
    createdAt: new Date('2024-01-16T14:45:00Z'),
  };

  const lowLikelihoodAnalysis: AnalysisResult = {
    id: 'demo-analysis-789',
    companyName: 'Specialized Manufacturing',
    outsourcingLikelihood: 'Low',
    reasoning:
      'Specialized Manufacturing has limited outsourcing potential due to their highly specialized processes and strict quality control requirements.',
    possibleServices: ['Cleaning Services'],
    logoUrl: 'https://logo.clearbit.com/manufacturing.com',
    createdAt: new Date('2024-01-17T09:15:00Z'),
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8 text-center'>AnalysisCard Component Demo</h1>

        <div className='space-y-6'>
          <div>
            <h2 className='text-xl font-semibold text-gray-700 mb-4'>High Likelihood (with logo)</h2>
            <AnalysisCard analysis={sampleAnalysis} />
          </div>

          <div>
            <h2 className='text-xl font-semibold text-gray-700 mb-4'>Medium Likelihood (no logo)</h2>
            <AnalysisCard analysis={sampleAnalysisWithoutLogo} />
          </div>

          <div>
            <h2 className='text-xl font-semibold text-gray-700 mb-4'>Low Likelihood (with logo)</h2>
            <AnalysisCard analysis={lowLikelihoodAnalysis} />
          </div>
        </div>
      </div>
    </div>
  );
}
