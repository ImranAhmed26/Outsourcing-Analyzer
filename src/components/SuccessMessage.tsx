import React from 'react';

interface SuccessMessageProps {
  title?: string;
  message: string;
  type?: 'success' | 'warning' | 'info';
  onDismiss?: () => void;
  className?: string;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export default function SuccessMessage({
  title = 'Success',
  message,
  type = 'success',
  onDismiss,
  className = '',
  autoHide = true,
  autoHideDelay = 5000,
}: SuccessMessageProps) {
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconStyles = {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  };

  // Auto-hide functionality
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoHide, autoHideDelay, onDismiss]);

  return (
    <div className={`rounded-xl border-2 p-6 card-hover ${typeStyles[type]} ${className}`}>
      <div className='flex'>
        <div className='flex-shrink-0'>
          {type === 'success' && (
            <div className='flex items-center justify-center w-10 h-10 rounded-full bg-green-100'>
              <svg className={`h-6 w-6 ${iconStyles[type]}`} viewBox='0 0 20 20' fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.53a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
          )}
          {type === 'warning' && (
            <div className='flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100'>
              <svg className={`h-6 w-6 ${iconStyles[type]}`} viewBox='0 0 20 20' fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
          )}
          {type === 'info' && (
            <div className='flex items-center justify-center w-10 h-10 rounded-full bg-blue-100'>
              <svg className={`h-6 w-6 ${iconStyles[type]}`} viewBox='0 0 20 20' fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
          )}
        </div>
        <div className='ml-4 flex-1'>
          <h3 className='text-base font-semibold'>{title}</h3>
          <div className='mt-2 text-sm leading-relaxed'>
            <p>{message}</p>
          </div>
        </div>
        {onDismiss && (
          <div className='ml-auto pl-3'>
            <div className='-mx-1.5 -my-1.5'>
              <button
                type='button'
                onClick={onDismiss}
                className={`inline-flex rounded-lg p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  type === 'success'
                    ? 'text-green-500 hover:bg-green-100 hover:text-green-600 focus:ring-green-600'
                    : type === 'warning'
                    ? 'text-yellow-500 hover:bg-yellow-100 hover:text-yellow-600 focus:ring-yellow-600'
                    : 'text-blue-500 hover:bg-blue-100 hover:text-blue-600 focus:ring-blue-600'
                }`}
              >
                <span className='sr-only'>Dismiss</span>
                <svg className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                  <path d='M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z' />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
