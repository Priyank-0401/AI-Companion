import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../auth/hooks/useAuth';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Chrome, Check, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import AuthInput from '../components/auth/AuthInput';
import AuthButton from '../components/auth/AuthButton';

const SignupPage = () => {
  const { signUp, signInWithGoogle } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordSuggestions, setPasswordSuggestions] = useState([]);
  const navigate = useNavigate();

  const handleGoogleSignup = async () => {
    setError('');
    
    try {
      setIsLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Google sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (value) => {
    let strength = 0;
    const suggestions = [];
    
    // Check length
    if (value.length >= 8) strength += 25;
    else suggestions.push('Use at least 8 characters');
    
    // Check for lowercase letters
    if (/[a-z]/.test(value)) strength += 25;
    else suggestions.push('Include a lowercase letter');
    
    // Check for uppercase letters
    if (/[A-Z]/.test(value)) strength += 25;
    else suggestions.push('Include an uppercase letter');
    
    // Check for numbers
    if (/\d/.test(value)) strength += 25;
    else suggestions.push('Include at least one number');
    
    setPasswordStrength(strength);
    setPasswordSuggestions(suggestions);
  };

  const getPasswordStrengthColor = () => {
    if (formData.password.length === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (formData.password.length === 0) return '';
    if (passwordStrength < 25) return 'Very Weak';
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength < 3) {
      setError('Please choose a stronger password');
      return;
    }
    
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signUp(formData.email, formData.password, formData.name);
      navigate('/');
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create an account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Google signup error:', error);
      setError(error.message || 'Failed to sign up with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create Your Account"
      subtitle="Join our community and start your wellness journey"
      className="pb-24"
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-900/30"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthInput
          type="text"
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Your full name"
          icon={User}
          required
        />

        <AuthInput
          type="email"
          label="Email Address"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="your@email.com"
          icon={Mail}
          required
        />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            {formData.password && (
              <span className={`text-xs font-medium text-white px-2 py-0.5 rounded-full ${getPasswordStrengthColor()}`}>
                {getPasswordStrengthText()}
              </span>
            )}
          </div>
          
          <AuthInput
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            icon={Lock}
            showPasswordToggle={true}
            onTogglePassword={() => setShowPassword(!showPassword)}
            required
          />
          
          {/* Password strength meter */}
          {formData.password && (
            <div className="mt-2">
              <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getPasswordStrengthColor().replace('bg-', 'bg-opacity-100 ')} transition-all duration-300`}
                  style={{ width: `${passwordStrength}%` }}
                ></div>
              </div>
              
              {/* Password suggestions */}
              {passwordSuggestions.length > 0 && passwordStrength < 75 && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>Make your password stronger by:</p>
                  <ul className="list-disc list-inside">
                    {passwordSuggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <AuthInput
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="••••••••"
          icon={Lock}
          showPasswordToggle={true}
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          required
        />
        
        {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="-mt-3 text-sm text-red-600 dark:text-red-400">
            Passwords don't match
          </p>
        )}

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="font-medium text-gray-700 dark:text-gray-300">
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>
        </div>

        <div className="pt-2">
          <AuthButton 
            type="submit" 
            isLoading={isLoading}
            className="w-full"
          >
            Create Account
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
            or sign up with
          </span>
        </div>
      </div>

      <AuthButton
        type="button"
        variant="outline"
        onClick={handleGoogleSignup}
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
        Already have an account?{' '}
        <Link 
          to="/login" 
          className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default SignupPage;
