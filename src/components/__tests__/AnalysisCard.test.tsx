import { render, screen } from '@testing-library/react';
import AnalysisCard from '../AnalysisCard';
import { AnalysisResult } from '@/types';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({
    src,
    alt,
    onError,
    ...props
  }: {
    src: string;
    alt: string;
    onError?: () => void;
    [key: string]: unknown;
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} onError={onError} {...props} />;
  };
});

describe('AnalysisCard', () => {
  const mockAnalysis: AnalysisResult = {
    id: 'test-id-123',
    companyName: 'Test Company',
    outsourcingLikelihood: 'High',
    reasoning: 'This company shows strong indicators for outsourcing potential based on their business model.',
    possibleServices: ['Customer Support', 'Data Entry', 'Software Development'],
    logoUrl: 'https://example.com/logo.png',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    confidence: 85,
    keyInsights: ['Strong growth indicators', 'Active hiring in tech roles'],
    riskFactors: ['High competition in market'],
    opportunities: ['Expanding into new markets'],
    keyPeople: [
      {
        name: 'John Smith',
        position: 'CEO',
        email: 'john.smith@testcompany.com',
        linkedin: 'https://linkedin.com/in/johnsmith',
        department: 'Executive',
      },
      {
        name: 'Jane Doe',
        position: 'CTO',
        email: 'jane.doe@testcompany.com',
        department: 'Technology',
      },
    ],
    dataSourcesUsed: {
      linkedin: true,
      crunchbase: false,
      website: true,
      emailVerification: true,
    },
  };

  it('renders company name and analysis correctly', () => {
    render(<AnalysisCard analysis={mockAnalysis} />);

    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('High Likelihood')).toBeInTheDocument();
    expect(screen.getByText(mockAnalysis.reasoning)).toBeInTheDocument();
  });

  it('displays all possible services', () => {
    render(<AnalysisCard analysis={mockAnalysis} />);

    expect(screen.getByText('Customer Support')).toBeInTheDocument();
    expect(screen.getByText('Data Entry')).toBeInTheDocument();
    expect(screen.getByText('Software Development')).toBeInTheDocument();
  });

  it('applies correct badge color for High likelihood', () => {
    render(<AnalysisCard analysis={mockAnalysis} />);

    const badge = screen.getByText('High Likelihood');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
  });

  it('applies correct badge color for Medium likelihood', () => {
    const mediumAnalysis = { ...mockAnalysis, outsourcingLikelihood: 'Medium' as const };
    render(<AnalysisCard analysis={mediumAnalysis} />);

    const badge = screen.getByText('Medium Likelihood');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
  });

  it('applies correct badge color for Low likelihood', () => {
    const lowAnalysis = { ...mockAnalysis, outsourcingLikelihood: 'Low' as const };
    render(<AnalysisCard analysis={lowAnalysis} />);

    const badge = screen.getByText('Low Likelihood');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
  });

  it('displays company logo when logoUrl is provided', () => {
    render(<AnalysisCard analysis={mockAnalysis} />);

    const logo = screen.getByAltText('Test Company logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('shows fallback UI when no logoUrl is provided', () => {
    const analysisWithoutLogo = { ...mockAnalysis, logoUrl: undefined };
    render(<AnalysisCard analysis={analysisWithoutLogo} />);

    // Should show the building icon SVG as fallback
    const fallbackIcon = screen.getByRole('img', { hidden: true });
    expect(fallbackIcon).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(<AnalysisCard analysis={mockAnalysis} />);

    // The date should be formatted as "Jan 15, 2024, 10:30 AM" or similar
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('displays analysis ID', () => {
    render(<AnalysisCard analysis={mockAnalysis} />);

    expect(screen.getByText('Analysis ID: test-id-123')).toBeInTheDocument();
  });

  it('handles empty possible services array', () => {
    const analysisWithoutServices = { ...mockAnalysis, possibleServices: [] };
    render(<AnalysisCard analysis={analysisWithoutServices} />);

    // Should not show the services section
    expect(screen.queryByText('Possible Services to Outsource')).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(<AnalysisCard analysis={mockAnalysis} className='custom-class' />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
  });

  describe('Key People section', () => {
    it('displays key people when available', () => {
      render(<AnalysisCard analysis={mockAnalysis} />);

      expect(screen.getByText('Key People')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('CEO')).toBeInTheDocument();
      expect(screen.getByText('john.smith@testcompany.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('CTO')).toBeInTheDocument();
      expect(screen.getByText('jane.doe@testcompany.com')).toBeInTheDocument();
    });

    it('displays department badges when available', () => {
      render(<AnalysisCard analysis={mockAnalysis} />);

      expect(screen.getByText('Executive')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });

    it('displays LinkedIn links when available', () => {
      render(<AnalysisCard analysis={mockAnalysis} />);

      const linkedinLink = screen.getByTitle('View LinkedIn Profile');
      expect(linkedinLink).toBeInTheDocument();
      expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/johnsmith');
      expect(linkedinLink).toHaveAttribute('target', '_blank');
      expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('does not display LinkedIn link when not available', () => {
      render(<AnalysisCard analysis={mockAnalysis} />);

      // Jane Doe doesn't have a LinkedIn profile in the mock data
      const linkedinLinks = screen.getAllByTitle('View LinkedIn Profile');
      expect(linkedinLinks).toHaveLength(1); // Only John Smith has LinkedIn
    });

    it('does not show key people section when no people data', () => {
      const analysisWithoutPeople = { ...mockAnalysis, keyPeople: [] };
      render(<AnalysisCard analysis={analysisWithoutPeople} />);

      expect(screen.queryByText('Key People')).not.toBeInTheDocument();
    });

    it('limits display to 5 people and shows count for additional people', () => {
      const analysisWithManyPeople = {
        ...mockAnalysis,
        keyPeople: [
          ...mockAnalysis.keyPeople,
          { name: 'Person 3', position: 'CFO', email: 'person3@test.com', department: 'Finance' },
          { name: 'Person 4', position: 'CMO', email: 'person4@test.com', department: 'Marketing' },
          { name: 'Person 5', position: 'COO', email: 'person5@test.com', department: 'Operations' },
          { name: 'Person 6', position: 'VP Sales', email: 'person6@test.com', department: 'Sales' },
          { name: 'Person 7', position: 'VP Engineering', email: 'person7@test.com', department: 'Technology' },
        ],
      };

      render(<AnalysisCard analysis={analysisWithManyPeople} />);

      // Should show first 5 people
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Person 5')).toBeInTheDocument();

      // Should show count for additional people
      expect(screen.getByText('+2 more people')).toBeInTheDocument();

      // Should not show the 6th and 7th person
      expect(screen.queryByText('Person 6')).not.toBeInTheDocument();
      expect(screen.queryByText('Person 7')).not.toBeInTheDocument();
    });
  });
});
