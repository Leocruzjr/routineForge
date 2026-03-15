import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Pre-warm the server to reduce cold start latency
const apiUrl = import.meta.env.VITE_API_URL || '/api';
fetch(`${apiUrl}/health`).catch(() => {});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
