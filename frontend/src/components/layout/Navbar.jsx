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
  Sun,
  Moon,
  ArrowRight,
  LogOut
} from 'lucide-react';
import useAuth from '../../auth/hooks/useAuth';
import { useTheme } from '../../contexts/useTheme';

const NavLink = ({ to, icon: Icon, label, isActive, onClick, className = '' }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`group flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive 
        ? 'text-white bg-indigo-600 shadow-md' 
        : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/80'
    } ${className}`}
  >
    <Icon className={`w-5 h-5 mr-2.5 transition-transform duration-200 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:scale-110'}`} />
    <span>{label}</span>
  </Link>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();  const { user, signOut, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation items for authenticated users
  const authNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/avatar-call', label: 'Avatar Call', icon: User },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/chat', label: 'Chat', icon: MessageCircle },
    { path: '/journal', label: 'Journal', icon: BookOpen },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  // Navigation items for public users
  const publicNavItems = [
    { path: '/', label: 'Home', icon: Home },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };



  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img src="/logo.svg" alt="Seriva Logo" className="h-10 w-10" />
                <span className="ml-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  Seriva
                </span>
              </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              // Show all navigation items for authenticated users
              <div className="flex space-x-1">
                {authNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive(item.path)}
                  />
                ))}
              </div>
            ) : (
              // Show only public navigation items for non-authenticated users
              <div className="flex space-x-1">
                {publicNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive(item.path)}
                  />
                ))}
              </div>
            )}

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
            <div className="flex items-center space-x-2 ml-2">
              {!loading && (
                user ? (
                  <div className="flex items-center">
                      <button
                        onClick={async () => {
                          try {
                            await signOut();
                            navigate('/login');
                          } catch (error) {
                            console.error('Error signing out:', error);
                          }
                        }}
                        className="px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center space-x-2"
                        disabled={loading}
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/login"
                      className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50 flex items-center"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="ml-1.5 w-4 h-4" />
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
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
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (

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
                    onClick={async () => {
                      try {
                        await signOut();
                        setIsOpen(false);
                        navigate('/login');
                      } catch (error) {
                        console.error('Error signing out:', error);
                      }
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                // Show only public navigation items for non-authenticated users
                <>
                  {publicNavItems.map((item) => (
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
                  <div className="px-2 pt-2 space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
