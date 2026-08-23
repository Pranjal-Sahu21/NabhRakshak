import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Resilient Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: 'black', height: '100vh', width: '100vw', overflow: 'auto' }}>
          <h2>Dashboard Crashed</h2>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.errorInfo?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: 'Exo 2, sans-serif'
            },
            success: {
              iconTheme: {
                primary: '#00ff00',
                secondary: '#ffffff',
              },
              style: {
                borderColor: 'rgba(0, 255, 0, 0.3)',
              }
            },
            error: {
              iconTheme: {
                primary: '#ff0000',
                secondary: '#ffffff',
              },
              style: {
                borderColor: 'rgba(255, 0, 0, 0.3)',
              }
            },
            loading: {
              iconTheme: {
                primary: '#00ffff',
                secondary: '#ffffff',
              },
              style: {
                borderColor: 'rgba(0, 255, 255, 0.3)',
              }
            }
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
