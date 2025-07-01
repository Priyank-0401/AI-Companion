import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  MessageCircle, 
  BarChart3, 
  BookOpen, 
  Settings, 
  Menu, 
  X,
  User,
  Brain,
  LogIn,  LogOut,
  UserPlus,
  Sun,
  Moon
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../contexts/ThemeContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout, loading, isRedirecting } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const isDashboardPage = location.pathname === '/dashboard'

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrolled])

  const navItems = [    
    { path: '/', label: 'Home', icon: Home, public: true },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3, public: false },
    { path: '/avatar-call', label: 'Avatar', icon: User, public: false },
    { path: '/chat', label: 'AI Chat', icon: MessageCircle, public: false },
    { path: '/journal', label: 'Journal', icon: BookOpen, public: false },
    { path: '/settings', label: 'Settings', icon: Settings, public: false },  
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  // Filter navigation items based on authentication state
  const filteredNavItems = !currentUser 
    ? navItems.filter(item => item.public)
    : navItems 

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-40 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-all duration-300 w-full ${
        scrolled ? 'shadow-md' : ''
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              className="relative"
            >
              <img 
                src="/logo.svg" 
                alt="Seriva" 
                className="w-10 h-10 transition-transform duration-300 group-hover:rotate-6" 
              />
              <div className="absolute inset-0 rounded-full bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
            <motion.span 
              className="text-xl font-bold bg-gradient-to-r from-accent to-indigo-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              Seriva
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <div className="flex items-center space-x-1 bg-background-tertiary/30 rounded-xl p-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-background-secondary text-text-primary shadow-md'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
              {/* Authentication Buttons */}
            {!loading && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-300 hover:bg-gray-700 transition-colors"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>
                {(currentUser && !isRedirecting) ? (
                  <button
                    onClick={handleLogout}
                    className="group flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                    <span>Logout</span>
                  </button>
                ) : !currentUser ? (
                  <div className="flex items-center space-x-2 bg-background-tertiary/30 rounded-xl p-1">
                    <Link
                      to="/login"
                      className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background-tertiary/50 transition-all duration-200"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/signup"
                      className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-accent to-indigo-500 hover:from-accent/90 hover:to-indigo-500/90 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Sign Up</span>
                    </Link>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-background-tertiary/50 transition-colors group"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-text-primary group-hover:text-accent transition-colors" />
            ) : (
              <Menu className="w-6 h-6 text-text-primary group-hover:text-accent transition-colors" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation - Fixed positioned overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden fixed top-16 left-0 right-0 bg-background-secondary/95 backdrop-blur-lg shadow-xl border-t border-background-tertiary/50 overflow-hidden z-40"
          >
            <div className="w-full px-4 py-3 space-y-1">
              {filteredNavItems.map((item, index) => {
                const Icon = item.icon
                const active = isActive(item.path)
                
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        active
                          ? 'bg-background-tertiary/50 text-text-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary/30'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </motion.div>
                )
              })}
              
              {/* Mobile Authentication Buttons */}
              {!loading && (
                <motion.div 
                  className="pt-2 mt-2 border-t border-background-tertiary/30"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: filteredNavItems.length * 0.05 }}
                >
                  {(currentUser && !isRedirecting) ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (filteredNavItems.length + 0.5) * 0.05 }}
                    >
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsOpen(false)
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200 text-sm font-medium"
                      >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  ) : !currentUser ? (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        onClick={() => setIsOpen(false)}
                        className="block w-full text-center px-4 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-tertiary/30 transition-colors duration-200 text-sm font-medium"
                      >
                        <span>Login to your account</span>
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setIsOpen(false)}
                        className="block w-full text-center px-4 py-3 rounded-lg text-white bg-gradient-to-r from-accent to-indigo-500 hover:from-accent/90 hover:to-indigo-500/90 transition-all duration-200 text-sm font-medium shadow-md mt-2"
                      >
                        <span>Create an account</span>
                      </Link>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default Navbar