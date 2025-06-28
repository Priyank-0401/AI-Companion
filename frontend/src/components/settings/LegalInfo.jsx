import { FileText, ExternalLink, Code, Shield, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const LEGAL_LINKS = [
  {
    name: 'Terms of Service',
    description: 'Read our terms and conditions',
    icon: FileText,
    url: '/terms'
  },
  {
    name: 'Privacy Policy',
    description: 'Learn how we handle your data',
    icon: Shield,
    url: '/privacy'
  },
  {
    name: 'Open Source Licenses',
    description: 'View open source attributions',
    icon: Code,
    url: '/licenses'
  },
  {
    name: 'About Us',
    description: 'Learn more about our company',
    icon: Info,
    url: '/about'
  }
];

const LegalInfo = () => {
  // App version - in a real app, this would come from your build process
  const appVersion = '1.0.0'; // Replace with your actual version or import from package.json
  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-2"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Legal Information
        </h2>
        <p className="text-text-tertiary mt-1.5">
          Review our policies and legal documents
        </p>
      </motion.div>
      
      <motion.div 
        className="bg-background-secondary/50 rounded-2xl overflow-hidden border border-gray-800/50 backdrop-blur-sm"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <ul className="divide-y divide-gray-800/50">
          {LEGAL_LINKS.map((item, index) => (
            <motion.li 
              key={index} 
              className="group hover:bg-background-tertiary/30 transition-colors"
              variants={itemVariants}
              whileHover={{ x: 4 }}
            >
              <a
                href={item.url}
                className="block px-6 py-5"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary border border-gray-800/50 group-hover:border-primary/30 transition-all duration-300">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {item.name}
                    </p>
                    <p className="text-sm text-text-tertiary/90 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <div className="ml-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <ExternalLink className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </a>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div 
        className="mt-10 pt-6 border-t border-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-4 sm:mb-0">
            <p className="text-sm text-text-tertiary/80">
              &copy; {currentYear} Wellness App. All rights reserved.
            </p>
            <p className="text-xs text-text-tertiary/60 mt-1">
              Version {appVersion} • Last updated {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex space-x-6">
            <a 
              href="#" 
              className="text-sm text-text-tertiary hover:text-primary transition-colors hover:underline underline-offset-4 decoration-primary/50"
            >
              Cookie Policy
            </a>
            <a 
              href="#" 
              className="text-sm text-text-tertiary hover:text-primary transition-colors hover:underline underline-offset-4 decoration-primary/50"
            >
              Data Processing Agreement
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LegalInfo;
