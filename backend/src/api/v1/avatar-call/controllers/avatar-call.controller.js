import { v4 as uuidv4 } from 'uuid';
import llmService from '../../chat/services/LLMService.js';
import { logger } from '../../../../utils/logger.js';

/**
 * Process a voice message and return a response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const processVoiceMessage = async (req, res, next) => {
  const requestId = Math.random().toString(36).substring(2, 10);
  const startTime = Date.now();
  
  try {
    // At this point, req.body has been validated by the middleware
    const { message, model, style, context = {} } = req.body;
    
    logger.info(`[${requestId}] Processing voice message`, { 
      model, 
      style,
      context,
      messageLength: message?.length || 0
    });
    
    // Prepare messages array with system and user messages
    const messages = [
      // System message with context
      {
        role: 'system',
        content: [
          'You are a helpful AI assistant.',
          context.emotion && `The user's current emotional state is: ${context.emotion}`,
          context.timestamp && `Current time: ${new Date(context.timestamp).toLocaleString()}`
        ].filter(Boolean).join(' ')
      },
      // User message
      { 
        role: 'user', 
        content: message
      }
    ];
    
    // Prepare options for the LLM service
    const llmOptions = {
      provider: 'groq',
      model: model || 'llama3-8b-8192',
      temperature: 0.7,
      maxTokens: 1000,
      stream: false,
      // Add request ID for tracing
      metadata: {
        requestId,
        endpoint: 'avatar-call/process',
        style
      }
    };
    
    logger.debug(`[${requestId}] Sending request to LLM service`, {
      model: llmOptions.model,
      messageCount: messages.length,
      options: llmOptions
    });
    
    logger.debug('Calling LLM service with:', { 
      messageCount: messages.length,
      model: llmOptions.model,
      style,
      context
    });
    
    // Call the LLM service
    const response = await llmService.chatCompletion(messages, llmOptions);
    
    // Extract the response content
    const responseContent = response.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';
    
    // Simple emotion detection based on response content
    const emotion = detectEmotion(responseContent);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    logger.info(`[${requestId}] Successfully generated response`, {
      model,
      responseTime: `${responseTime}ms`,
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
      totalTokens: response.usage?.total_tokens,
      emotion,
      responseLength: responseContent.length
    });
    
    // Return the response
    return res.json({
      success: true,
      data: {
        id: response.id || `gen_${Date.now()}`,
        content: responseContent,
        model: response.model || model,
        usage: response.usage,
        emotion,
        timestamp: new Date().toISOString(),
        metadata: {
          requestId,
          responseTime: `${responseTime}ms`
        }
      }
    });
  } catch (error) {
    const errorId = `err_${Date.now()}`;
    const errorTime = Date.now() - startTime;
    
    logger.error(`[${requestId}] Error processing voice message (${errorTime}ms)`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        status: error.status,
        response: error.response?.data
      },
      requestId,
      errorId,
      responseTime: `${errorTime}ms`
    });
    
    // Enhanced error responses
    const errorResponse = {
      success: false,
      error: error.name || 'InternalServerError',
      message: error.message || 'An unexpected error occurred',
      errorId,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error.details
      })
    };
    
    // Handle specific error types
    if (error.status === 429) {
      errorResponse.retryAfter = error.retryAfter || 60;
      errorResponse.message = 'Too many requests, please try again later';
      return res.status(429).json(errorResponse);
    }
    
    // Default error status code
    const statusCode = error.status || 500;
    
    // Don't expose internal errors in production
    if (statusCode >= 500 && process.env.NODE_ENV !== 'development') {
      errorResponse.message = 'An internal server error occurred';
    }
    
    return res.status(statusCode).json(errorResponse);
  }
};

/**
 * Simple emotion detection based on response content
 * @param {string} text - The text to analyze
 * @returns {string} Detected emotion
 */
function detectEmotion(text) {
  const lowerText = text.toLowerCase();
  
  if (/(happy|great|awesome|wonderful|amazing|good|yes|yeah|yay|\bha+\b|\blol\b|\blmao\b|\brofl\b|\bjoy\b|\blove\b|❤️|😊|😄|😃|😁|😆|🥰|😍)/.test(lowerText)) {
    return 'happy';
  }
  
  if (/(sad|upset|unhappy|depressed|sorry|apologize|cry|tears|😢|😭|😞|😔|😟|😕|😣|😖|😫|😩)/.test(lowerText)) {
    return 'sad';
  }
  
  if (/(angry|mad|annoyed|frustrated|pissed|rage|hate|😠|😡|🤬|👿|😤|😾)/.test(lowerText)) {
    return 'angry';
  }
  
  if (/(surprised|wow|omg|oh my god|whoa|😲|😮|😯|😳|😱|🤯|😵)/.test(lowerText)) {
    return 'surprised';
  }
  
  return 'neutral';
}
