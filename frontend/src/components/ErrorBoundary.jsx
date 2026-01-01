// ===== src/components/ErrorBoundary.jsx =====
import { Component } from 'react';
import { AlertTriangle, Home } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">
              <AlertTriangle size={80} />
            </div>

            <h1 className="error-boundary__title">
              Oups ! Une erreur est survenue
            </h1>

            <p className="error-boundary__message">
              Nous sommes désolés, quelque chose s'est mal passé. 
              Notre équipe a été notifiée et travaille sur le problème.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary__details">
                <summary>Détails de l'erreur (développement)</summary>
                <pre className="error-boundary__stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-boundary__actions">
              <button 
                onClick={this.handleReset}
                className="error-boundary__btn error-boundary__btn--primary"
              >
                <Home size={18} />
                Retour à l'accueil
              </button>

              <button 
                onClick={() => window.location.reload()}
                className="error-boundary__btn error-boundary__btn--secondary"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;