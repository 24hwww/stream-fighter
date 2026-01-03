import { Component } from 'react';

/**
 * Error Boundary Component
 * Catches React component errors and displays a fallback UI
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console
        console.error('React Error Boundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });

        // You could also log to an error reporting service here
        // logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white font-mono p-8">
                    <div className="max-w-2xl w-full bg-zinc-900 border-4 border-red-600 p-8">
                        <h1 className="text-4xl font-black text-red-600 mb-4 uppercase">
                            System Error
                        </h1>
                        <p className="text-zinc-400 mb-6">
                            The application encountered an unexpected error. Please try reloading the page.
                        </p>

                        {this.state.error && (
                            <div className="bg-black p-4 mb-6 overflow-auto max-h-64">
                                <p className="text-red-500 font-bold mb-2">Error:</p>
                                <pre className="text-xs text-zinc-300">
                                    {this.state.error.toString()}
                                </pre>
                                {this.state.errorInfo && (
                                    <>
                                        <p className="text-red-500 font-bold mt-4 mb-2">Stack Trace:</p>
                                        <pre className="text-xs text-zinc-300">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </>
                                )}
                            </div>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 uppercase tracking-wider transition-colors"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
