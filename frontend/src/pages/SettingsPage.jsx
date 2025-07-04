import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, HelpCircle, AlertTriangle, Lock, FileText } from 'lucide-react';
import useAuth from '../auth/hooks/useAuth';

// Import components
import ProfileSettings from '../components/settings/ProfileSettings';
import HelpAndSupport from '../components/settings/HelpAndSupport';
import FAQs from '../components/settings/FAQs';
import PrivacyControls from '../components/settings/PrivacyControls';
import LegalInfo from '../components/settings/LegalInfo';

// Animation variants for page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Navigation items
const navItems = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
  { id: 'faqs', label: 'FAQs', icon: AlertTriangle },
  { id: 'privacy', label: 'Privacy & Data', icon: Lock },
  { id: 'legal', label: 'Legal', icon: FileText },
];

const SettingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const { currentUser, loading } = useAuth();

  // Get active section from URL hash
  useEffect(() => {
    if (location.hash) {
      const section = location.hash.replace('#', '');
      if (navItems.some(item => item.id === section)) {
        setActiveSection(section);
      }
    }
  }, [location]);

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    navigate(`#${sectionId}`, { replace: true });
  };

  // Render the active section
  const renderActiveSection = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (activeSection) {
      case 'profile':
        return <ProfileSettings user={currentUser} />;
      case 'help':
        return <HelpAndSupport />;
      case 'faqs':
        return <FAQs />;
      case 'privacy':
        return <PrivacyControls />;
      case 'legal':
        return <LegalInfo />;
      default:
        return <ProfileSettings user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-background-secondary/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-800/50"
        >
          <div className="lg:grid lg:grid-cols-12 min-h-[70vh] max-h-[90vh] overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="py-8 lg:col-span-3 border-b lg:border-b-0 lg:border-r border-gray-800/50 bg-background-secondary/30">
              <div className="px-6 mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-sm text-text-tertiary mt-1">
                  Manage your account preferences
                </p>
              </div>
              <nav className="space-y-1 px-3">
                {navItems.map((item) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => handleSectionChange(item.id)}
                    whileHover={{ x: 4 }}
                    className={`group border-l-4 py-3.5 px-4 flex items-center text-sm font-medium w-full text-left transition-all duration-200 rounded-r-lg ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-primary/5 to-primary/10 border-primary text-text-primary font-semibold shadow-sm'
                        : 'border-transparent text-text-secondary hover:bg-background-tertiary/50 hover:text-text-primary'
                    }`}
                  >
                    <item.icon
                      className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 transition-colors ${
                        activeSection === item.id 
                          ? 'text-primary' 
                          : 'text-text-tertiary group-hover:text-text-secondary'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                    {activeSection === item.id && (
                      <motion.div 
                        layoutId="activeNavItem"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30
                        }}
                      />
                    )}
                  </motion.button>
                ))}
              </nav>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-9 bg-background-primary/50 overflow-y-auto">
              <motion.div
                key={activeSection}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                className="p-8 pt-10"
                transition={{ duration: 0.3 }}
              >
                {renderActiveSection()}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
