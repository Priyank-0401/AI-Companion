import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Function to handle the initial render
const renderApp = () => {
  const root = createRoot(document.getElementById('root'));
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  // Add theme-loaded class to show the content after initial render
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.classList.add('theme-loaded');
  }
};

// Wait for the DOM to be fully loaded before rendering
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}
