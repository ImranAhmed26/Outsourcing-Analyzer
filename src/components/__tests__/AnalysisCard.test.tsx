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
});
