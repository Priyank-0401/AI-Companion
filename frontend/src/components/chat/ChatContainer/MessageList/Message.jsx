import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { FiUser, FiMessageSquare } from 'react-icons/fi';

const Message = ({ content, isUser, timestamp, className = '' }) => {
  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}
    >
      <div 
        className={`flex max-w-3xl space-x-3 ${
          isUser ? 'flex-row-reverse' : ''
        }`}
      >
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {isUser ? (
            <FiUser className="w-4 h-4" />
          ) : (
            <FiMessageSquare className="w-4 h-4" />
          )}
        </div>
        
        <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
          <div 
            className={`inline-block px-4 py-2 rounded-2xl ${
              isUser 
                ? 'bg-blue-500 text-white rounded-br-none' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
            }`}
          >
            <div className="prose dark:prose-invert max-w-none">
              {content}
            </div>
          </div>
          <div className={`text-xs mt-1 text-gray-500 dark:text-gray-400 ${
            isUser ? 'text-right' : 'text-left'
          }`}>
            {format(new Date(timestamp), 'h:mm a')}
          </div>
        </div>
      </div>
    </div>
  );
};

Message.propTypes = {
  content: PropTypes.string.isRequired,
  isUser: PropTypes.bool,
  timestamp: PropTypes.instanceOf(Date).isRequired,
  className: PropTypes.string,
};

Message.defaultProps = {
  isUser: false,
};

export default Message;
