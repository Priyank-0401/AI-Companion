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
    <div className="min-h-screen bg-gradient-to-br from-dark via-mediumDark to-dark relative overflow-hidden pt-12">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-accent/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-accent/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      
      {/* Main content */}
      <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Main Card */}
          <div className="relative">
            {/* Glowing border effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-accent via-blue-500 to-purple-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
            
            <div className="relative bg-mediumDark/90 backdrop-blur-xl border border-accent/20 rounded-3xl p-8 shadow-2xl">
              {/* Header */}
              <motion.div 
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <div className="relative inline-block mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-accent to-blue-500 rounded-full opacity-20 blur-md"
                  />
                  <img src="/logo.svg" alt="Seriva" className="relative w-20 h-20 mx-auto rounded-full" />
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-6 h-6 text-accent" />
                  </motion.div>
                </div>
                
                <h1 className="text-4xl font-bold text-lightText mb-3 bg-gradient-to-r from-lightText to-accent bg-clip-text text-transparent">
                  Welcome Back
                </h1>
                <p className="text-lightText/70 text-lg">
                  Continue your journey with Seriva
                </p>
                
                {/* Trust indicators */}
                <div className="flex items-center justify-center mt-4 space-x-4 text-sm text-lightText/50">
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span>Secure</span>
                  </div>
                  <div className="w-1 h-1 bg-lightText/30 rounded-full"></div>
                  <div className="flex items-center space-x-1">
                    <span>Private</span>
                  </div>
                  <div className="w-1 h-1 bg-lightText/30 rounded-full"></div>
                  <div className="flex items-center space-x-1">
                    <span>AI-Powered</span>
                  </div>
                </div>
              </motion.div>

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
                      className="w-full pl-12 pr-4 py-4 bg-dark/50 border border-lightText/10 rounded-xl text-lightText placeholder-lightText/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300 hover:border-lightText/20"
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
                      className="w-full pl-12 pr-12 py-4 bg-dark/50 border border-lightText/10 rounded-xl text-lightText placeholder-lightText/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300 hover:border-lightText/20"
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
                      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
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
                  className="w-full py-4 bg-gradient-to-r from-accent to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 group relative overflow-hidden"
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
                  <span className="px-4 bg-mediumDark/90 text-lightText/60">or continue with</span>
                </div>
              </div>

              {/* Google Sign In */}
              <motion.button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-lightText/10 hover:border-lightText/20 text-lightText font-semibold rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group backdrop-blur-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Chrome className="w-5 h-5 mr-3 text-lightText/70 group-hover:text-white transition-colors duration-200" />
                <span className="group-hover:text-white transition-colors duration-200">Continue with Google</span>
              </motion.button>

              {/* Sign Up Link */}
              <motion.div
                className="text-center mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <p className="text-lightText/60">
                  Don't have an account?{' '}
                  <Link 
                    to="/signup" 
                    className="font-semibold text-accent hover:text-accent/80 transition-colors duration-200 hover:underline"
                  >
                    Create one here
                  </Link>
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;