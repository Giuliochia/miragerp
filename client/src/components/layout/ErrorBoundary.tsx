import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Mirage RP UI Error]', error, info);
  }

  clearAiResults = () => {
    const raw = localStorage.getItem('rp-architect-store');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.state?.aiResults) {
          parsed.state.aiResults = [];
          localStorage.setItem('rp-architect-store', JSON.stringify(parsed));
        }
      } catch {
        localStorage.removeItem('rp-architect-store');
      }
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-dvh bg-bg-main text-text-primary flex items-center justify-center px-4">
        <div className="card max-w-md w-full space-y-4">
          <div>
            <h1 className="text-lg font-bold">Mirage RP ha recuperato un errore UI</h1>
            <p className="text-sm text-text-secondary mt-2">
              Un risultato AI salvato ha un formato non previsto. Puoi pulire solo lo storico AI e riaprire l'app senza perdere progetti, fazioni o documenti.
            </p>
          </div>
          {this.state.message && (
            <div className="bg-bg-card2 border border-border rounded-lg p-3 text-xs text-text-muted break-words">
              {this.state.message}
            </div>
          )}
          <div className="flex gap-3">
            <button className="btn-primary flex-1" onClick={this.clearAiResults}>
              Pulisci storico AI
            </button>
            <button className="btn-secondary flex-1" onClick={() => window.location.reload()}>
              Ricarica
            </button>
          </div>
        </div>
      </div>
    );
  }
}
