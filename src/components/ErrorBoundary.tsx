'use client';

import React, { Component, ReactNode } from 'react';
import ErrorMessage from './ErrorMessage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Enhanced error logging with more context
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    console.error('Detailed error information:', errorDetails);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Provide more specific error messages based on error type
      let errorMessage =
        'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.';

      if (this.state.error) {
        if (this.state.error.message.includes('ChunkLoadError') || this.state.error.message.includes('Loading chunk')) {
          errorMessage = 'Failed to load application resources. Please refresh the page to try again.';
        } else if (this.state.error.message.includes('Network')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else if (this.state.error.message.includes('fetch')) {
          errorMessage = 'Failed to connect to our servers. Please check your connection and try again.';
        }
      }

      return (
        <div className='min-h-[200px] flex items-center justify-center p-4'>
          <ErrorMessage title='Something went wrong' message={errorMessage} onRetry={this.handleRetry} className='max-w-md' />
        </div>
      );
    }

    return this.props.children;
  }
}
