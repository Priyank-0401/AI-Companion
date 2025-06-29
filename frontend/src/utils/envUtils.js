// Environment utility functions
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isProduction ? 'https://api.yourdomain.com' : 'http://localhost:3000');

// Validate API URL in production
if (isProduction && API_BASE_URL.startsWith('http:')) {
  console.error('Insecure API URL detected in production. Use HTTPS.');
  // In production, you might want to throw an error instead
  // throw new Error('Insecure API URL detected in production. Use HTTPS.');
}

export const getSecurityHeaders = () => {
  if (!isProduction) return {};
  
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:;"
  };
};
