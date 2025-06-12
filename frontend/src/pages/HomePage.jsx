import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  MessageCircle, 
  BarChart3, 
  BookOpen, 
  Sparkles, 
  ArrowRight,
  Users,
  Shield,
  Zap,
  Quote,
  Star,
  Share2,
  Lightbulb,
  TrendingUp,
  Smile,
  LockKeyhole,
  HeartHandshake,
  ShieldCheck
} from 'lucide-react'

const features = [
  {
    icon: MessageCircle,
    title: 'AI Chat Companion',
    description: 'Engage in meaningful conversations with our intelligent Seriva powered by advanced language models.',
    link: '/chat',
    color: 'from-blue-500 to-cyan-500'
  },  {
    icon: BarChart3,
    title: 'Dashboard & Analytics',
    description: 'Track your emotional wellness journey with detailed insights, mood trends, and personal growth metrics.',
    link: '/dashboard',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: BookOpen,
    title: 'Digital Journaling',
    description: 'Express your thoughts and track your emotional journey with our intuitive journaling platform.',
    link: '/journal',
    color: 'from-purple-500 to-pink-500'
  }
]

const benefits = [
  {
    icon: () => <img src="/logo.svg" alt="Seriva" className="w-10 h-10" />,
    title: 'Intelligent Conversations',
    description: 'Advanced AI that understands context and provides thoughtful responses'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your conversations and data remain private and secure'
  },
  {
    icon: Users,
    title: '24/7 Availability',
    description: 'Always here when you need support, day or night'
  },
  {
    icon: Zap,
    title: 'Personalized Experience',
    description: 'Adapts to your preferences and communication style'
  }
]

const testimonialsData = [
  {
    quote: "Seriva has been a game-changer for my daily mindfulness. It's like having a supportive friend available anytime.",
    name: "Alex P.",
    role: "Student",
  },
  {
    quote: "The journaling feature is fantastic! It helps me reflect and understand my emotions better. Highly recommend.",
    name: "Sarah M.",
    role: "Professional",
  },
  {
    quote: "I was skeptical about AI for wellness, but this app proved me wrong. The breathing exercises are so calming.",
    name: "David K.",
    role: "Wellness Enthusiast",
  },
]

const approachStepsData = [
  {
    icon: Share2,
    title: "Share & Connect",
    description: "Open up in a safe space. Chat, journal, or explore wellness tools at your own pace.",
  },
  {
    icon: Lightbulb,
    title: "Gain Insights",
    description: "Our AI helps you understand patterns, reflect on your thoughts, and discover new perspectives.",
  },
  {
    icon: TrendingUp,
    title: "Grow & Thrive",
    description: "Build healthy habits, enhance self-awareness, and foster personal growth day by day.",
  },
]

