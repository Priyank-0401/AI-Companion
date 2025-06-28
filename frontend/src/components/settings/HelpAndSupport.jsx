import { useState } from 'react';
import { Mail, AlertTriangle, Check, Send, MessageSquare, HelpCircle } from 'lucide-react';

const HelpAndSupport = () => {
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Message submitted:', message);
      setMessage('');
      setIsSubmitted(true);
      setIsSubmitting(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setIsSubmitted(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-text-primary">Help & Support</h2>
        <p className="text-text-secondary">Get assistance or report any issues you're experiencing</p>
      </div>
      
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-500/5 to-primary/5 p-6 rounded-2xl border border-border/50">
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1.5">Need help?</h3>
              <p className="text-text-secondary">
                Our support team is here to help you with any questions or issues you might have.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-background-secondary/50 p-6 rounded-2xl border border-border/50">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-primary" />
              Contact Support
            </h3>
            <div className="space-y-4">
              <p className="text-text-secondary">
                Send us an email and we'll get back to you as soon as possible.
              </p>
              <div className="flex items-center space-x-4">
                <a
                  href="mailto:support@wellnessapp.com"
                  className="inline-flex items-center px-4 py-2.5 bg-background-secondary hover:bg-background-tertiary/50 text-text-primary rounded-xl border border-border transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  support@wellnessapp.com
                </a>
                <span className="text-sm text-text-tertiary">
                  Typical response time: 24-48 hours
                </span>
              </div>
            </div>
          </div>

          <div className="bg-background-secondary/50 p-6 rounded-2xl border border-border/50">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
              Report a Bug
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="bug-message" className="block text-sm font-medium text-text-secondary mb-2">
                  Describe the issue
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="bug-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-background-secondary/80 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-text-primary placeholder-text-tertiary/60 transition-colors"
                    placeholder="Please describe the issue you're experiencing in detail..."
                    required
                  />
                </div>
                <p className="mt-1.5 text-sm text-text-tertiary">
                  Include steps to reproduce, expected behavior, and any error messages
                </p>
              </div>

              <div className="flex items-start p-3 bg-amber-500/10 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-amber-500">
                  We take all reports seriously and will review your submission as soon as possible.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!message.trim() || isSubmitting}
                  className={`px-5 py-2.5 text-sm font-medium rounded-xl flex items-center justify-center min-w-[140px] transition-all ${
                    !message.trim() || isSubmitting
                      ? 'bg-background-tertiary/50 text-text-tertiary cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1.5" />
                      Send Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {isSubmitted && (
          <div className="fixed bottom-6 right-6 bg-green-500/90 text-white px-6 py-3 rounded-xl shadow-lg flex items-center animate-fade-in-up">
            <Check className="w-5 h-5 mr-2 text-white" />
            <div>
              <p className="font-medium">Thank you for your feedback!</p>
              <p className="text-sm opacity-90">We've received your report and will get back to you soon.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpAndSupport;
