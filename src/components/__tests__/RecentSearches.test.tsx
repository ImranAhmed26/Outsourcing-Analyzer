import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecentSearches from '../RecentSearches';
import { RecentSearch } from '@/types';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock data
const mockRecentSearches: RecentSearch[] = [
  {
    id: '1',
    companyName: 'Apple Inc.',
    outsourcingLikelihood: 'High',
    createdAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    id: '2',
    companyName: 'Microsoft Corporation',
    outsourcingLikelihood: 'Medium',
    createdAt: new Date('2024-01-14T15:45:00Z'),
  },
  {
    id: '3',
    companyName: 'Local Bakery',
    outsourcingLikelihood: 'Low',
    createdAt: new Date('2024-01-13T09:15:00Z'),
  },
];

describe('RecentSearches Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<RecentSearches />);

    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('Loading recent searches...')).toBeInTheDocument();
    expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number)); // Loading skeletons
  });

  it('renders recent searches successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockRecentSearches,
      }),
    });

    render(<RecentSearches />);

    await waitFor(() => {
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Corporation')).toBeInTheDocument();
      expect(screen.getByText('Local Bakery')).toBeInTheDocument();
    });

    // Check likelihood badges
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();

    // Check footer text
    expect(screen.getByText('Showing 3 of your most recent searches')).toBeInTheDocument();
  });

  it('renders empty state when no searches exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    render(<RecentSearches />);

    await waitFor(() => {
      expect(screen.getByText('No recent searches')).toBeInTheDocument();
      expect(screen.getByText('Start by analyzing a company to see your search history here.')).toBeInTheDocument();
    });
  });

  it('renders error state when API fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<RecentSearches />);

    await waitFor(() => {
      expect(screen.getByText(/Server error/)).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
  });

  it('renders error state when API returns error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Database connection failed',
      }),
    });

    render(<RecentSearches />);

    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
  });

  it('handles network error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<RecentSearches />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockRecentSearches,
      }),
    });

    render(<RecentSearches />);

    await waitFor(() => {
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    });

    // Mock second call for refresh
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [mockRecentSearches[0]], // Only one result
      }),
    });

    // Click refresh button
    const refreshButton = screen.getByTitle('Refresh recent searches');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('refreshes data when refreshTrigger prop changes', async () => {
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockRecentSearches,
      }),
    });

    const { rerender } = render(<RecentSearches refreshTrigger={1} />);

    await waitFor(() => {
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    });

    // Mock second call for refresh trigger
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockRecentSearches,
      }),
    });

    // Change refreshTrigger prop
    rerender(<RecentSearches refreshTrigger={2} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('applies custom className', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    const { container } = render(<RecentSearches className='custom-class' />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('displays correct badge colors for different likelihood levels', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockRecentSearches,
      }),
    });

    render(<RecentSearches />);

    await waitFor(() => {
      const highBadge = screen.getByText('High');
      const mediumBadge = screen.getByText('Medium');
      const lowBadge = screen.getByText('Low');

      expect(highBadge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
      expect(mediumBadge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
      expect(lowBadge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
    });
  });
});
