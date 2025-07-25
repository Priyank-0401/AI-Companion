import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component that scrolls to the top of the page on route change.
 * Should be placed inside the Router component.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top on route change with smooth behavior
    // Use requestAnimationFrame to ensure DOM is ready
    const scrollToTop = () => {
      try {
        // Try smooth scrolling first
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto' // Use 'auto' for instant scroll to avoid delays
        });
        
        // Also scroll any main content containers to top
        const mainElement = document.querySelector('main');
        if (mainElement) {
          mainElement.scrollTop = 0;
        }
        
        // Scroll any overflow containers
        const scrollContainers = document.querySelectorAll('[data-scroll-container]');
        scrollContainers.forEach(container => {
          container.scrollTop = 0;
        });
        
      } catch (error) {
        // Fallback to basic scroll if anything fails
        window.scrollTo(0, 0);
      }
    };

    // Use requestAnimationFrame to ensure the scroll happens after route transition
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToTop);
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