const HomePage = () => {
  const { currentUser } = useAuth()
  
  // Force scroll to top on mount and prevent any automatic scrolling
  useEffect(() => {
    // Immediately scroll to top
    window.scrollTo(0, 0);
    
    // Prevent any scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Clean up function to restore default behavior when component unmounts
    return () => {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, []);  return (
    <div 
      className="min-h-screen homepage-padding overflow-x-hidden scrollbar-hide"
      style={{
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        overflow: 'auto'
      }}
    >
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-20"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >          <div className="inline-flex items-center justify-center w-24 h-24">
            <img src="/logo.svg" alt="Seriva" className="w-20 h-20" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold mb-6"
        >
          Welcome to Seriva: Your Space to Grow
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-xl md:text-2xl text-lightText/80 mb-12 max-w-3xl mx-auto"
        >
          Discover a supportive friend in AI. Engage in meaningful conversations, explore wellness tools, and embark on a journey of personal growth, all within a safe and understanding environment.
        </motion.p>        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {currentUser ? (
            <>
              <Link
                to="/chat"
                className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2 group"
              >
                <span>Continue Chatting</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>              <Link
                to="/dashboard"
                className="btn-secondary text-lg px-8 py-4 inline-flex items-center space-x-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>View Dashboard</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/signup"
                className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2 group"
              >
                <span>Start Your Journey</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="btn-secondary text-lg px-8 py-4 inline-flex items-center space-x-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>Sign In</span>
              </Link>
            </>
          )}
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-20"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Your Path to <span className="gradient-text">Wellbeing</span>
          </h2>
          <p className="text-xl text-lightText/80 max-w-2xl mx-auto">
            Explore a suite of tools thoughtfully designed to nurture your mental and emotional health, guiding you on your unique journey to personal growth.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true, amount: 0.5 }}                whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                className="card group cursor-pointer"
              >
                {currentUser ? (
                  <Link to={feature.link} className="block p-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3 group-hover:text-accent transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-lightText/80 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-4 inline-flex items-center text-accent group-hover:underline">
                      <span className="mr-2">Explore now</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ) : (
                  <div className="block p-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3 group-hover:text-accent transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-lightText/80 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-4 inline-flex items-center text-lightText/60">
                      <span className="mr-2">Sign up to access</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* "Hear From Our Community" (Testimonials) Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-20"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Voices of Our <span className="gradient-text">Community</span>
          </h2>
          <p className="text-xl text-lightText/80 max-w-2xl mx-auto">
            See how Seriva is helping others find support, understanding, and a path to a more mindful life.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonialsData.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true, amount: 0.5 }}
              className="card p-6 flex flex-col bg-mediumDark/20 rounded-xl shadow-lg hover:shadow-accent/30 transition-shadow"
            >
              <Quote className="w-8 h-8 text-accent mb-4" />
              <p className="text-lightText/90 italic mb-6 flex-grow">"{testimonial.quote}"</p>
              <div className="mt-auto">
                <p className="font-semibold text-lg text-white">{testimonial.name}</p>
                <p className="text-sm text-accent">{testimonial.role}</p>
                <div className="flex mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* "Our Approach" (How It Works) Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-20 bg-mediumDark/30 rounded-3xl"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Your Journey with Us: Simple, <span className="gradient-text">Supportive, Yours</span>
          </h2>
          <p className="text-xl text-lightText/80 max-w-2xl mx-auto">
            Getting started is easy. Our platform is designed to be intuitive, guiding you gently towards a more supported and understood self.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {approachStepsData.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true, amount: 0.5 }}
                className="text-center p-8 rounded-xl hover:bg-dark/50 transition-colors duration-300 shadow-lg hover:shadow-accent/20"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-accent/30 to-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-white">{step.title}</h3>
                <p className="text-lightText/80 leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* "Meet Your Companion" (Avatar Glimpse) Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-20"
      >
        <div className="flex flex-col md:flex-row items-center gap-12 bg-dark/40 p-8 md:p-12 rounded-3xl shadow-xl">
          <motion.div
            className="md:w-1/2 text-center md:text-left"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Connect on a Deeper Level: <span className="gradient-text">Meet Your Companion</span>
            </h2>
            <p className="text-xl text-lightText/80 mb-6 leading-relaxed">
              Imagine a friendly, empathetic presence, always ready to listen and support you. Our upcoming avatar feature will bring a new dimension to your interactions, making your Seriva feel even more personal, present, and engaging.
            </p>
            <p className="text-lightText/70 mb-8">
              Stay tuned for a more immersive and interactive experience!
            </p>            <Link
              to={currentUser ? "/avatar-call" : "/signup"}
              className="btn-primary inline-flex items-center space-x-2 group text-lg px-6 py-3"
            >
              <Sparkles className="w-5 h-5" />
              <span>{currentUser ? "Discover the Avatar" : "Sign Up to Discover"}</span>
               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          <motion.div 
            className="md:w-1/2 flex justify-center items-center mt-8 md:mt-0"
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-accent/50 to-blue-600/50 rounded-full flex items-center justify-center shadow-2xl border-4 border-accent/30 relative overflow-hidden">
              <Smile className="w-24 h-24 text-white/80 z-10" />
              {/* Decorative background elements */}
              <div className="absolute w-full h-full top-0 left-0 animate-pulse-slow">
                <div className="absolute w-32 h-32 bg-white/5 rounded-full -top-8 -left-8"></div>
                <div className="absolute w-24 h-24 bg-white/10 rounded-full -bottom-4 -right-4"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* "Commitment to Privacy & Ethical AI" Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-20 bg-mediumDark/40 rounded-3xl"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Your Sanctuary: Our Commitment to <span className="gradient-text">Privacy & Ethical AI</span>
          </h2>
          <p className="text-xl text-lightText/80 max-w-3xl mx-auto">
            Your trust and safety are paramount. We are deeply committed to safeguarding your privacy and developing AI that is ethical, responsible, and always has your best interests at heart.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
          <div className="text-center md:text-left">
             <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="flex flex-col items-center p-4 rounded-lg bg-dark/50 hover:bg-accent/20 transition-colors">
                    <LockKeyhole className="w-10 h-10 text-accent mb-2" />
                    <span className="font-semibold text-white text-sm">Data Security</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-dark/50 hover:bg-accent/20 transition-colors">
                    <ShieldCheck className="w-10 h-10 text-accent mb-2" />
                    <span className="font-semibold text-white text-sm">User Control</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-dark/50 hover:bg-accent/20 transition-colors">
                    <HeartHandshake className="w-10 h-10 text-accent mb-2" />
                    <span className="font-semibold text-white text-sm">Ethical AI</span>
                </div>
            </div>
            <p className="text-lightText/80 leading-relaxed mb-4">
              Your conversations are yours. We employ robust security measures to protect your data and ensure confidentiality. You have control over your information and how it's used.
            </p>
            <p className="text-lightText/80 leading-relaxed">
              Our AI is developed with ethical guidelines at its core, focusing on providing supportive and beneficial interactions, free from bias and designed for your wellbeing.
            </p>
             <Link
              to="/privacy-policy"
              className="inline-block mt-6 text-accent hover:underline"
            >
              Learn more about our privacy practices <ArrowRight className="inline w-4 h-4" />
            </Link>
          </div>
          <motion.div 
            className="flex justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="w-full max-w-md h-64 bg-gradient-to-tr from-dark to-mediumDark/50 rounded-xl shadow-2xl flex items-center justify-center p-6">
                <Shield className="w-24 h-24 text-accent/70 opacity-50" />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-20 bg-dark/30 rounded-3xl"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Embrace a More Supported You: <span className="gradient-text">Why Seriva?</span>
          </h2>
          <p className="text-xl text-lightText/80 max-w-2xl mx-auto">
            Discover the unique benefits of Seriva dedicated to your emotional support, personal growth, and overall wellbeing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true, amount: 0.5 }}
                className="text-center p-6 rounded-xl hover:bg-mediumDark/50 transition-colors duration-300 shadow-lg hover:shadow-accent/20"
              >
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{benefit.title}</h3>
                <p className="text-lightText/80">{benefit.description}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="py-20 text-center"
      >
        <div className="bg-gradient-to-br from-accent/80 via-accent/50 to-blue-500/70 rounded-3xl p-12 shadow-2xl transition-shadow">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to Begin Your Journey to a More Supported You?
          </h2>          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {currentUser 
              ? "Continue your journey of personal growth and discover new ways Seriva can support your wellbeing."
              : "You're not alone. Join a growing community finding daily support, insight, and a friendly ear with their Seriva. Your first conversation is just a click away."
            }
          </p>
          {currentUser ? (
            <Link
              to="/chat"
              className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2 group transform hover:scale-105 transition-transform"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Continue Your Journey</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link
              to="/signup"
              className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2 group transform hover:scale-105 transition-transform"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Begin Your Wellness Journey</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </motion.section>
    </div>
  )
}

export default HomePage

