import { validationResult } from 'express-validator';
import FirestoreService from '../services/firestore.service.js';
import LLMService from '../services/LLMService.js';
import { logger } from '../../../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

class ChatController {
  /**
   * Create a new conversation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async createConversation(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation errors in createConversation:', { errors: errors.array() });
        return res.status(400).json({ 
          success: false,
          message: 'Validation failed',
          errors: errors.array() 
        });
      }

      const { title, model, style } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        logger.error('No user ID found in request');
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      logger.info('Creating new conversation', { 
        userId,
        title,
        model,
        style
      });

      const conversation = await FirestoreService.createConversation({
        userId,
        title: title?.trim() || 'New Chat',
        model: model?.trim() || 'llama3-70b-8192', // Updated to use Groq model
        style: style?.trim() || 'empathetic',
      });

      logger.info('Successfully created conversation', { 
        conversationId: conversation.id,
        userId 
      });

      return res.status(201).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      logger.error('Error in createConversation:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        user: req.user?.uid
      });
      
      next(new Error('Failed to create conversation. Please try again.'));
    }
  }

  /**
   * Get user's conversations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getConversations(req, res, next) {
    try {
      const userId = req.user?.uid;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      const { limit = 20, startAfter } = req.query;
      const limitCount = parseInt(limit, 10);

      const { conversations = [], lastVisible } = await FirestoreService.getUserConversations(
        userId,
        limitCount,
        startAfter
      );

      res.json({
        success: true,
        data: conversations,
        pagination: {
          hasMore: conversations.length === limitCount,
          nextCursor: lastVisible || null,
        },
      });
    } catch (error) {
      logger.error('Error getting conversations:', error);
      next(error);
    }
  }

  /**
   * Get a single conversation with its messages
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.uid;
      const { limit = 50, startAfter } = req.query;

      // Verify the conversation belongs to the user
      const conversation = await FirestoreService.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
        });
      }

      if (conversation.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to access this conversation',
        });
      }

      // Get messages
      const { messages, lastVisible } = await FirestoreService.getMessages(
        conversationId,
        parseInt(limit, 10),
        startAfter
      );

      res.json({
        success: true,
        data: {
          ...conversation,
          messages,
        },
        pagination: {
          hasMore: messages.length === parseInt(limit, 10),
          nextCursor: lastVisible,
        },
      });
    } catch (error) {
      logger.error('Error getting conversation:', error);
      next(error);
    }
  }

  /**
   * Update a conversation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async updateConversation(req, res, next) {
    try {
      console.log('=== updateConversation called ===');
      console.log('Request URL:', req.originalUrl);
      console.log('Request method:', req.method);
      console.log('Request params:', req.params);
      console.log('Request body:', req.body);
      console.log('User ID:', req.user?.uid);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ 
          success: false,
          message: 'Validation failed',
          errors: errors.array() 
        });
      }

      // Get conversation ID from params or body
      const conversationId = req.params.conversationId || req.body.id;
      if (!conversationId) {
        console.log('No conversation ID provided');
        return res.status(400).json({
          success: false,
          message: 'Conversation ID is required',
        });
      }
      
      const userId = req.user.uid;
      
      // Extract only the fields we want to update
      const { title, isArchived, messages, ...rest } = req.body;
      
      // Log the received data for debugging
      console.log('Received update data:', { title, isArchived, hasMessages: !!messages });
      
      console.log(`Looking up conversation ${conversationId} for user ${userId}`);

      // Verify the conversation exists and belongs to the user
      const conversation = await FirestoreService.getConversation(conversationId);
      if (!conversation) {
        console.log(`Conversation ${conversationId} not found`);
        
        // If not found, check if this is a new conversation that needs to be created
        if (req.body.id && req.body.title) {
          console.log('Creating new conversation as it does not exist');
          try {
            const newConversation = await FirestoreService.createConversation({
              id: conversationId,
              userId: userId,
              title: req.body.title || 'New Chat',
              model: req.body.model || 'llama3:8B',
              style: req.body.style || 'empathetic',
              messages: []
            });
            console.log('New conversation created:', newConversation);
            return res.json({
              success: true,
              data: newConversation,
              message: 'Conversation created successfully'
            });
          } catch (createError) {
            console.error('Error creating conversation:', createError);
            return res.status(500).json({
              success: false,
              message: 'Failed to create conversation',
              error: createError.message
            });
          }
        }
        
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
      }
      
      console.log('Found conversation:', conversation);

      // Verify the conversation belongs to the user
      if (conversation.userId !== userId) {
        console.log(`User ${userId} is not authorized to update conversation ${conversationId}`);
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to update this conversation',
        });
      }

      // Prepare update data - only include fields we want to update
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (isArchived !== undefined) updateData.isArchived = isArchived;
      
      // Always update the updatedAt timestamp
      updateData.updatedAt = new Date().toISOString();
      
      console.log('Updating conversation with data:', updateData);

      const updatedConversation = await FirestoreService.updateConversation(
        conversationId,
        updateData
      );
      
      console.log('Successfully updated conversation:', updatedConversation);

      res.json({
        success: true,
        data: updatedConversation,
      });
    } catch (error) {
      logger.error('Error updating conversation:', error);
      next(error);
    }
  }

  /**
   * Delete a conversation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async deleteConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.uid;

      // Verify the conversation belongs to the user
      const conversation = await FirestoreService.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
        });
      }

      if (conversation.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to delete this conversation',
        });
      }

      await FirestoreService.deleteConversation(conversationId);

      res.json({
        success: true,
        data: { id: conversationId },
      });
    } catch (error) {
      logger.error('Error deleting conversation:', error);
      next(error);
    }
  }

  /**
   * Send a message in a conversation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async sendMessage(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { conversationId } = req.params;
      const { content, stream = false } = req.body;
      const userId = req.user.uid;

      // Verify the conversation belongs to the user
      const conversation = await FirestoreService.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
        });
      }

      if (conversation.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to send messages in this conversation',
        });
      }

      // Create user message
      const userMessage = await FirestoreService.createMessage({
        conversationId,
        content,
        role: 'user',
        metadata: {
          tokens: content.length / 4, // Rough estimate
        },
      });

      // Get recent messages for conversation history
      console.log('Getting messages for conversation:', conversationId);
      const messagesResponse = await FirestoreService.getMessages(conversationId, 10);
      console.log('Messages response type:', typeof messagesResponse);
      console.log('Messages response keys:', messagesResponse ? Object.keys(messagesResponse) : []);

      // Extract messages from the response
      const messages = messagesResponse && messagesResponse.messages ? messagesResponse.messages : [];
      console.log('Number of messages found:', messages.length);

      // Prepare conversation history for the AI
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the new user message to the history
      conversationHistory.push({
        role: 'user',
        content,
      });

      // Generate AI response using LLMService
      const aiResponse = await LLMService.chatCompletion(conversationHistory, {
        provider: 'groq', // or get from conversation settings
        model: conversation.model,
        temperature: 0.7,
        maxTokens: 2000,
        stream: false
      });
      
      // Extract the AI message from the response
      const aiMessageContent = aiResponse.choices?.[0]?.message?.content || 'I\'m sorry, I couldn\'t generate a response.';

      // Create AI message
      const aiMessage = await FirestoreService.createMessage({
        conversationId,
        content: aiResponse.message?.content || 'I\'m sorry, I couldn\'t generate a response.',
        role: 'assistant',
        metadata: {
          model: conversation.model,
          tokens: aiResponse.message?.content?.length / 4 || 0,
        },
      });

      // Update conversation's updatedAt and last message
      await FirestoreService.updateConversation(conversationId, {
        updatedAt: new Date(),
        'metadata.lastMessage': aiMessage.content.substring(0, 100) + '...',
        'metadata.messageCount': conversation.metadata.messageCount + 2, // +1 for user, +1 for AI
      });

      res.json({
        success: true,
        data: {
          userMessage,
          aiMessage,
        },
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      next(error);
    }
  }

  /**
   * Stream a message (SSE)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async streamMessage(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { conversationId } = req.params;
      const { content } = req.body;
      const userId = req.user.uid;

      // Verify the conversation belongs to the user
      const conversation = await FirestoreService.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
        });
      }

      if (conversation.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to send messages in this conversation',
        });
      }

      // Create user message
      const userMessage = await FirestoreService.createMessage({
        conversationId,
        content,
        role: 'user',
        metadata: {
          tokens: content.length / 4, // Rough estimate
        },
      });

      // Prepare conversation history
      const messages = await FirestoreService.getMessages(conversationId, 10);
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the new user message to the history
      conversationHistory.push({
        role: 'user',
        content,
      });

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Keep the connection alive
      const keepAlive = setInterval(() => {
        res.write('\n');
      }, 30000);

      // Handle client disconnect
      req.on('close', () => {
        clearInterval(keepAlive);
        res.end();
      });

      let fullResponse = '';
      const messageId = uuidv4();

      // Stream the response
      try {
        const stream = await LLMService.chatCompletion(conversationHistory, {
          provider: 'groq', // or get from conversation settings
          model: conversation.model,
          temperature: 0.7,
          maxTokens: 2000,
          stream: true,
        });

        // Process the stream
        for await (const chunk of stream) {
          // Handle the chunk format from LLMService
          if (chunk.choices && chunk.choices[0]?.delta) {
            const content = chunk.choices[0].delta.content || '';
            fullResponse += content;
            
            // Send the chunk to the client
            res.write(`data: ${JSON.stringify({
              id: messageId,
              content: content,
              done: false,
            })}\n\n`);
          }
        }

        // Create AI message in database
        const aiMessage = await FirestoreService.createMessage({
          conversationId,
          content: fullResponse,
          role: 'assistant',
          metadata: {
            model: conversation.model,
            tokens: fullResponse.length / 4,
          },
        });

        // Update conversation
        await FirestoreService.updateConversation(conversationId, {
          updatedAt: new Date(),
          'metadata.lastMessage': fullResponse.substring(0, 100) + '...',
          'metadata.messageCount': conversation.metadata.messageCount + 2,
        });

        // Send completion event
        res.write(`data: ${JSON.stringify({
          id: messageId,
          done: true,
          messageId: aiMessage.id,
        })}\n\n`);
      } catch (error) {
        logger.error('Error in streaming response:', error);
        res.write(`event: error\ndata: ${JSON.stringify({
          error: 'Error generating response',
          details: error.message,
        })}\n\n`);
      } finally {
        clearInterval(keepAlive);
        res.end();
      }
    } catch (error) {
      logger.error('Error in streamMessage:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      } else {
        res.write(`event: error\ndata: ${JSON.stringify({
          error: 'Internal server error',
          details: error.message,
        })}\n\n`);
        res.end();
      }
    }
  }

  /**
   * List available models
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async listModels(req, res, next) {
    try {
      // Get models from LLMService
      const models = await LLMService.listModels();
      res.json({
        success: true,
        data: models,
      });
    } catch (error) {
      logger.error('Error listing models:', error);
      next(error);
    }
  }

  /**
   * Get messages in a conversation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { limit = 50, startAfter } = req.query;
      const userId = req.user.uid;

      // Verify the conversation belongs to the user
      const conversation = await FirestoreService.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
        });
      }

      if (conversation.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to access this conversation',
        });
      }

      // Get messages
      const { messages, lastVisible } = await FirestoreService.getMessages(
        conversationId,
        parseInt(limit, 10),
        startAfter
      );

      res.json({
        success: true,
        data: {
          messages,
          conversationId,
        },
        pagination: {
          hasMore: messages.length === parseInt(limit, 10),
          nextCursor: lastVisible,
        },
      });
    } catch (error) {
      logger.error('Error getting messages:', error);
      next(error);
    }
  }
}

export default new ChatController();
