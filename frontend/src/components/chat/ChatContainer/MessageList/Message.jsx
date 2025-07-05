import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { FiUser, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Message = ({ 
  content, 
  isUser, 
  timestamp, 
  status = 'sent', // 'sending' | 'sent' | 'delivered' | 'read'
  className = '' 
}) => {
  const messageRef = useRef(null);
  
  // Auto-scroll to message if it's new
  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  return (
    <motion.div 
      ref={messageRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-2 sm:px-4 py-1 ${className}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-2">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-600 dark:text-gray-300 font-medium text-xl">S</span>
          </div>
        </div>
      )}
      
      <div className={`flex flex-col max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Sender Name */}
        <div className={`text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ${isUser ? 'mr-2' : 'ml-2'}`}>
          {isUser ? 'You' : 'Seriva'}
        </div>
        
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
          {/* Message Content */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 ${
              isUser 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-br-sm' 
                : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
            }`}
          >
            <div className="prose dark:prose-invert max-w-none text-sm sm:text-base">
              {content}
            </div>
            
            {/* Message Metadata */}
            <div className={`flex items-center mt-1 space-x-2 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}>
              <span className={isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}>
                {format(new Date(timestamp), 'h:mm a')}
              </span>
              
              {isUser && (
                <span className="flex items-center" style={{ color: isUser ? 'rgba(255,255,255,0.7)' : 'inherit' }}>
                  {status === 'sending' && (
                    <motion.span 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <FiCheck className="w-3 h-3" />
                    </motion.span>
                  )}
                  {status === 'sent' && <FiCheck className="w-3 h-3" />}
                  {status === 'delivered' && (
                    <span className="flex">
                      <FiCheck className="w-3 h-3 -mr-1" />
                      <FiCheck className="w-3 h-3" />
                    </span>
                  )}
                  {status === 'read' && (
                    <span className="flex text-blue-200">
                      <FiCheckCircle className="w-3 h-3 -mr-1" />
                      <FiCheckCircle className="w-3 h-3" />
                    </span>
                  )}
                </span>
              )}
            </div>
          </motion.div>
          
          {/* User Avatar (only for sent messages) */}
          {isUser && (
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white">
                <FiUser className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

Message.propTypes = {
  content: PropTypes.string.isRequired,
  isUser: PropTypes.bool.isRequired,
  timestamp: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date)
  ]).isRequired,
  status: PropTypes.oneOf(['sending', 'sent', 'delivered', 'read']),
  className: PropTypes.string
};

Message.defaultProps = {
  status: 'sent',
  className: ''
};

Message.defaultProps = {
  isUser: false,
};

export default Message;
