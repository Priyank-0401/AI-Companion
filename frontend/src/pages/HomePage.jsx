import { useEffect, useRef } from 'react';
import useAuth from '../auth/hooks/useAuth';

// Import components
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import HowItWorks from '../components/home/HowItWorks';
import Testimonials from '../components/home/Testimonials';
import FAQ from '../components/home/FAQ';
import CTA from '../components/home/CTA';
import WellnessPhilosophy from '../components/home/WellnessPhilosophy';
import PrivacyFirst from '../components/home/PrivacyFirst';

const HomePage = () => {
  const { user } = useAuth();
  const featuresRef = useRef(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Hero user={user} scrollToFeatures={scrollToFeatures} />
      <div ref={featuresRef} className="bg-white dark:bg-gray-900 transition-colors duration-200">
        <Features />
      </div>
      <div className="bg-white dark:bg-gray-900 transition-colors duration-200">
        <HowItWorks />
      </div>
      <div className="bg-white dark:bg-gray-900 transition-colors duration-200">
        <WellnessPhilosophy />
      </div>
      <div className="bg-white dark:bg-gray-900 transition-colors duration-200">
        <Testimonials />
      </div>
      <div className="bg-white dark:bg-gray-900 transition-colors duration-200">
        <PrivacyFirst />
      </div>
      <div className="bg-white dark:bg-gray-900 transition-colors duration-200">
        <FAQ />
      </div>
      <div className="bg-white dark:bg-gray-900 transition-colors duration-200">
        <CTA user={user} />
      </div>
    </div>
  );
};

export default HomePage;