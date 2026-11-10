import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { initAuth } from './auth/msal.js';
import './styles.css';

// Finish any Microsoft sign-in redirect before the first render.
initAuth()
  .catch((err) => console.error('Microsoft sign-in setup failed:', err))
  .finally(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </React.StrictMode>,
    );
  });
