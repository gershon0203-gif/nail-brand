import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-6 text-center">
          <AlertTriangle className="h-10 w-10 text-clay-600" />
          <h1 className="mt-5 font-display text-3xl text-ink-900">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-ink-500">{this.state.message}</p>
          <button
            type="button"
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.assign('/'); }}
            className="mt-6 rounded-lg bg-forest-700 px-6 py-3 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Return to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
