import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const quotes = [
  {
    text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela"
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney"
  },
  {
    text: "Your time is limited, don't waste it living someone else's life.",
    author: "Steve Jobs"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "Who you are tomorrow begins with what you do today.",
    author: "Tim Fargo"
  }
];

const QuoteCard = () => {
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);
  
  useEffect(() => {
    // Change quote every 30 seconds
    const interval = setInterval(() => {
      const currentIndex = quotes.findIndex(q => q.text === currentQuote.text);
      const nextIndex = (currentIndex + 1) % quotes.length;
      setCurrentQuote(quotes[nextIndex]);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [currentQuote]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 p-6 h-full flex flex-col justify-center">
      <div className="absolute top-4 right-4 text-indigo-200 dark:text-indigo-700">
        <Sparkles className="w-6 h-6" />
      </div>
      <div className="relative z-10 text-center">
        <blockquote className="text-lg italic text-indigo-900 dark:text-indigo-100 mb-4">
          "{currentQuote.text}"
        </blockquote>
        <p className="text-sm font-medium text-indigo-800/70 dark:text-indigo-200/70">
          — {currentQuote.author}
        </p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-400/30 via-indigo-400/10 to-indigo-400/30"></div>
    </div>
  );
};

export default QuoteCard;
