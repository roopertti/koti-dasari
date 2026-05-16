import { Component, type ErrorInfo, type ReactNode } from 'react';
import { t } from '../../../i18n/t.js';
import * as styles from './ErrorBoundary.css.js';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className={styles.root} role="alert" data-testid="error-boundary">
        <div className={styles.title}>{t('error.title')}</div>
        <div className={styles.detail}>{this.state.error.message}</div>
        <button type="button" onClick={() => window.location.reload()}>
          {t('error.reload')}
        </button>
      </div>
    );
  }
}
