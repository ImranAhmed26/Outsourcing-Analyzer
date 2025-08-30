import LoadingSpinner from './LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingState({ message = 'Loading...', size = 'md', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <LoadingSpinner size={size} className='text-indigo-600' />
      <p className='mt-4 text-sm text-gray-600'>{message}</p>
    </div>
  );
}
