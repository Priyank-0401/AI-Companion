import React, { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { alpha, Zoom, Tooltip, IconButton, CircularProgress } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Drawer,
  AppBar,
  Toolbar,
  CssBaseline,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Alert,
  useMediaQuery,
} from '@mui/material';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import MessageIcon from '@mui/icons-material/Message';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import BotIcon from '@mui/icons-material/SmartToyOutlined';

// Context
import { useAuth } from '../contexts/AuthContext';
import { useConversationContext } from '../contexts/ConversationContext';

// Components
import ConversationList from '../components/conversations/ConversationList';
import MessageBubble from '../components/chat/MessageBubble';

// Styled Components
const drawerWidth = 300;

const StyledDrawer = styled(Drawer)(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    borderRight: 'none',
    boxShadow: theme.shadows[3],
    position: 'relative',
    height: '100vh',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.down('md')]: {
      position: 'fixed',
      zIndex: theme.zIndex.drawer + 1,
      '&.MuiDrawer-paper': {
        width: '100%',
        maxWidth: 380,
      },
    },
  },
  ...(!open && {
    '& .MuiDrawer-paper': {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: 0,
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9) + 1,
      },
    },
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2),
  ...theme.mixins.toolbar,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const MainContent = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(0),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('md')]: {
      marginLeft: 0,
      width: `calc(100% - ${open ? drawerWidth : 73}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
  })
);

const MobileHeader = styled(AppBar)(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
  zIndex: theme.zIndex.drawer + 1,
}));

const Conversations = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { 
    conversations = [], 
    currentConversation = null, 
    messages = [], 
    isLoading = false, 
    error = null, 
    loadConversations,
    loadConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    addMessage,
  } = useConversationContext();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChat, setIsNewChat] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Handle conversation selection
  const handleSelectConversation = useCallback(async (conversation) => {
    if (!conversation) {
      // Handle new chat
      setIsNewChat(true);
      navigate('/conversations');
      return;
    }
    
    try {
      await loadConversation(conversation.id);
      navigate(`/conversations/${conversation.id}`);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      // Handle error
    }
  }, [loadConversation, navigate]);

  // Handle conversation deletion
  const handleDeleteConversation = useCallback(async (conversationId) => {
    if (!conversationId) return;
    
    try {
      setIsDeletingId(conversationId);
      await deleteConversation(conversationId);
      
      // If the deleted conversation was the current one, navigate to conversations list
      if (currentConversation?.id === conversationId) {
        navigate('/conversations');
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      // Handle error
    } finally {
      setIsDeletingId(null);
    }
  }, [currentConversation, deleteConversation, navigate]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle drawer toggle for mobile
  const handleDrawerToggle = useCallback(() => {
    setMobileOpen(!mobileOpen);
  }, [mobileOpen]);

  // Handle message input change
  const handleInputChange = useCallback((e) => {
    setMessageInput(e.target.value);
  }, []);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    setIsNewChat(true);
    handleSelectConversation(null);
    setMessageInput('');
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile, handleSelectConversation]);

  // Handle message submission
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !currentUser || isSending) return;
    
    const userMessage = {
      id: Date.now().toString(),
      content: messageInput,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    try {
      setIsSending(true);
      
      // Create a new conversation if needed
      if (isNewChat || !currentConversation) {
        const newConversation = await createConversationInContext({
          title: messageInput.slice(0, 30) + (messageInput.length > 30 ? '...' : ''),
          messages: [userMessage]
        });
        
        setIsNewChat(false);
        navigate(`/conversations/${newConversation.id}`);
      } else {
        // Add message to existing conversation
        await addMessageInContext(currentConversation.id, userMessage);
      }
      
      // Clear input
      setMessageInput('');
      
      // Here you would typically call your API to get a response
      // For now, we'll just add a placeholder response
      const botMessage = {
        id: (Date.now() + 1).toString(),
        content: 'This is a simulated response. In a real app, this would come from your AI service.',
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      
      // Add bot's response
      if (currentConversation) {
        await addMessageInContext(currentConversation.id, botMessage);
      }
      
    } catch (err) {
      console.error('Failed to send message:', err);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsSending(false);
    }
  }, [messageInput, currentUser, currentConversation, isNewChat, createConversation, addMessage, navigate, isSending]);

  // Handle key down for message input
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
    // setShowScrollToBottom(!isAtBottom);
  }, []);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setShowScrollToBottom(false);
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, scrollToBottom]);

  // Handle message deletion
  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      // Implement message deletion logic here
      console.log('Delete message:', messageId);
      // Note: You'll need to implement the actual deletion in your ConversationContext
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, []);

  // Handle conversation selection from URL
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        handleSelectConversation(conversation);
        setIsNewChat(false);
      } else {
        navigate('/conversations');
      }
    } else if (conversations.length > 0 && !conversationId) {
      handleSelectConversation(conversations[0]);
    }
  }, [conversationId, conversations, navigate, handleSelectConversation]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => 
    conversations.filter(conv => 
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.messages?.some(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ),
    [conversations, searchQuery]
  );

  // Loading state
  if (isLoading && conversations.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={3}>
        <Typography color="error" gutterBottom>
          Error loading conversations: {error.message || 'Unknown error'}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={loadConversations}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Mobile Header */}
      <MobileHeader>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {currentConversation?.title || 'New Chat'}
          </Typography>
        </Toolbar>
      </MobileHeader>

      {/* Sidebar */}
      <StyledDrawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        <DrawerHeader>
          <Typography variant="h6" noWrap>
            Chats
          </Typography>
          <Box>
            <Tooltip title="New Chat">
              <IconButton onClick={handleNewChat} size="small">
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={loadConversations} size="small" disabled={isLoading}>
                {isLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </DrawerHeader>
        
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
              },
            }}
          />
        </Box>
        
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={currentConversation?.id}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onCreateNew={() => handleSelectConversation(null)}
            isLoading={isLoading}
            isDeletingId={isDeletingId}
          />
        </Box>
      </StyledDrawer>

      {/* Main Content */}
      <MainContent open={!isMobile}>
        {currentConversation || isNewChat ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            position: 'relative',
            bgcolor: theme.palette.background.default,
          }}>
            {/* Messages Area */}
            <Box
              ref={messagesContainerRef}
              onScroll={handleScroll}
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: { xs: 2, sm: 3 },
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '3px',
                },
              }}
            >
              {messages.length > 0 ? (
                <Box sx={{ maxWidth: '900px', mx: 'auto', width: '100%' }}>
                  {messages.map((message, index) => (
                    <MessageBubble 
                      key={message.id || index}
                      message={message}
                      isUser={message.role === 'user'}
                      isLast={index === messages.length - 1}
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
                    color: 'text.secondary',
                    px: 2,
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
            <Zoom in={showScrollToBottom}>
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

            {/* Input Area */}
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
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5, 
                alignItems: 'center',
                maxWidth: '900px',
                mx: 'auto',
                width: '100%',
              }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim() || isSending}
                          color="primary"
                        >
                          {isSending ? <CircularProgress size={24} /> : <SendIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      backgroundColor: 'background.paper',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'divider',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                        borderWidth: '1px',
                      },
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      padding: '12px 16px',
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'divider',
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />
                <Tooltip 
                  title={input.trim() ? 'Send message' : 'Type a message to send'}
                  placement="top"
                >
                  <span>
                    <IconButton 
                      type="submit" 
                      color="primary"
                      disabled={!input.trim() || isSending}
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
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              p: 3,
              color: 'text.secondary',
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <MessageIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
            </Box>
            <Typography variant="h5" gutterBottom>
              No conversation selected
            </Typography>
            <Typography color="textSecondary" paragraph sx={{ mb: 3, maxWidth: '400px' }}>
              Select a conversation from the list or create a new one to get started.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleNewChat}
              sx={{ borderRadius: 2, px: 3, py: 1 }}
            >
              New Chat
            </Button>
          </Box>
        )}
      </MainContent>
    </Box>
  );
};

export default Conversations;