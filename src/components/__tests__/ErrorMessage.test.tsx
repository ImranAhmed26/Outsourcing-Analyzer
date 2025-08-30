import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error message with default props', () => {
    render(<ErrorMessage message='Test error message' />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<ErrorMessage title='Custom Error' message='Test message' />);

    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const mockRetry = jest.fn();
    render(<ErrorMessage message='Test message' onRetry={mockRetry} />);

    const retryButton = screen.getByText('Try again');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('renders different types with appropriate styling', () => {
    const { rerender } = render(<ErrorMessage message='Test' type='warning' />);
    let container = screen.getByText('Test').closest('div');
    expect(container).toHaveClass('bg-yellow-50');

    rerender(<ErrorMessage message='Test' type='info' />);
    container = screen.getByText('Test').closest('div');
    expect(container).toHaveClass('bg-blue-50');
  });
});
