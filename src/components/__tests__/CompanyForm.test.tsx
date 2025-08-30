import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompanyForm from '../CompanyForm';
import { LoadingState, AnalysisResult } from '@/types';

// Mock fetch
global.fetch = jest.fn();

describe('CompanyForm', () => {
  const mockOnAnalysisResult = jest.fn();
  const mockOnError = jest.fn();
  const mockOnLoadingChange = jest.fn();

  const defaultLoadingState: LoadingState = {
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('renders form with input and submit button', () => {
    render(
      <CompanyForm
        onAnalysisResult={mockOnAnalysisResult}
        onError={mockOnError}
        loadingState={defaultLoadingState}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze company/i })).toBeInTheDocument();
  });

  it('validates minimum character requirement', async () => {
    render(
      <CompanyForm
        onAnalysisResult={mockOnAnalysisResult}
        onError={mockOnError}
        loadingState={defaultLoadingState}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    const input = screen.getByLabelText(/company name/i);
    fireEvent.change(input, { target: { value: 'A' } });

    await waitFor(() => {
      expect(screen.getByText(/must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('validates maximum character requirement', async () => {
    render(
      <CompanyForm
        onAnalysisResult={mockOnAnalysisResult}
        onError={mockOnError}
        loadingState={defaultLoadingState}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    const input = screen.getByLabelText(/company name/i);
    const longName = 'A'.repeat(101);
    fireEvent.change(input, { target: { value: longName } });

    await waitFor(() => {
      expect(screen.getByText(/must be less than 100 characters/i)).toBeInTheDocument();
    });
  });

  it('validates invalid characters', async () => {
    render(
      <CompanyForm
        onAnalysisResult={mockOnAnalysisResult}
        onError={mockOnError}
        loadingState={defaultLoadingState}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    const input = screen.getByLabelText(/company name/i);
    fireEvent.change(input, { target: { value: 'Company@#$%' } });

    await waitFor(() => {
      expect(screen.getByText(/contains invalid characters/i)).toBeInTheDocument();
    });
  });

  it('disables submit button when validation fails', async () => {
    render(
      <CompanyForm
        onAnalysisResult={mockOnAnalysisResult}
        onError={mockOnError}
        loadingState={defaultLoadingState}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    const input = screen.getByLabelText(/company name/i);
    const submitButton = screen.getByRole('button', { name: /analyze company/i });

    fireEvent.change(input, { target: { value: 'A' } });

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('enables submit button with valid input', async () => {
    render(
      <CompanyForm
        onAnalysisResult={mockOnAnalysisResult}
        onError={mockOnError}
        loadingState={defaultLoadingState}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    const input = screen.getByLabelText(/company name/i);
    const submitButton = screen.getByRole('button', { name: /analyze company/i });

    fireEvent.change(input, { target: { value: 'Apple Inc' } });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('shows loading state during submission', () => {
    const loadingState: LoadingState = {
      isLoading: true,
      message: 'Analyzing company...',
    };

    render(
      <CompanyForm
        onAnalysisResult={mockOnAnalysisResult}
        onError={mockOnError}
        loadingState={loadingState}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    expect(screen.getByText(/analyzing company/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onAnalysisResult on successful submission', async () => {
    const mockResult: AnalysisResult = {
      id: '1',
      companyName: 'Apple Inc',
      outsourcingLikelihood: 'High',
      reasoning: 'Test reasoning',
      possibleServices: ['Development'],
      createdAt: new Date(),
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockResult,
      }),
    });

    render(
      <CompanyForm
        onAnalysisResult={mockOnAnalysisResult}
        onError={mockOnError}
        loadingState={defaultLoadingState}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    const input = screen.getByLabelText(/company name/i);
    const submitButton = screen.getByRole('button', { name: /analyze company/i });

    fireEvent.change(input, { target: { value: 'Apple Inc' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnAnalysisResult).toHaveBeenCalledWith(mockResult);
    });
  });

  it('calls onError on failed submission', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(
      <CompanyForm
        onAnalysisResult={mockOnAnalysisResult}
        onError={mockOnError}
        loadingState={defaultLoadingState}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    const input = screen.getByLabelText(/company name/i);
    const submitButton = screen.getByRole('button', { name: /analyze company/i });

    fireEvent.change(input, { target: { value: 'Apple Inc' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });
  });
});
