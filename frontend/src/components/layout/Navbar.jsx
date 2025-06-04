import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, 
  MessageCircle, 
  Heart, 
  BookOpen, 
  Settings, 
  Menu, 
  X,
  Brain,
  LogIn,
  LogOut,
  UserPlus
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout, loading } = useAuth()
  const isWellnessPage = location.pathname === '/wellness'

  const navItems = [
    { path: '/', label: 'Home', icon: Home, public: true },
    { path: '/chat', label: 'AI Chat', icon: MessageCircle, public: false },
    { path: '/wellness', label: 'Wellness', icon: Heart, public: false },
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

  const filteredNavItems = currentUser 
    ? navItems 
    : navItems.filter(item => item.public)

  return (
    <nav className="bg-mediumDark shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}

            >
              <img src="/logo.svg" alt="Seriva" className="w-20 h-20" />
            </motion.div>
            <span className="text-xl font-bold gradient-text">Seriva</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-accent text-white'
                      : 'text-lightText hover:bg-accent/20 hover:text-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            
            {/* Authentication Buttons */}
            {!loading && (
              <div className="flex items-center space-x-2 ml-4">
                {currentUser ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-lightText hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-lightText hover:bg-accent/20 hover:text-accent transition-all duration-200"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/signup"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/80 transition-all duration-200"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Sign Up</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-accent/20 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation - Fixed positioned overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="md:hidden fixed top-16 left-0 right-0 bg-mediumDark shadow-lg border-t border-mediumDark/50 max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          <div className="container mx-auto px-4 py-4 space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-accent text-white'
                      : 'text-lightText hover:bg-accent/20 hover:text-accent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {/* Mobile Authentication Buttons */}
            {!loading && (
              <div className="pt-2 border-t border-mediumDark/50 mt-2">
                {currentUser ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-lightText hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-lightText hover:bg-accent/20 hover:text-accent transition-all duration-200"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-accent text-white hover:bg-accent/80 transition-all duration-200"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Sign Up</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  )
}

export default Navbar