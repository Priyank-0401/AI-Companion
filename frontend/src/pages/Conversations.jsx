import React, { useState, useEffect } from 'react';
import { Box, useTheme, useMediaQuery, CircularProgress } from '@mui/material';
import { useConversationContext } from '../contexts/ConversationContext.jsx';
import ConversationList from '../components/conversations/ConversationList';
import ConversationView from '../components/conversations/ConversationView';
import { useNavigate, useParams } from 'react-router-dom';

const Conversations = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { conversationId } = useParams();
  
  const { 
    conversations, 
    currentConversation, 
    loadConversation,
    isLoading 
  } = useConversationContext();
  
  const [selectedConversationId, setSelectedConversationId] = useState(conversationId);
  const [showListView, setShowListView] = useState(isMobile ? !conversationId : true);
  
  // Update selected conversation when URL changes
  useEffect(() => {
    if (conversationId) {
      setSelectedConversationId(conversationId);
      if (isMobile) setShowListView(false);
      loadConversation(conversationId);
    } else if (conversations.length > 0 && !isMobile) {
      // On desktop, show the first conversation by default
      const firstConversation = conversations[0];
      if (firstConversation && !selectedConversationId) {
        setSelectedConversationId(firstConversation.id);
        navigate(`/conversations/${firstConversation.id}`, { replace: true });
      }
    }
  }, [conversationId, conversations, isMobile]);
  
  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    if (conversation?.id) {
      setSelectedConversationId(conversation.id);
      loadConversation(conversation.id);
      
      if (isMobile) {
        navigate(`/conversations/${conversation.id}`);
      } else {
        navigate(`/conversations/${conversation.id}`, { replace: true });
      }
    }
  };
  
  // Handle back button on mobile
  const handleBackToList = () => {
    setShowListView(true);
    navigate('/conversations');
  };
  
  // Loading state
  if (isLoading && conversations.length === 0) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100%',
        bgcolor: 'background.default',
      }}
    >
      {/* Conversation List - Always visible on desktop, toggled on mobile */}
      {(!isMobile || showListView) && (
        <Box 
          sx={{ 
            width: isMobile ? '100%' : '350px',
            borderRight: isMobile ? 0 : 1,
            borderColor: 'divider',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <ConversationList 
            onConversationSelect={handleSelectConversation}
            selectedConversationId={selectedConversationId}
          />
        </Box>
      )}
      
      {/* Conversation View - Hidden on mobile when list is shown */}
      {(!isMobile || !showListView) && (
        <Box 
          sx={{ 
            flex: 1, 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <ConversationView 
            conversation={currentConversation}
            onBack={handleBackToList}
          />
        </Box>
      )}
    </Box>
  );
};

export default Conversations;
