import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Star, Lightbulb, Bug, Heart, Send, User, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import { feedbackService } from '../services/firestoreService';
import useAuth from '../auth/hooks/useAuth';
import { toast } from 'react-hot-toast';

const FeedbackPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    feedbackType: 'general',
    rating: 0,
    subject: '',
    message: '',
    contactPreference: 'email'
  });

  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const feedbackTypes = [
    {
      id: 'general',
      label: 'General Feedback',
      icon: MessageSquare,
      color: 'blue',
      description: 'Share your overall experience with Seriva'
    },
    {
      id: 'suggestion',
      label: 'Feature Suggestion',
      icon: Lightbulb,
      color: 'yellow',
      description: 'Suggest new features or improvements'
    },
    {
      id: 'bug',
      label: 'Bug Report',
      icon: Bug,
      color: 'red',
      description: 'Report technical issues or problems'
    },
    {
      id: 'appreciation',
      label: 'Appreciation',
      icon: Heart,
      color: 'pink',
      description: 'Share what you love about Seriva'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.message.trim()) {
      toast.error('Please enter your feedback message');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await feedbackService.submitFeedback({
        ...formData,
        // Ensure rating is a number
        rating: typeof formData.rating === 'string' 
          ? parseInt(formData.rating, 10) 
          : formData.rating,
        // Add user ID if logged in
        userId: user?.uid || null,
        userEmail: formData.email,
        userName: formData.name,
        // Add browser and device info
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString()
      });
      
      // Show success message
      toast.success('Thank you for your feedback!');
      setIsSubmitted(true);
      
      // Reset form
      setFormData({
        name: user?.displayName || '',
        email: user?.email || '',
        feedbackType: 'general',
        rating: 0,
        subject: '',
        message: '',
        contactPreference: 'email'
      });
      setHoveredRating(0);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleStartNewFeedback = () => {
    setIsSubmitted(false);
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'from-blue-400 to-indigo-500 border-blue-200 dark:border-blue-800',
      yellow: 'from-yellow-400 to-orange-500 border-yellow-200 dark:border-yellow-800',
      red: 'from-red-400 to-pink-500 border-red-200 dark:border-red-800',
      pink: 'from-pink-400 to-rose-500 border-pink-200 dark:border-pink-800'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {isSubmitted ? 'Thank You!' : 'Feedback & Suggestions'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {isSubmitted 
              ? 'Your feedback has been submitted successfully. We appreciate your input!' 
              : "We'd love to hear your thoughts, suggestions, or concerns. Please let us know what you think."}
          </p>
        </motion.div>
        
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              key="thank-you"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Feedback Submitted!</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Thank you for taking the time to share your thoughts with us. Your feedback helps us improve Seriva.
              </p>
              <button
                onClick={handleStartNewFeedback}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Submit Another Feedback
              </button>
            </motion.div>
          ) : (
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-100 dark:border-gray-700"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <User className="w-4 h-4 inline mr-2" />
                      Your Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Feedback Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    What type of feedback would you like to share?
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    {feedbackTypes.map((type) => (
                      <motion.div
                        key={type.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                          formData.feedbackType === type.id
                            ? `bg-gradient-to-r ${getColorClasses(type.color)} text-white`
                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, feedbackType: type.id }))}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            formData.feedbackType === type.id 
                              ? 'bg-white/20' 
                              : `bg-gradient-to-r ${getColorClasses(type.color)}`
                          }`}>
                            <type.icon className={`w-5 h-5 ${
                              formData.feedbackType === type.id ? 'text-white' : 'text-white'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold mb-1 ${
                              formData.feedbackType === type.id 
                                ? 'text-white' 
                                : 'text-gray-800 dark:text-white'
                            }`}>
                              {type.label}
                            </h3>
                            <p className={`text-sm ${
                              formData.feedbackType === type.id 
                                ? 'text-white/80' 
                                : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              {type.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    How would you rate your overall experience with Seriva?
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1"
                        onClick={() => handleRatingClick(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors duration-200 ${
                            star <= (hoveredRating || formData.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </motion.button>
                    ))}
                    <span className="ml-4 text-sm text-gray-600 dark:text-gray-300">
                      {formData.rating > 0 && (
                        <>
                          {formData.rating} out of 5 stars
                          {formData.rating === 5 && ' - Excellent!'}
                          {formData.rating === 4 && ' - Very Good!'}
                          {formData.rating === 3 && ' - Good'}
                          {formData.rating === 2 && ' - Fair'}
                          {formData.rating === 1 && ' - Needs Improvement'}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder="Brief summary of your feedback"
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Your Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 resize-none"
                    placeholder="Please share your detailed feedback, suggestions, or any issues you've encountered. The more specific you are, the better we can help!"
                    required
                  />
                </div>

                {/* Contact Preference */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    How would you prefer us to contact you?
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="contactPreference"
                        value="email"
                        checked={formData.contactPreference === 'email'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <Mail className="w-4 h-4 ml-2 mr-1 text-gray-600 dark:text-gray-300" />
                      <span className="text-gray-700 dark:text-gray-300">Email</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="contactPreference"
                        value="none"
                        checked={formData.contactPreference === 'none'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">No response needed</span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Additional Information */}
        <motion.div 
          className="mt-12 grid md:grid-cols-2 gap-8"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                We Value Your Input
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Every piece of feedback helps us improve Seriva and create a better experience for our community. 
              Your suggestions directly influence our development roadmap.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Quick Response
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              We typically respond to feedback within 24-48 hours. For urgent issues, 
              please contact us directly at priyankpahwa41@gmail.com.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeedbackPage;
