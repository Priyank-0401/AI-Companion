import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  IconButton, 
  Tooltip, 
  CircularProgress,
  Paper,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Send as SendIcon, 
  MoreVert as MoreIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Tag as TagIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useConversationContext } from '../../contexts/ConversationContext.jsx';
import { format } from 'date-fns';

const MessageBubble = ({ message, isUser, isLast }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    handleMenuClose();
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: isLast ? 0 : 2,
        px: isMobile ? 1 : 2,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box
        sx={{
          maxWidth: isMobile ? '90%' : '80%',
          minWidth: '120px',
          position: 'relative',
        }}
      >
        <Paper
          elevation={isHovered ? 2 : 0}
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: isUser 
              ? theme.palette.primary.light 
              : theme.palette.grey[100],
            color: isUser 
              ? theme.palette.primary.contrastText 
              : theme.palette.text.primary,
            borderTopLeftRadius: isUser ? 12 : 4,
            borderTopRightRadius: isUser ? 4 : 12,
            position: 'relative',
          }}
        >
          {!isUser && (
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                mb: 0.5,
                fontWeight: 'bold',
                color: isUser 
                  ? theme.palette.primary.contrastText 
                  : theme.palette.primary.main,
              }}
            >
              {message.role === 'assistant' ? 'AI Assistant' : 'User'}
            </Typography>
          )}
          
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              '& a': {
                color: isUser 
                  ? theme.palette.primary.contrastText 
                  : theme.palette.primary.main,
                textDecoration: 'underline',
              }
            }}
            dangerouslySetInnerHTML={{ 
              __html: message.content.replace(/\n/g, '<br />')
            }}
          />
          
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              mt: 0.5,
              opacity: isHovered ? 1 : 0.5,
              transition: 'opacity 0.2s',
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              {message.timestamp ? format(new Date(message.timestamp), 'h:mm a') : 'Just now'}
            </Typography>
          </Box>
          
          {isHovered && (
            <Box 
              sx={{ 
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.1)',
                borderRadius: '50%',
              }}
            >
              <IconButton 
                size="small" 
                onClick={handleMenuOpen}
                sx={{ p: 0.5 }}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Paper>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={handleCopy}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

const ConversationView = ({ conversation, onBack, onUpdate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { 
    messages, 
    isLoading, 
    addMessage, 
    updateConversation, 
    deleteConversation 
  } = useConversationContext();
  
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus input when conversation changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversation?.id]);
  
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSubmitting) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSubmitting(true);
    
    try {
      // Add user message
      await addMessage({
        role: 'user',
        content: messageContent,
      });
      
      // Add AI response (this would be handled by the server in a real app)
      // For now, we'll just add a placeholder
      await addMessage({
        role: 'assistant',
        content: 'I\'m an AI assistant. In a real implementation, I would generate a response based on your message.',
      });
      
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [newMessage, isSubmitting, addMessage]);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };
  
  const handleMenuOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleArchive = async () => {
    try {
      await updateConversation(conversation.id, { isArchived: !conversation.isArchived });
      handleMenuClose();
    } catch (error) {
      console.error('Failed to update conversation:', error);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      try {
        await deleteConversation(conversation.id);
        onBack();
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
    handleMenuClose();
  };
  
  if (!conversation) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          p: 3
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No conversation selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a conversation from the list or create a new one to get started.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" alignItems="center">
          {isMobile && (
            <IconButton 
              onClick={onBack}
              edge="start"
              sx={{ mr: 1 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </IconButton>
          )}
          
          <Box>
            <Typography variant="h6" noWrap>
              {conversation.title || 'Untitled Conversation'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {conversation.updatedAt 
                ? `Updated ${format(new Date(conversation.updatedAt), 'MMM d, yyyy h:mm a')}`
                : 'Just now'}
            </Typography>
          </Box>
        </Box>
        
        <Box>
          <IconButton onClick={handleMenuOpen}>
            <MoreIcon />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleArchive}>
              <ListItemIcon>
                {conversation.isArchived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText>
                {conversation.isArchived ? 'Unarchive' : 'Archive'}
              </ListItemText>
            </MenuItem>
            
            <MenuItem onClick={handleDelete}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ color: 'error' }}>
                Delete
              </ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      {/* Messages */}
      <Box 
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: isMobile ? 1 : 2,
          bgcolor: 'background.default',
        }}
      >
        {isLoading && messages.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            height="100%"
            textAlign="center"
            p={3}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Start a new conversation
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Type a message below to begin chatting with the AI assistant.
            </Typography>
          </Box>
        ) : (
          <Box>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id || index}
                message={message}
                isUser={message.role === 'user'}
                isLast={index === messages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>
      
      {/* Input area */}
      <Box 
        component="form" 
        onSubmit={handleSendMessage}
        sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box display="flex" alignItems="flex-end">
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={4}
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                bgcolor: 'background.paper',
              },
              '& textarea': {
                resize: 'vertical',
                minHeight: '40px',
                maxHeight: '200px',
                overflowY: 'auto !important',
              },
            }}
          />
          
          <Tooltip title="Send">
            <span> {/* Wrapper for tooltip on disabled button */}
              <IconButton 
                type="submit" 
                color="primary" 
                disabled={!newMessage.trim() || isSubmitting}
                sx={{ ml: 1, height: '48px', width: '48px' }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} />
                ) : (
                  <SendIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        <Box mt={1} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            {isMobile ? 'Tap to send' : 'Press Enter to send, Shift+Enter for new line'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(ConversationView);
