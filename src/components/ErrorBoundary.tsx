"use client";

import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Text, Button, Container, Title } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container size="md" py="xl">
          <Alert
            icon={<IconAlertCircle size="1.5rem" />}
            title="Something went wrong"
            color="red"
            variant="outline"
            mb="md"
          >
            <Text mb="md">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Button color="red" onClick={this.handleReset}>
              Try again
            </Button>
          </Alert>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <div style={{ marginTop: '1rem' }}>
              <Text size="sm" color="dimmed">
                {this.state.errorInfo.componentStack}
              </Text>
            </div>
          )}
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
