import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmail, signInWithGoogle } from '../services/authService';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Chrome, Sparkles, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

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
    
    const result = await signInWithEmail(email, password);
    
    if (result.success) {
      navigate('/chat'); // Redirect to chat page after successful login
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };
  
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    const result = await signInWithGoogle();
    
    if (result.success) {
      navigate('/chat');
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };
  
  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      
      {/* Main content - Split Layout */}      
      <div className="flex h-screen pb-16">
        {/* Left Section - Form (70%) */}        
        <div className="w-full lg:w-[70%] p-10 flex items-center justify-start relative">          {/* AI Neural Network Decoration */}
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
            animate={{ opacity: 1, y: 0 }}            transition={{ duration: 0.5 }}
            className="w-full max-w-xl relative z-10 pl-8"
            style={{ marginLeft: "2rem" }}
          >
            {/* Form Header */}
            <div className="mb-8">  
              <h1 className="text-4xl font-bold text-white mb-2">
                Sign in to account<span className="text-accent">.</span>
              </h1>
              <p className="text-lightText/60">
                Don't have an account? <Link to="/signup" className="text-accent hover:text-accent/80 transition-all">Create one here</Link>
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
                  <span>{error.includes("auth/invalid-credential") ? "Invalid email or password. Please try again." : error}</span>
                </div>
              </motion.div>
            )}

            {/* Login Form */}
            <motion.form
              onSubmit={handleLogin}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-lightText/80 text-sm font-medium ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-lightText/40 group-focus-within:text-accent transition-colors duration-200" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-lightText/40 group-focus-within:text-accent transition-colors duration-200" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 ${
                      rememberMe 
                        ? 'bg-accent border-accent' 
                        : 'border-lightText/20 group-hover:border-accent/50'
                    }`}>
                      {rememberMe && (
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
                  <span className="text-lightText/70 text-sm group-hover:text-lightText transition-colors duration-200">
                    Remember me
                  </span>
                </label>
                
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-accent hover:text-accent/80 transition-colors duration-200 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-accent to-blue-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 group relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="relative">Signing you in...</span>
                  </>
                ) : (
                  <>
                    <span className="relative mr-2">Sign In</span>
                    <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </motion.button>
            </motion.form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-lightText/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-dark text-lightText/60">or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <motion.button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-white/5 hover:bg-white/10 border border-lightText/10 hover:border-lightText/20 text-lightText font-semibold rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Chrome className="w-5 h-5 mr-3 text-lightText/70 group-hover:text-white transition-colors duration-200" />
              <span className="group-hover:text-white transition-colors duration-200">Continue with Google</span>
            </motion.button>

            
          </motion.div>
        </div>        {/* Right Section - Image (30%) */}
        <div className="hidden lg:block lg:w-[30%] relative overflow-hidden">          {/* Gradient overlay with horizontal fade effect - darker on left, more visible on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/80 to-dark/50 z-10"></div>
          
          {/* Additional vertical gradient for bottom content visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark/70 z-10"></div>
          
          {/* Added motion for subtle animation on page load */}
          <motion.div
            initial={{ scale: 1.1, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0"
          >            {/* Using the auth image from public folder */}
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

export default LoginPage;