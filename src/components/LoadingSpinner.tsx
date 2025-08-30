interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'blue' | 'green' | 'purple' | 'gray';
  variant?: 'default' | 'dots' | 'pulse';
}

export default function LoadingSpinner({
  size = 'md',
  className = '',
  color = 'blue',
  variant = 'default',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    purple: 'border-purple-600',
    gray: 'border-gray-600',
  };

  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`} role='status'>
        <div
          className={`${sizeClasses[size]} ${colorClasses[color].replace('border-', 'bg-')} rounded-full animate-bounce`}
        ></div>
        <div
          className={`${sizeClasses[size]} ${colorClasses[color].replace('border-', 'bg-')} rounded-full animate-bounce`}
          style={{ animationDelay: '0.1s' }}
        ></div>
        <div
          className={`${sizeClasses[size]} ${colorClasses[color].replace('border-', 'bg-')} rounded-full animate-bounce`}
          style={{ animationDelay: '0.2s' }}
        ></div>
        <span className='sr-only'>Loading...</span>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={`${sizeClasses[size]} ${colorClasses[color].replace(
          'border-',
          'bg-'
        )} rounded-full animate-pulse ${className}`}
        role='status'
      >
        <span className='sr-only'>Loading...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`} role='status'>
      <div className={`absolute inset-0 rounded-full border-2 ${colorClasses[color]} opacity-25`}></div>
      <div className={`absolute inset-0 rounded-full border-2 ${colorClasses[color]} border-t-transparent animate-spin`}></div>
      <span className='sr-only'>Loading...</span>
    </div>
  );
}
