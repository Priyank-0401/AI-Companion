import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  InputAdornment,
  IconButton,
  Divider,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  Refresh as RefreshIcon,
  ViewList as ViewListIcon,
  GridView as GridViewIcon
} from '@mui/icons-material';
import { useConversationContext } from '../../contexts/ConversationContext.jsx';
import ConversationItem from './ConversationItem';

const ConversationList = ({ onConversationSelect, selectedConversationId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { 
    conversations, 
    isLoading, 
    error, 
    loadConversations, 
    createConversation 
  } = useConversationContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [filter, setFilter] = useState('all');
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleRefresh = useCallback(() => {
    loadConversations();
  }, [loadConversations]);
  
  const handleCreateNew = useCallback(async () => {
    try {
      const newConversation = await createConversation({
        title: 'New Conversation',
        tags: []
      });
      onConversationSelect(newConversation);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  }, [createConversation, onConversationSelect]);
  
  const filteredConversations = React.useMemo(() => {
    return conversations.filter(conversation => {
      // Filter by search query
      const matchesSearch = conversation.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        (conversation.tags || []).some(tag => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      // Filter by status
      const matchesFilter = filter === 'all' || 
        (filter === 'archived' && conversation.isArchived) ||
        (filter === 'active' && !conversation.isArchived);
      
      return matchesSearch && matchesFilter;
    });
  }, [conversations, searchQuery, filter]);
  
  const sortedConversations = React.useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
  }, [filteredConversations]);
  
  if (error) {
    return (
      <Box p={2} textAlign="center">
        <Typography color="error">{error}</Typography>
        <Button 
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
          sx={{ mt: 1 }}
        >
          Retry
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      bgcolor: 'background.paper',
      borderRight: 1,
      borderColor: 'divider',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.default'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Conversations
          </Typography>
          
          <Box>
            <Tooltip title={viewMode === 'list' ? 'Grid view' : 'List view'}>
              <IconButton 
                size="small" 
                onClick={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
              >
                {viewMode === 'list' ? <GridViewIcon /> : <ViewListIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={handleRefresh} disabled={isLoading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Search */}
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />
        
        {/* Filter Tabs */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <ToggleButtonGroup
            size="small"
            value={filter}
            exclusive
            onChange={(e, newFilter) => newFilter && setFilter(newFilter)}
            aria-label="conversation filter"
          >
            <ToggleButton value="all" size="small">All</ToggleButton>
            <ToggleButton value="active" size="small">Active</ToggleButton>
            <ToggleButton value="archived" size="small">Archived</ToggleButton>
          </ToggleButtonGroup>
          
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            disabled={isLoading}
          >
            {isMobile ? '' : 'New'}
          </Button>
        </Box>
      </Box>
      
      {/* Conversation List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
        {isLoading && conversations.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress size={24} />
          </Box>
        ) : sortedConversations.length === 0 ? (
          <Box textAlign="center" p={3}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery 
                ? 'No conversations match your search.' 
                : filter === 'archived' 
                  ? 'No archived conversations.' 
                  : 'No conversations yet. Start a new one!'}
            </Typography>
            {!searchQuery && filter !== 'archived' && (
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
                sx={{ mt: 2 }}
              >
                New Conversation
              </Button>
            )}
          </Box>
        ) : (
          <Box>
            {sortedConversations.map(conversation => (
              <Box key={conversation.id} mb={1}>
                <ConversationItem
                  conversation={conversation}
                  isSelected={selectedConversationId === conversation.id}
                  onSelect={onConversationSelect}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
      
      {/* Bottom padding for mobile */}
      {isMobile && <Box p={2} />}
    </Box>
  );
};

export default React.memo(ConversationList);
