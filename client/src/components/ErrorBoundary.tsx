import { Component, type ReactNode } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Ornament } from './Brand';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="container error-page" role="alert">
          <Ornament />
          <strong>500</strong>
          <h1>Күтпеген қате орын алды</h1>
          <p>Бетті қайта жүктеңіз немесе басты бетке оралыңыз.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              <RefreshCw size={17} />
              Қайта жүктеу
            </button>
            <a className="btn btn-secondary" href="/">
              Басты бет
              <ArrowRight size={17} />
            </a>
          </div>
        </main>
      );
    return this.props.children;
  }
}
