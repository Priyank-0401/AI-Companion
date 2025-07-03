import React, { useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useConversationContext } from '../../contexts/ConversationContext';
import { Card, CardContent, Typography, Box, IconButton, Tooltip, Chip, Stack } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Archive as ArchiveIcon } from '@mui/icons-material';

const ConversationItem = ({ conversation, isSelected, onSelect }) => {
  const { deleteConversation, updateConversation } = useConversationContext();
  const { id, title, updatedAt, tags = [], isArchived } = conversation;

  const handleDelete = useCallback(async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation(id);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
  }, [deleteConversation, id]);

  const handleArchive = useCallback(async (e) => {
    e.stopPropagation();
    try {
      await updateConversation(id, { isArchived: !isArchived });
    } catch (error) {
      console.error('Failed to update conversation:', error);
    }
  }, [updateConversation, id, isArchived]);

  return (
    <Card 
      onClick={() => onSelect(conversation)}
      sx={{
        mb: 1,
        cursor: 'pointer',
        backgroundColor: isSelected ? 'action.selected' : 'background.paper',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        transition: 'background-color 0.2s',
      }}
      elevation={isSelected ? 2 : 0}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flexGrow={1} overflow="hidden">
            <Typography 
              variant="subtitle1" 
              noWrap 
              sx={{ 
                fontWeight: isSelected ? 'bold' : 'normal',
                mb: 0.5 
              }}
            >
              {title || 'Untitled Conversation'}
            </Typography>
            
            <Typography 
              variant="caption" 
              color="text.secondary"
              display="block"
              mb={1}
            >
              {updatedAt ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true }) : 'Just now'}
            </Typography>
            
            {tags.length > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {tags.slice(0, 2).map((tag, index) => (
                  <Chip 
                    key={index} 
                    label={tag} 
                    size="small" 
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                ))}
                {tags.length > 2 && (
                  <Chip 
                    label={`+${tags.length - 2}`} 
                    size="small"
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                )}
              </Stack>
            )}
          </Box>
          
          <Box display="flex" flexDirection="column">
            <Tooltip title={isArchived ? 'Unarchive' : 'Archive'}>
              <IconButton 
                size="small" 
                onClick={handleArchive}
                color={isArchived ? 'primary' : 'default'}
                sx={{ p: 0.5 }}
              >
                <ArchiveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Delete">
              <IconButton 
                size="small" 
                onClick={handleDelete}
                color="error"
                sx={{ p: 0.5 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default React.memo(ConversationItem);
