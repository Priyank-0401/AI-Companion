import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmail, signInWithGoogle } from '../services/authService';
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Failed to sign in. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    }
    
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Failed to sign in with Google.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Google sign in error:', err);
    }
    
    setIsLoading(false);
  };

  return (
    <AuthLayout 
      title="Welcome Back"
      subtitle="Log in to continue your wellness journey"
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

      <form onSubmit={handleLogin} className="space-y-5">
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
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700 dark:text-gray-300">Remember me</span>
          </label>
          
          <Link 
            to="/forgot-password" 
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
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

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            or continue with
          </span>
        </div>
      </div>

      <AuthButton
        onClick={handleGoogleLogin}
        variant="outline"
        isLoading={isLoading}
        className="w-full"
      >
        <Chrome className="w-4 h-4 mr-2" />
        Continue with Google
      </AuthButton>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link 
          to="/signup" 
          className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;