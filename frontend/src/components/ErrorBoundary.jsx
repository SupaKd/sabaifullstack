// ===== src/components/ErrorBoundary.jsx =====
import { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faHome } from '@fortawesome/free-solid-svg-icons';

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
    // Log l'erreur pour debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // ✅ Envoyer l'erreur à un service de monitoring (optionnel)
    // sendErrorToMonitoring(error, errorInfo);
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
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>

            <h1 className="error-boundary__title">
              Oups ! Une erreur est survenue
            </h1>

            <p className="error-boundary__message">
              Nous sommes désolés, quelque chose s'est mal passé. 
              Notre équipe a été notifiée et travaille sur le problème.
            </p>

            {/* Afficher l'erreur en développement */}
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
                <FontAwesomeIcon icon={faHome} />
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