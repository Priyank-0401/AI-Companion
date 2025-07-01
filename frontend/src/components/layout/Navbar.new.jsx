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
  Moon
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

  const navItems = [    
    { path: '/', label: 'Home', icon: Home, public: true },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3, public: false },
    { path: '/avatar-call', label: 'Avatar', icon: User, public: false },
    { path: '/chat', label: 'AI Chat', icon: MessageCircle, public: false },
    { path: '/journal', label: 'Journal', icon: BookOpen, public: false },
    { path: '/settings', label: 'Settings', icon: Settings, public: false },  
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Filter navigation items based on authentication state
  const filteredNavItems = !currentUser 
    ? navItems.filter(item => item.public)
    : navItems;

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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl p-1.5">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive(item.path)}
                />
              ))}
            </div>

            <div className="flex items-center space-x-2 ml-2">
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
                <>
                  {currentUser && !isRedirecting ? (
                    <button
                      onClick={handleLogout}
                      className="group flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                      <span>Logout</span>
                    </button>
                  ) : !currentUser ? (
                    <>
                      <Link
                        to="/login"
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/signup"
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md"
                      >
                        Sign up
                      </Link>
                    </>
                  ) : null}
                </>
              )}
            </div>
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
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden bg-white dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive(item.path)}
                  onClick={() => setIsOpen(false)}
                  className="block w-full"
                />
              ))}

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                {!loading && (
                  <>
                    {currentUser ? (
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-left rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-5 h-5 mr-2.5" />
                        Logout
                      </button>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          onClick={() => setIsOpen(false)}
                          className="block w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          Log in
                        </Link>
                        <Link
                          to="/signup"
                          onClick={() => setIsOpen(false)}
                          className="block w-full mt-2 px-4 py-3 rounded-xl text-sm font-medium text-center text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all"
                        >
                          Sign up
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 mr-2.5" />
                  ) : (
                    <Moon className="w-5 h-5 mr-2.5" />
                  )}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
