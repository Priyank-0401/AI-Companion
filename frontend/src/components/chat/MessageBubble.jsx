import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  IconButton, 
  Menu, 
  MenuItem, 
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon, 
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Done as DoneIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const MessageBubble = ({ 
  message, 
  isUser = false, 
  isLast = false,
  onDelete 
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [copied, setCopied] = useState(false);
  const menuOpen = Boolean(anchorEl);
  const messageRef = useRef(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      handleMenuClose();
    }
  };

  const handleDelete = () => {
    if (onDelete && message.id) {
      onDelete(message.id);
    }
    handleMenuClose();
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      if (!timestamp) return '';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  // Determine bubble styles based on message type
  const bubbleStyles = {
    maxWidth: { xs: '85%', sm: '75%', md: '65%' },
    borderRadius: 3,
    p: 2,
    position: 'relative',
    wordBreak: 'break-word',
    ...(isUser
      ? {
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          borderTopRightRadius: 4,
          ml: 'auto',
        }
      : {
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.grey[800], 0.7) 
            : alpha(theme.palette.grey[200], 0.9),
          color: theme.palette.text.primary,
          borderTopLeftRadius: 4,
          mr: 'auto',
        }),
  };

  return (
    <Box
      ref={messageRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        mb: isLast ? 0 : 2,
        px: 2,
        position: 'relative',
        '&:hover .message-actions': {
          opacity: 1,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1.5,
          maxWidth: '100%',
          width: '100%',
          ...(isUser && { flexDirection: 'row-reverse' }),
        }}
      >
        {!isUser && (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            AI
          </Avatar>
        )}

        <Box sx={{ position: 'relative', maxWidth: '100%' }}>
          <Box sx={bubbleStyles}>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                '& a': {
                  color: isUser 
                    ? theme.palette.primary.light 
                    : theme.palette.primary.main,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                },
                '& code': {
                  fontFamily: 'monospace',
                  backgroundColor: isUser 
                    ? alpha(theme.palette.common.black, 0.2)
                    : alpha(theme.palette.common.black, 0.1),
                  padding: '0.2em 0.4em',
                  borderRadius: 1,
                  fontSize: '0.9em',
                },
                '& pre': {
                  backgroundColor: isUser 
                    ? alpha(theme.palette.common.black, 0.2)
                    : alpha(theme.palette.common.black, 0.1),
                  padding: '0.75rem',
                  borderRadius: 1,
                  overflowX: 'auto',
                  margin: '0.5rem 0',
                  '& code': {
                    backgroundColor: 'transparent',
                    padding: 0,
                  },
                },
              }}
              dangerouslySetInnerHTML={{
                __html: message.content.replace(/\n/g, '<br />'),
              }}
            />
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                mt: 0.5,
                gap: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  opacity: 0.8,
                  color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                }}
              >
                {formatTimestamp(message.timestamp || message.createdAt)}
              </Typography>
              
              {isUser && (
                <Box className="message-actions" sx={{ opacity: 0, transition: 'opacity 0.2s' }}>
                  <IconButton
                    size="small"
                    onClick={handleMenuOpen}
                    sx={{
                      color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'action.active',
                      p: 0.25,
                      '&:hover': {
                        backgroundColor: isUser 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Message Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: isUser ? 'right' : 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: isUser ? 'right' : 'left',
        }}
        PaperProps={{
          elevation: 1,
          sx: {
            minWidth: 160,
            borderRadius: 1.5,
            overflow: 'hidden',
            mt: 0.5,
            '& .MuiMenuItem-root': {
              fontSize: '0.875rem',
              py: 1,
              px: 2,
            },
          },
        }}
      >
        <MenuItem onClick={handleCopy}>
          {copied ? (
            <>
              <DoneIcon fontSize="small" sx={{ mr: 1.5 }} />
              Copied!
            </>
          ) : (
            <>
              <ContentCopyIcon fontSize="small" sx={{ mr: 1.5 }} />
              Copy
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MessageBubble;
