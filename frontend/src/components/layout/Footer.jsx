import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaLinkedin, FaGithub } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <FaLinkedin />, href: 'https://linkedin.com/in/priyankpahwa41', 'aria-label': 'LinkedIn' },
    { icon: <FaGithub />, href: 'https://github.com/priyank-0401/AI-Companion', 'aria-label': 'GitHub' },
    { icon: <FaInstagram />, href: 'https://instagram.com/priyank.0401', 'aria-label': 'Instagram' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="container mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Seriva */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">About Seriva</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="hover:text-violet-400 transition-colors">What is Seriva?</Link></li>
              <li><Link to="/about#companion" className="hover:text-violet-400 transition-colors">Meet the AI Companion</Link></li>
              <li><Link to="/how-it-works" className="hover:text-violet-400 transition-colors">How It Works</Link></li>
              <li><Link to="/philosophy" className="hover:text-violet-400 transition-colors">Wellness Philosophy</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="hover:text-violet-400 transition-colors">Home</Link></li>
              <li><Link to="/journal" className="hover:text-violet-400 transition-colors">Journal</Link></li>
              <li><Link to="/chat" className="hover:text-violet-400 transition-colors">Avatar Chat</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="hover:text-violet-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-violet-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookies" className="hover:text-violet-400 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
            <ul className="space-y-3">
              <li><a href="mailto:priyankpahwa41@gmail.com" className="hover:text-violet-400 transition-colors">Contact: priyankpahwa41@gmail.com</a></li>
              <li><Link to="/feedback" className="hover:text-violet-400 transition-colors">Feedback & Suggestions</Link></li>
            </ul>
            <div className="flex space-x-4 mt-6">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link['aria-label']}
                  className="text-gray-400 hover:text-violet-400 hover:scale-110 transition-transform"
                >
                  {React.cloneElement(link.icon, { size: 24 })}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-base">
          <p className="mb-2">&copy; {currentYear} Seriva AI Companion. All rights reserved.</p>
          <p className="mb-2">Built with ❤️ and lots of ☕️ by Priyank Pahwa</p>
          <p className="text-gray-500">Made in India | v1.0.0 Beta | Some features are still in development</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
