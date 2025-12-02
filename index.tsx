
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill for process.env in browser environments (e.g. Netlify)
// This prevents "ReferenceError: process is not defined" crashes.
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

// Compatibility Layer for Vite/Netlify:
// Map 'VITE_API_KEY' (standard for Vite) to 'process.env.API_KEY' (standard for Node/SDKs)
try {
  // @ts-ignore - import.meta is a valid property in Vite/ESM environments
  if (import.meta && import.meta.env) {
    const processEnv = (window as any).process.env;
    // @ts-ignore
    const viteEnv = import.meta.env;

    // Automatically map VITE_API_KEY to API_KEY if available
    if (viteEnv.VITE_API_KEY && !processEnv.API_KEY) {
      processEnv.API_KEY = viteEnv.VITE_API_KEY;
    }
    
    // Also check for direct API_KEY if the bundler exposed it
    if (viteEnv.API_KEY && !processEnv.API_KEY) {
      processEnv.API_KEY = viteEnv.API_KEY;
    }
  }
} catch (e) {
  // Ignore errors if import.meta is not available
  console.debug("Environment variable mapping skipped.");
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
