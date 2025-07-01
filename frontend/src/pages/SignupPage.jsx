import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Chrome, Check, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import AuthInput from '../components/auth/AuthInput';
import AuthButton from '../components/auth/AuthButton';

const SignupPage = () => {
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

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return false;
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      await updateProfile(userCredential.user, {
        displayName: formData.name
      });
      
      navigate('/');
    } catch (err) {
      setError(err.message.includes('auth/email-already-in-use') 
        ? 'An account with this email already exists.' 
        : 'Failed to create account. Please try again.');
      console.error("Signup error:", err);
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      setError('Failed to sign up with Google. Please try again.');
      console.error("Google sign up error:", err);
    }
    
    setIsLoading(false);
  };

  return (
    <AuthLayout 
      title="Create Your Account"
      subtitle="Join our community and start your wellness journey"
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

      <form onSubmit={handleSignup} className="space-y-5">
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
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="font-medium text-gray-700 dark:text-gray-300">
              I agree to the{' '}
              <a href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
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
        onClick={handleGoogleSignup}
        variant="outline"
        isLoading={isLoading}
        className="w-full"
      >
        <Chrome className="w-4 h-4 mr-2" />
        Continue with Google
      </AuthButton>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link 
          to="/login" 
          className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default SignupPage;
