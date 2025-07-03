import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  MessageCircle, 
  BarChart3, 
  BookOpen, 
  Settings, 
  Menu, 
  X,
  User,
  LogIn,  
  LogOut,
  UserPlus,
  Sun,
  Moon,
  MessageSquareText
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

const NavLink = ({ to, icon: Icon, label, isActive, onClick, className = '' }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
    } ${className}`}
  >
    <Icon className="w-5 h-5 mr-2.5" />
    <span>{label}</span>
  </Link>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, loading, isRedirecting } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Navigation items for authenticated users
  const authNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/avatar-call', label: 'Seriva Call', icon: User },
    { path: '/conversations', label: 'Conversations', icon: MessageSquareText },
    { path: '/journal', label: 'Journal', icon: BookOpen },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  // Navigation items for non-authenticated users
  const publicNavItems = [
    { path: '/', label: 'Home', icon: Home },
  ];
  
  // Show loading state while checking auth status
  if (loading) {
    return (
      <div className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 transition-all duration-300 ${
        scrolled ? 'shadow-sm border-b border-gray-200 dark:border-gray-800' : ''
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-10 w-10"
            >
              <img 
                src="/logo.svg" 
                alt="Seriva" 
                className="h-full w-full object-contain"
                onError={(e) => {
                  // Fallback to PNG if SVG fails to load
                  e.target.onerror = null;
                  e.target.src = '/logo.png';
                }}
              />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">
              Seriva
            </span>
          </Link>

          <div className="flex-1" />

          <div className="hidden md:flex items-center space-x-1">
            {/* Always show Home button */}
            <NavLink
              to="/"
              icon={Home}
              label="Home"
              isActive={isActive('/')}
            />
            
            {/* Show other navigation items when logged in */}
            {currentUser && authNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                icon={item.icon}
                label={item.label}
                isActive={isActive(item.path)}
              />
            ))}
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            
            {/* Authentication Buttons */}
            {!loading && (
              <div className="flex items-center space-x-2">
                {currentUser ? (
                  <button
                    onClick={logout}
                    className="group flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-red-200 dark:border-red-900/30 hover:shadow-sm"
                  >
                    <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    <span>Sign out</span>
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border border-indigo-200 dark:border-indigo-900/30 hover:shadow-sm"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg rounded-b-lg overflow-hidden z-50"
          >
            <div className="space-y-1 px-2 pb-3 pt-2">
              {currentUser ? (
                // Show all navigation items for authenticated users
                <>
                  {authNavItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      icon={item.icon}
                      label={item.label}
                      isActive={isActive(item.path)}
                      onClick={() => setIsOpen(false)}
                      className="w-full justify-start"
                    />
                  ))}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-2.5" />
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                // Show only Home and auth buttons for non-authenticated users
                <>
                  <NavLink
                    to="/"
                    icon={Home}
                    label="Home"
                    isActive={isActive('/')}
                    onClick={() => setIsOpen(false)}
                    className="w-full justify-start"
                  />
                  <div className="px-4 py-2">
                    <Link
                      to="/login"
                      className="block w-full text-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="block w-full text-center mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              )}
              <NavLink 
                to="/conversations" 
                icon={MessageSquareText} 
                label="Conversations" 
                isActive={location.pathname.startsWith('/conversations')} 
                onClick={() => setIsOpen(false)}
                className="w-full justify-start"
              />
              <NavLink 
                to="/dashboard" 
                icon={BarChart3} 
                label="Dashboard" 
                isActive={location.pathname === '/dashboard'} 
                onClick={() => setIsOpen(false)}
                className="w-full justify-start"
              />
              <NavLink 
                to="/journal" 
                icon={BookOpen} 
                label="Journal" 
                isActive={location.pathname === '/journal'} 
                onClick={() => setIsOpen(false)}
                className="w-full justify-start"
              />
              <NavLink 
                to="/settings" 
                icon={Settings} 
                label="Settings" 
                isActive={location.pathname === '/settings'} 
                onClick={() => setIsOpen(false)}
                className="w-full justify-start"
              />
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
              <div className="px-2 py-2">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center">
                    {theme === 'dark' ? (
                      <Sun className="w-5 h-5 mr-2.5" />
                    ) : (
                      <Moon className="w-5 h-5 mr-2.5" />
                    )}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </div>
                </button>
              </div>

              {/* Authentication Buttons */}
              {!loading && (
                <div className="px-2 pb-2">
                  {currentUser ? (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <div className="flex items-center">
                        <LogOut className="w-5 h-5 mr-2.5" />
                        Sign out
                      </div>
                    </button>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsOpen(false)}
                        className="block w-full px-4 py-3 rounded-xl text-sm font-medium text-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors mb-2"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setIsOpen(false)}
                        className="block w-full px-4 py-3 rounded-xl text-sm font-medium text-center text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
