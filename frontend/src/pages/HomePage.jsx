import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

// Import components
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import HowItWorks from '../components/home/HowItWorks';
import Testimonials from '../components/home/Testimonials';
import FAQ from '../components/home/FAQ';
import CTA from '../components/home/CTA';

const HomePage = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Hero user={user} />
      <div className="bg-gray-50 dark:bg-gray-800/50 transition-colors duration-200">
        <Features />
      </div>
      <HowItWorks />
      <div className="bg-gray-50 dark:bg-gray-800/50 transition-colors duration-200">
        <Testimonials />
      </div>
      <div className="bg-gray-50 dark:bg-gray-800/50 transition-colors duration-200">
        <FAQ />
      </div>
      <CTA user={user} />
    </div>
  );
};

export default HomePage;