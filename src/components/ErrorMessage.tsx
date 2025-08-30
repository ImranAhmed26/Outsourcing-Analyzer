interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  className?: string;
}

export default function ErrorMessage({
  title = 'Something went wrong',
  message,
  type = 'error',
  onRetry,
  className = '',
}: ErrorMessageProps) {
  const typeStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconStyles = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  };

  return (
    <div className={`rounded-xl border-2 p-6 card-hover ${typeStyles[type]} ${className}`}>
      <div className='flex'>
        <div className='flex-shrink-0'>
          {type === 'error' && (
            <div className='flex items-center justify-center w-10 h-10 rounded-full bg-red-100'>
              <svg className={`h-6 w-6 ${iconStyles[type]}`} viewBox='0 0 20 20' fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z'
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
          {onRetry && (
            <div className='mt-4'>
              <button
                type='button'
                onClick={onRetry}
                className='inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200'
              >
                <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
