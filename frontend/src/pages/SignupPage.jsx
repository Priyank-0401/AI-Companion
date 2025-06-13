import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUpWithEmail, signInWithGoogle } from '../services/authService';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Chrome, Sparkles, Eye, EyeOff, ArrowRight, Shield, CheckCircle } from 'lucide-react';

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
  const navigate = useNavigate();
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Calculate password strength
    if (name === 'password') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9]+/)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };
  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
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
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
        // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: formData.name
      });
      
      navigate('/'); // Redirect to home page after successful signup
    } catch (err) {
      setError(err.message);
      console.error("Firebase signup error:", err);
    }    setIsLoading(false);
  };
  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      setError(err.message);
      console.error("Google signup error:", err);
    }
    setIsLoading(false);
  };return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      
      {/* Main content - Split Layout */}
      <div className="flex h-screen pb-16">
        {/* Left Section - Form (70%) */}
        <div className="w-full lg:w-[70%] p-10 flex items-center justify-start relative">
          {/* AI Neural Network Decoration */}
          <div className="absolute right-0 h-full opacity-20 pointer-events-none overflow-hidden">
            <svg width="600" height="800" viewBox="0 0 600 800" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Neural Network Nodes */}
              <circle cx="180" cy="120" r="8" fill="#00ADB5" opacity="0.8" />
              <circle cx="320" cy="230" r="6" fill="#00ADB5" opacity="0.6" />
              <circle cx="420" cy="150" r="10" fill="#00ADB5" opacity="0.7" />
              <circle cx="250" cy="350" r="7" fill="#00ADB5" opacity="0.8" />
              <circle cx="450" cy="380" r="9" fill="#00ADB5" opacity="0.6" />
              <circle cx="150" cy="450" r="8" fill="#00ADB5" opacity="0.7" />
              <circle cx="380" cy="520" r="7" fill="#00ADB5" opacity="0.8" />
              <circle cx="220" cy="600" r="9" fill="#00ADB5" opacity="0.7" />
              <circle cx="350" cy="680" r="8" fill="#00ADB5" opacity="0.6" />
              
              {/* Neural Network Connections */}
              <path d="M180 120L320 230L420 150" stroke="#00ADB5" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M320 230L250 350L450 380" stroke="#00ADB5" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M250 350L150 450L380 520" stroke="#00ADB5" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M380 520L220 600L350 680" stroke="#00ADB5" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M450 380L380 520" stroke="#00ADB5" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M150 450L220 600" stroke="#00ADB5" strokeWidth="1.5" strokeDasharray="4 4" />
              
              {/* Brain Outline */}
              <path d="M300 50C380 90 450 110 480 180C510 250 500 320 470 380C440 440 390 470 350 520C310 570 280 630 300 680C320 730 380 760 300 780C220 760 280 730 300 680C320 630 290 570 250 520C210 470 160 440 130 380C100 320 90 250 120 180C150 110 220 90 300 50Z" 
                stroke="#00ADB5" strokeWidth="1.5" opacity="0.3" strokeDasharray="5 5" fill="none" />
            </svg>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-xl relative z-10 pl-8"
            style={{ marginLeft: "2rem" }}
          >
            {/* Form Header */}
            <div className="mb-8">  
              <h1 className="text-4xl font-bold text-white mb-2">
                Create account<span className="text-accent">.</span>
              </h1>
              <p className="text-lightText/60">
                Already have an account? <Link to="/login" className="text-accent hover:text-accent/80 transition-all">Sign in here</Link>
              </p>
            </div>
            
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm backdrop-blur-sm"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span>{error.includes("auth/email-already-in-use") ? "An account with this email already exists." : error}</span>
                </div>
              </motion.div>
            )}              {/* Signup Form */}
              <motion.form
                onSubmit={handleSignup}
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {/* Name Input */}
                <div className="space-y-2">
                  <label className="block text-lightText/80 text-sm font-medium ml-1">
                    Full Name
                  </label>
                  <div className="relative group">                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-lightText/40 group-focus-within:text-accent transition-colors duration-200" />                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-mediumDark/40 border border-lightText/10 rounded-full text-lightText placeholder-lightText/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300 hover:border-lightText/20"
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="block text-lightText/80 text-sm font-medium ml-1">
                    Email Address
                  </label>
                  <div className="relative group">                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-lightText/40 group-focus-within:text-accent transition-colors duration-200" />                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-mediumDark/40 border border-lightText/10 rounded-full text-lightText placeholder-lightText/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300 hover:border-lightText/20"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="block text-lightText/80 text-sm font-medium ml-1">
                    Password
                  </label>
                  <div className="relative group">                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-lightText/40 group-focus-within:text-accent transition-colors duration-200" />                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a strong password"
                      required
                      className="w-full pl-12 pr-12 py-4 bg-mediumDark/40 border border-lightText/10 rounded-full text-lightText placeholder-lightText/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300 hover:border-lightText/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lightText/40 hover:text-accent transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-lightText/60">Password strength</span>
                        <span className={`font-medium ${passwordStrength >= 75 ? 'text-green-400' : passwordStrength >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-lightText/10 rounded-full h-1.5">
                        <motion.div
                          className={`h-1.5 rounded-full ${getPasswordStrengthColor()}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label className="block text-lightText/80 text-sm font-medium ml-1">
                    Confirm Password
                  </label>
                  <div className="relative group">                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-lightText/40 group-focus-within:text-accent transition-colors duration-200" />                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      required
                      className="w-full pl-12 pr-12 py-4 bg-mediumDark/40 border border-lightText/10 rounded-full text-lightText placeholder-lightText/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300 hover:border-lightText/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lightText/40 hover:text-accent transition-colors duration-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center space-x-2 text-xs"
                    >
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-red-400" />
                          <span className="text-red-400">Passwords don't match</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Terms Agreement */}
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <div className="relative mt-1">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                        agreedToTerms 
                          ? 'bg-accent border-accent' 
                          : 'border-lightText/20 group-hover:border-accent/50'
                      }`}>
                        {agreedToTerms && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-3 h-3 text-white absolute top-0.5 left-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </motion.svg>
                        )}
                      </div>
                    </div>
                    <span className="text-lightText/70 text-sm leading-relaxed group-hover:text-lightText transition-colors duration-200">
                      I agree to the{' '}
                      <Link to="/terms" className="text-accent hover:text-accent/80 underline">
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-accent hover:text-accent/80 underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || !agreedToTerms}
                  className="w-full py-4 bg-gradient-to-r from-accent to-blue-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 group relative overflow-hidden"
                  whileHover={{ scale: agreedToTerms ? 1.02 : 1 }}
                  whileTap={{ scale: agreedToTerms ? 0.98 : 1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="relative">Creating your account...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative mr-2">Create Account</span>
                      <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </motion.button>
              </motion.form>              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-lightText/10"></div>
                </div>              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-dark text-lightText/60">or continue with</span>
              </div>
              </div>              {/* Google Sign Up */}
              <motion.button
                onClick={handleGoogleSignup}
                disabled={isLoading}
                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-lightText/10 hover:border-lightText/20 text-lightText font-semibold rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group backdrop-blur-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Chrome className="w-5 h-5 mr-3 text-lightText/70 group-hover:text-white transition-colors duration-200" />
                <span className="group-hover:text-white transition-colors duration-200">Continue with Google</span>
              </motion.button>             
          </motion.div>
        </div>
          {/* Right Section - Image (30%) */}
        <div className="hidden lg:block lg:w-[30%] relative overflow-hidden">
          {/* Gradient overlay with horizontal fade effect - darker on left, more visible on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/80 to-dark/50 z-10"></div>
          
          {/* Additional vertical gradient for bottom content visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark/70 z-10"></div>
          
          {/* Added motion for subtle animation on page load */}
          <motion.div
            initial={{ scale: 1.1, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {/* Using the auth image from public folder */}
            <img 
              src="/auth-image.png" 
              alt="AI Mind Visualization" 
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: 'brightness(0.9) saturate(2)' }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
