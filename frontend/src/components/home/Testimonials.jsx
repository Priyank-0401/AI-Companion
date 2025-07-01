import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "This AI companion has been a game-changer for my mental health. It's like having a supportive friend who's always there when I need to talk.",
    name: "Sarah J.",
    role: "Graphic Designer",
    rating: 5,
    avatar: "/avatars/avatar1.svg"
  },
  {
    quote: "As someone who struggles with anxiety, having this app has made a huge difference in my daily life. The breathing exercises are especially helpful.",
    name: "Michael T.",
    role: "Software Engineer",
    rating: 5,
    avatar: "/avatars/avatar2.svg"
  },
  {
    quote: "I was skeptical about AI for emotional support, but this app proved me wrong. The conversations feel surprisingly natural and helpful.",
    name: "Priya K.",
    role: "Student",
    rating: 4,
    avatar: "/avatars/avatar3.svg"
  },
  {
    quote: "The mood tracking feature has helped me understand my emotional patterns better. It's like having a personal therapist in my pocket.",
    name: "David L.",
    role: "Teacher",
    rating: 5,
    avatar: "/avatars/avatar4.svg"
  },
  {
    quote: "I use this app every morning to set my intentions for the day. It's become an essential part of my self-care routine.",
    name: "Emma R.",
    role: "Marketing Manager",
    rating: 5,
    avatar: "/avatars/avatar5.svg"
  }
];

const Testimonials = () => {
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <section className="py-20 bg-white dark:bg-transparent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Loved by Thousands
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Hear what our community has to say about their experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700/50"
            >
              <Quote className="absolute top-6 right-6 w-6 h-6 text-gray-200 dark:text-gray-700" />
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-semibold">
                  {testimonial.avatar ? (
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=indigo&color=fff`;
                      }}
                    />
                  ) : (
                    testimonial.name.charAt(0)
                  )}
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex mb-4">
                {renderStars(testimonial.rating)}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 italic">"{testimonial.quote}"</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-indigo-50 text-indigo-700 font-medium">
            <Star className="w-5 h-5 mr-2 text-amber-400 fill-current" />
            <span>4.9/5 from 1,200+ reviews</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
