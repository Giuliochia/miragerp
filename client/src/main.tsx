import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AuthGate from './components/auth/AuthGate';
import CloudSyncProvider from './components/cloud/CloudSyncProvider';
import ErrorBoundary from './components/layout/ErrorBoundary';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthGate>
        <CloudSyncProvider>
          <App />
        </CloudSyncProvider>
      </AuthGate>
    </ErrorBoundary>
  </React.StrictMode>
);
