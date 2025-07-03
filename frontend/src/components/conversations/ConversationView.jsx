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
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Zoom
} from '@mui/material';
import { 
  Send as SendIcon, 
  ArrowBack as BackIcon,
  MoreVert as MoreIcon, 
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  SmartToy as BotIcon
} from '@mui/icons-material';
import { useChat } from '../../contexts/ChatContext';
import { format, formatDistanceToNow } from 'date-fns';

const MessageBubble = ({ message, isUser, isLast, onDelete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isHovered, setIsHovered] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    handleMenuClose();
  };
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
    handleMenuClose();
  };
  
  // Format timestamp if available
  const formattedTime = message.timestamp 
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    : null;

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        mb: isLast ? 2 : 1,
        position: 'relative',
        px: 2,
        '&:hover': {
          '& .message-actions': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      {/* Message content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: 1.5,
          maxWidth: { xs: '100%', sm: '85%', md: '75%' },
        }}
      >
        {/* Avatar */}
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: isUser ? theme.palette.primary.main : theme.palette.grey[300],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.5,
          }}
        >
          {isUser ? (
            <PersonIcon sx={{ color: 'white', fontSize: 18 }} />
          ) : (
            <BotIcon sx={{ color: 'text.primary', fontSize: 18 }} />
          )}
        </Box>

        {/* Message bubble */}
        <Box
          sx={{
            position: 'relative',
            p: 2,
            borderRadius: 3,
            bgcolor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            boxShadow: theme.shadows[1],
            border: `1px solid ${
              isUser ? 'transparent' : theme.palette.divider
            }`,
            maxWidth: '100%',
            '&:hover': {
              boxShadow: theme.shadows[2],
            },
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              lineHeight: 1.6,
              fontSize: '0.95rem',
              '& a': {
                color: isUser ? '#90caf9' : theme.palette.primary.main,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
              '& pre': {
                backgroundColor: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.03)',
                borderRadius: 1,
                p: 1.5,
                overflowX: 'auto',
                fontSize: '0.9em',
                margin: '0.8em 0',
                '& code': {
                  fontFamily: 'monospace',
                  fontSize: '0.9em',
                },
              },
              '& code': {
                fontFamily: 'monospace',
                fontSize: '0.9em',
                backgroundColor: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                padding: '0.2em 0.4em',
                borderRadius: '0.3em',
              },
            }}
            dangerouslySetInnerHTML={{ 
              __html: message.content
                .replace(/\n/g, '<br />')
                .replace(/```([\s\S]*?)```/gs, (_, code) => {
                  // Handle multi-line code blocks with syntax highlighting
                  return `<pre><code>${code}</code></pre>`;
                })
                .replace(/`([^`]+)`/g, '<code>$1</code>')
            }}
          />
          
          {/* Timestamp */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              mt: 0.5,
              gap: 0.5,
              opacity: isHovered ? 1 : 0.7,
              transition: 'opacity 0.2s ease',
            }}
          >
            {formattedTime && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  color: isUser ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formattedTime}
              </Typography>
            )}
            
            {/* Message actions */}
            <Box 
              className="message-actions"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                opacity: 0,
                transform: 'translateY(2px)',
                transition: 'all 0.2s ease',
                ml: 1,
              }}
            >
              <Tooltip title="Copy">
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  sx={{
                    p: 0.5,
                    color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                    '&:hover': {
                      color: isUser ? '#fff' : 'text.primary',
                      bgcolor: isUser ? 'rgba(255, 255, 255, 0.15)' : 'action.hover',
                    },
                  }}
                >
                  <CopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              
              {isUser && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={handleMenuClick}
                    sx={{
                      p: 0.5,
                      color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                      '&:hover': {
                        color: 'error.main',
                        bgcolor: isUser ? 'rgba(255, 255, 255, 0.15)' : 'action.hover',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      
      {/* Message menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
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
  );
};

const ConversationView = ({ onBack }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { 
    currentSession: conversation, 
    sendMessage, 
    isSending, 
    deleteMessage 
  } = useChat();
  
  const [message, setMessage] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    
    const content = message.trim();
    setMessage('');
    
    try {
      await sendMessage({
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Show error to user
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100; // 100px threshold
    setIsScrolled(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setIsScrolled(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(conversation.id, messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  if (!conversation) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      bgcolor: 'background.default',
      position: 'relative',
    }}>
      {/* Header */}
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'background.paper',
          zIndex: 1,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
        }}
      >
        {isMobile && (
          <Tooltip title="Back to conversations">
            <IconButton 
              onClick={onBack} 
              size="small"
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <BackIcon />
            </IconButton>
          </Tooltip>
        )}
        <Typography 
          variant="h6" 
          noWrap
          sx={{
            fontWeight: 600,
            fontSize: '1.1rem',
            color: 'text.primary',
          }}
        >
          {conversation.title || 'New Chat'}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Refresh conversation">
          <IconButton 
            size="small" 
            onClick={() => window.location.reload()}
            sx={{
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Messages */}
      <Box 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: { xs: 1, sm: 2 },
          bgcolor: 'background.default',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            borderRadius: '3px',
            '&:hover': {
              background: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
            },
          },
          scrollBehavior: 'smooth',
        }}
      >
        {conversation.messages?.length > 0 ? (
          <Box sx={{ maxWidth: '900px', mx: 'auto', width: '100%' }}>
            {conversation.messages.map((msg, index) => (
              <MessageBubble 
                key={msg.id || index}
                message={msg}
                isUser={msg.role === 'user'}
                isLast={index === conversation.messages.length - 1}
                onDelete={handleDeleteMessage}
              />
            ))}
            <div ref={messagesEndRef} style={{ height: '1px' }} />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              px: 2,
              color: 'text.secondary',
            }}
          >
            <BotIcon sx={{ fontSize: 64, mb: 2, opacity: 0.2 }} />
            <Typography variant="h6" gutterBottom>
              How can I help you today?
            </Typography>
            <Typography variant="body2" sx={{ maxWidth: '500px' }}>
              Ask me anything, from creative ideas to technical explanations. 
              I'm here to assist you with your questions and tasks.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Scroll to bottom button */}
      <Zoom in={isScrolled}>
        <Box
          onClick={scrollToBottom}
          sx={{
            position: 'absolute',
            bottom: '100px',
            right: '24px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            bgcolor: 'background.paper',
            boxShadow: theme.shadows[4],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <ArrowDropDownIcon />
        </Box>
      </Zoom>

      {/* Input area */}
      <Box 
        component="form" 
        onSubmit={handleSendMessage}
        sx={{ 
          p: 2, 
          pt: 1.5,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          position: 'sticky',
          bottom: 0,
          boxShadow: '0 -1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1.5, 
            alignItems: 'flex-end',
            maxWidth: '900px',
            mx: 'auto',
            width: '100%',
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={8}
            variant="outlined"
            placeholder="Message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            InputProps={{
              sx: {
                borderRadius: 2,
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '&.Mui-focused': {
                  bgcolor: 'background.paper',
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  borderWidth: '1px',
                },
              },
            }}
            sx={{
              '& .MuiInputBase-input': {
                py: 1.5,
                px: 2,
                fontSize: '0.95rem',
                lineHeight: 1.5,
              },
            }}
          />
          <Tooltip 
            title={message.trim() ? 'Send message' : 'Type a message to send'}
            placement="top"
          >
            <span>
              <IconButton 
                type="submit" 
                color="primary"
                disabled={!message.trim() || isSending}
                sx={{
                  height: '48px',
                  width: '48px',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[2],
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: 'none',
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                    transform: 'none',
                    boxShadow: 'none',
                  },
                }}
              >
                {isSending ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  <SendIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 1,
            fontSize: '0.7rem',
          }}
        >
          AI Companion may produce inaccurate information about people, places, or facts.
        </Typography>
      </Box>
    </Box>
  );
};

export default React.memo(ConversationView);
