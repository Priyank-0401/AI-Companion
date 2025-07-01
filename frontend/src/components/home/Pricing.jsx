import { motion } from 'framer-motion';
import { Check, Zap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const pricingPlans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for trying out basic features',
    features: [
      'Basic AI conversations',
      'Mood tracking',
      'Daily journal entries',
      'Basic breathing exercises',
      'Limited message history'
    ],
    buttonText: 'Get Started',
    buttonVariant: 'outline',
    popular: false
  },
  {
    name: 'Premium',
    price: '$9.99',
    description: 'Everything you need for your wellness journey',
    features: [
      'Unlimited AI conversations',
      'Advanced mood analytics',
      'Unlimited journal entries',
      'Guided meditations',
      'Full message history',
      'Priority support',
      'Custom reminders',
      'Early access to new features'
    ],
    buttonText: 'Start Free Trial',
    buttonVariant: 'primary',
    popular: true
  }
];

const Pricing = () => {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Choose the plan that works best for your wellness journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 transition-colors duration-200 ${
                plan.popular 
                  ? 'border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-600' 
                  : 'border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap shadow-md shadow-indigo-500/20">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className={`text-xl font-semibold mb-1 ${
                  plan.popular 
                    ? 'text-gray-900 dark:text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline">
                  <span className={`text-4xl font-bold ${
                    plan.popular 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {plan.price}
                  </span>
                  {plan.price !== 'Free' && (
                    <span className={`ml-2 ${
                      plan.popular 
                        ? 'text-gray-600 dark:text-gray-300' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      /month
                    </span>
                  )}
                </div>
                <p className={`mt-2 ${
                  plan.popular 
                    ? 'text-gray-700 dark:text-gray-200' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {plan.description}
                </p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${
                      plan.popular 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                to={plan.popular ? '/signup?plan=premium' : '/signup'}
                className={`w-full inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-full transition-all duration-200 ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-indigo-500/20' 
                    : 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-100 border-indigo-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600/50'
                }`}
              >
                {plan.buttonText}
                {plan.popular && <Zap className="ml-2 w-4 h-4" />}
              </Link>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex items-center bg-indigo-50 dark:bg-indigo-900/30 rounded-full px-6 py-3 border border-indigo-100 dark:border-indigo-800/50">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
            <span className="text-indigo-700 dark:text-indigo-200 font-medium">14-day free trial. No credit card required.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
