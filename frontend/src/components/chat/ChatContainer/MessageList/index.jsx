import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

const MessageList = ({ messages, isTyping, className = '' }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${className}`}>
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {messages.map((message) => (
          <Message 
            key={message.id}
            content={message.content}
            isUser={message.role === 'user'}
            timestamp={message.timestamp}
          />
        ))}
        
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      role: PropTypes.oneOf(['user', 'assistant']).isRequired,
      timestamp: PropTypes.instanceOf(Date).isRequired,
    })
  ).isRequired,
  isTyping: PropTypes.bool,
  className: PropTypes.string,
};

MessageList.defaultProps = {
  messages: [],
  isTyping: false,
};

export default MessageList;
