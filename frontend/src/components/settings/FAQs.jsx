import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, MessageSquare, Mail } from 'lucide-react';

const FAQ_ITEMS = [
  {
    id: 'password',
    question: 'How do I reset my password?',
    answer: 'You can reset your password by going to the Profile section and clicking on "Change Password". You will receive an email with instructions to reset your password.',
    icon: <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
  },
  {
    id: 'mood-tracking',
    question: 'How can I track my mood?',
    answer: 'Navigate to the Mood Tracker in the main menu. You can log your current mood and add notes about how you\'re feeling. The app will help you track patterns over time.',
    icon: <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  {
    id: 'security',
    question: 'Is my data secure?',
    answer: 'Yes, we take your privacy and security seriously. All your data is encrypted and stored securely. You can manage your privacy settings in the Privacy section.',
    icon: <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  },
  {
    id: 'support',
    question: 'How do I contact support?',
    answer: 'You can reach our support team by emailing support@wellnessapp.com or by using the contact form in the Help & Support section. We typically respond within 24-48 hours.',
    icon: <MessageSquare className="w-5 h-5 text-blue-500" />
  },
  {
    id: 'offline',
    question: 'Can I use the app offline?',
    answer: 'Yes, you can use basic features offline. Your data will sync automatically once you\'re back online.',
    icon: <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904 3.905 10.236 3.905 14.142 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
  }
];

const FAQItem = ({ question, answer, isOpen, onClick, icon }) => (
  <div className={`transition-all duration-200 ${isOpen ? 'bg-background-secondary/30' : 'hover:bg-background-secondary/10'}`}>
    <button
      className="w-full px-6 py-5 text-left flex items-start justify-between focus:outline-none group"
      onClick={onClick}
      aria-expanded={isOpen}
    >
      <div className="flex items-start space-x-4">
        <div className="mt-0.5">
          <div className="p-1.5 rounded-lg bg-background-tertiary/50">
            {icon}
          </div>
        </div>
        <div className="text-left">
          <h3 className={`text-base font-medium transition-colors ${isOpen ? 'text-primary' : 'text-text-primary group-hover:text-primary'}`}>
            {question}
          </h3>
          {isOpen && (
            <div className="mt-3 text-text-secondary pr-4">
              <p>{answer}</p>
            </div>
          )}
        </div>
      </div>
      <div className={`ml-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : 'text-text-tertiary'}`}>
        <ChevronDown className="w-5 h-5" />
      </div>
    </button>
    {isOpen && (
      <div className="px-6 pb-5 pl-16 -mt-2">
        <div className="pt-4 border-t border-border/50">
          <p className="text-sm text-text-tertiary">
            Still have questions?{' '}
            <a 
              href="https://github.com/Priyank-0401" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              github.com/Priyank-0401
            </a>
          </p>
        </div>
      </div>
    )}
  </div>
);

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-text-primary">Frequently Asked Questions</h2>
        <p className="text-text-secondary">Find answers to common questions about using our platform</p>
      </div>
      
      <div className="bg-background-secondary/30 rounded-2xl border border-border/50 overflow-hidden">
        {FAQ_ITEMS.map((faq, index) => (
          <div key={faq.id} className={index !== FAQ_ITEMS.length - 1 ? 'border-b border-border/30' : ''}>
            <FAQItem
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => toggleFAQ(index)}
              icon={faq.icon}
            />
          </div>
        ))}
      </div>
      
      <div className="bg-gradient-to-r from-blue-500/5 to-primary/5 p-6 rounded-2xl border border-border/50">
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-1">Still need help?</h3>
            <p className="text-text-secondary">
              Can't find what you're looking for? Our support team is here to help you with any questions.
            </p>
          </div>
          <a
            href="mailto:priyankpahwa41@gmail.com"
            className="inline-flex items-center px-4 py-2.5 bg-background-secondary hover:bg-background-tertiary/50 text-text-primary rounded-xl border border-border transition-colors whitespace-nowrap"
          >
            <Mail className="w-4 h-4 mr-2" />
            priyankpahwa41@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQs;
