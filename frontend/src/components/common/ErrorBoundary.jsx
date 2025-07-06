import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      componentStack: ''
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error,
      timestamp: new Date().toISOString()
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('=== ERROR BOUNDARY CAUGHT ===');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo,
      componentStack: errorInfo?.componentStack || '',
      timestamp: new Date().toISOString()
    });
    
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, componentStack, timestamp } = this.state;
      
      return (
        <div className="p-6 max-w-4xl mx-auto mt-10 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center mb-4">
            <svg className="w-8 h-8 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-300">
              Something went wrong
            </h2>
          </div>
          
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-800">
            <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">Error Details:</h3>
            <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto p-2 bg-gray-50 dark:bg-gray-900 rounded">
              {error?.message || 'No error message available'}
            </pre>
            
            {error?.stack && (
              <>
                <h4 className="font-semibold text-red-600 dark:text-red-400 mt-4 mb-2">Stack Trace:</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto p-2 bg-gray-50 dark:bg-gray-900 rounded max-h-40 overflow-y-auto">
                  {error.stack}
                </pre>
              </>
            )}
            
            {componentStack && (
              <>
                <h4 className="font-semibold text-red-600 dark:text-red-400 mt-4 mb-2">Component Stack:</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto p-2 bg-gray-50 dark:bg-gray-900 rounded max-h-40 overflow-y-auto">
                  {componentStack}
                </pre>
              </>
            )}
            
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Error occurred at: {timestamp || 'Unknown time'}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
