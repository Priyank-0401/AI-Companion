import { useState, useEffect, useRef } from 'react';
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
  const themeButtonRef = useRef(null);
  const mobileThemeButtonRef = useRef(null);
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
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/avatar-call', label: 'Avatar Call', icon: User },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg' 
          : 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${
          scrolled ? 'h-16' : 'h-20'
        }`}>
          {/* Logo */}
          <div className="flex-shrink-0">
              <Link to="/" className="group flex items-center transition-all duration-200 hover:scale-105">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-600/20 dark:bg-indigo-400/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img src="/logo.svg" alt="Seriva Logo" className="relative h-10 w-10 transition-transform duration-200" />
                </div>
                <span className="ml-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400 transition-colors duration-200">
                  Seriva
                </span>
              </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              // Show all navigation items for authenticated users
              <div className="flex items-center space-x-1 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl p-1.5 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
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
              <div className="flex items-center space-x-1 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl p-1.5 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
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
              ref={themeButtonRef}
              onClick={() => toggleTheme(themeButtonRef.current)}
              className="relative p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 hover:scale-110 group"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 dark:from-blue-400/20 dark:to-purple-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              {theme === 'dark' ? (
                <Sun className="relative w-5 h-5 transition-transform duration-200 group-hover:rotate-12" />
              ) : (
                <Moon className="relative w-5 h-5 transition-transform duration-200 group-hover:-rotate-12" />
              )}
            </button>

            {/* Authentication Buttons */}
            <div className="flex items-center space-x-3 ml-4">
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
                        className="group px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 flex items-center space-x-2 hover:shadow-md hover:scale-105 border border-red-200/50 dark:border-red-800/50"
                        disabled={loading}
                      >
                        <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        <span>Sign Out</span>
                      </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/login"
                      className="group px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:scale-105 border border-gray-200/50 dark:border-gray-700/50"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="group relative px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-all duration-200 flex items-center shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                      <span className="relative">Get Started</span>
                      <ArrowRight className="relative ml-1.5 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              ref={mobileThemeButtonRef}
              onClick={() => toggleTheme(mobileThemeButtonRef.current)}
              className="relative p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 hover:scale-110 group"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 dark:from-blue-400/20 dark:to-purple-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              {theme === 'dark' ? (
                <Sun className="relative w-5 h-5 transition-transform duration-200 group-hover:rotate-12" />
              ) : (
                <Moon className="relative w-5 h-5 transition-transform duration-200 group-hover:-rotate-12" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="group p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 hover:scale-110 border border-gray-200/50 dark:border-gray-700/50"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" />
              ) : (
                <Menu className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
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
            className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 shadow-xl"
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
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
                    className="group w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-105 border border-red-200/50 dark:border-red-800/50"
                  >
                    <LogOut className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
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
                  <div className="pt-4 space-y-3">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="group block w-full text-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:scale-105 border border-gray-200/50 dark:border-gray-700/50"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsOpen(false)}
                      className="group relative block w-full text-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                      <span className="relative">Get Started</span>
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
