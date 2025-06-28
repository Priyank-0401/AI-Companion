import { motion } from 'framer-motion';

const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start max-w-4xl mx-auto"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 flex items-center justify-center">
          <img 
            src="/logo.png" 
            alt="Seriva" 
            className="w-12 h-12 object-contain"
          />
        </div>
        <div className="px-4 py-3 bg-[#393E46] rounded-2xl shadow-lg">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-2 h-2 bg-[#00ADB5] rounded-full"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
              className="w-2 h-2 bg-[#00ADB5] rounded-full"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4
              }}
              className="w-2 h-2 bg-[#00ADB5] rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;
