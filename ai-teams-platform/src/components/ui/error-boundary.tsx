'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="text-sm font-medium">Something went wrong</p>
          <p className="text-xs text-muted-foreground max-w-[250px]">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
