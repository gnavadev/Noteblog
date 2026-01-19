import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 gap-4 text-center min-h-[200px]">
                    <div className="p-4 rounded-full bg-destructive/10">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold">Something went wrong</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                    </div>
                    <Button onClick={this.handleRetry} variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
