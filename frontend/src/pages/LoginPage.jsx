import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../auth/hooks/useAuth';
import { motion } from 'framer-motion';
import { Mail, Lock, Chrome, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import AuthInput from '../components/auth/AuthInput';
import AuthButton from '../components/auth/AuthButton';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const { user, loading, initialized, signIn, signInWithGoogle } = useAuth();

  // Handle redirect if user is already authenticated
  useEffect(() => {
    if (initialized && user) {
      // Small delay to ensure any state updates are processed
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, initialized, navigate, from]);

  // Show loading state while checking auth
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const user = await signIn(email, password);
      console.log('Login successful, user:', user);
      
      // Check if token is stored
      const token = localStorage.getItem('authToken');
      console.log('Stored auth token:', token ? 'Token exists' : 'No token found');
      
      // Get the redirect path from location state or default to '/'
      const fromPath = location.state?.from?.pathname || '/';
      console.log('Redirecting to:', fromPath);
      
      // The useEffect will handle the redirect when the user state updates
    } catch (err) {
      const errorMessage = err.message || 'An error occurred. Please try again.';
      console.error('Login error:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    
    try {
      console.log('Initiating Google sign in...');
      setIsLoading(true);
      const user = await signInWithGoogle();
      console.log('Google sign in successful, user:', user);
      
      // Check if token is stored
      const token = localStorage.getItem('authToken');
      console.log('Stored auth token after Google sign in:', token ? 'Token exists' : 'No token found');
      
      // The useEffect will handle the redirect when the user state updates
    } catch (err) {
      const errorMessage = err.message || 'An error occurred. Please try again.';
      console.error('Google sign in error:', errorMessage, err);
      setError(errorMessage);
      setIsLoading(false);
    }

  };

  return (
    <AuthLayout 
      title="Welcome Back"
      subtitle="Log in to continue your wellness journey"
      className="pb-24"
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-900/30"
        >
          {error.includes('auth/invalid-credential') 
            ? 'Invalid email or password. Please try again.' 
            : error}
        </motion.div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <AuthInput
          type="email"
          label="Email Address"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          icon={Mail}
          required
        />

        <AuthInput
          type={showPassword ? 'text' : 'password'}
          label="Password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          icon={Lock}
          showPasswordToggle={true}
          onTogglePassword={() => setShowPassword(!showPassword)}
          required
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">Remember me</span>
          </label>
          
          <Link 
            to="/forgot-password" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <div className="pt-2">
          <AuthButton 
            type="submit" 
            isLoading={isLoading}
            className="w-full"
          >
            Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </AuthButton>
        </div>
      </form>

      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">
            or continue with
          </span>
        </div>
      </div>

      <AuthButton
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        className="group w-full mt-6 flex items-center justify-center border border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 shadow-sm hover:shadow-md active:shadow-sm"
        disabled={isLoading}
      >
        <span className="relative flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors duration-200 -z-10"></span>
          <svg className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </span>
        <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          Continue with Google
        </span>
      </AuthButton>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link 
          to="/signup" 
          className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;