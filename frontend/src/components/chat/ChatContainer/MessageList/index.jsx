import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

const MessageList = ({ messages = [], isTyping = false, className = '' }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Ensure messages is always an array
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${className}`}>
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {safeMessages.map((message) => {
          // Ensure we have valid message data
          if (!message || typeof message !== 'object') return null;
          
          const { id, content, role, timestamp, status } = message;
          
          return (
            <Message 
              key={id || Math.random().toString(36).substr(2, 9)}
              content={content || ''}
              isUser={role === 'user'}
              timestamp={timestamp || new Date()}
              status={status || 'sent'}
            />
          );
        })}
        
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      content: PropTypes.string,
      role: PropTypes.oneOf(['user', 'assistant']),
      timestamp: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.instanceOf(Date)
      ]),
      status: PropTypes.oneOf(['sending', 'sent', 'delivered', 'read', 'failed']),
    })
  ),
  isTyping: PropTypes.bool,
  className: PropTypes.string,
};

MessageList.defaultProps = {
  messages: [],
  isTyping: false,
};

export default MessageList;
