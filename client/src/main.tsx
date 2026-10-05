import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './tailwind.css';
import './styles.scss';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: "'Inter','Noto Sans',sans-serif",
          fontSize: '12px',
          padding: '14px 18px',
          borderRadius: '8px',
          border: '1px solid #e5eade',
        },
        success: { iconTheme: { primary: '#164b3c', secondary: '#fff' } },
      }}
    />
  </StrictMode>,
);
