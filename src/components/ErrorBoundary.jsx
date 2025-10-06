import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="max-w-md w-full p-8 bg-base-100 rounded-lg shadow-lg text-center">
            <h1 className="text-3xl font-bold text-error mb-4">Something went wrong</h1>
            <p className="text-base-content/70 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary w-full"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="btn btn-outline w-full"
              >
                Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-base-content/60">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-error bg-base-200 p-2 rounded overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
