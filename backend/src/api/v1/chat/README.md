# Chat API Documentation

This module provides a RESTful API for managing chat conversations with AI models using Ollama.

## API Endpoints

### Conversations

#### Create a new conversation
```
POST /api/v1/chat/conversations
```

**Request Body:**
```json
{
  "title": "My First Chat",
  "model": "llama3:8B",
  "style": "empathetic"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "conversation-id",
    "userId": "user-id",
    "title": "My First Chat",
    "model": "llama3:8B",
    "style": "empathetic",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "isArchived": false,
    "metadata": {
      "messageCount": 0,
      "lastMessage": ""
    }
  }
}
```

#### List user's conversations
```
GET /api/v1/chat/conversations?limit=20&startAfter=last-conversation-id
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "conversation-id",
      "userId": "user-id",
      "title": "My First Chat",
      "model": "llama3:8B",
      "style": "empathetic",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:05.000Z",
      "isArchived": false,
      "metadata": {
        "messageCount": 2,
        "lastMessage": "Hello, how can I help you today?"
      }
    }
  ],
  "pagination": {
    "hasMore": false,
    "nextCursor": null
  }
}
```

### Messages

#### Send a message
```
POST /api/v1/chat/conversations/:conversationId/messages
```

**Request Body:**
```json
{
  "content": "Hello, how are you?",
  "stream": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "message-id-1",
      "conversationId": "conversation-id",
      "content": "Hello, how are you?",
      "role": "user",
      "timestamp": "2023-01-01T00:01:00.000Z",
      "metadata": {
        "tokens": 5,
        "isEdited": false
      }
    },
    "aiMessage": {
      "id": "message-id-2",
      "conversationId": "conversation-id",
      "content": "I'm doing well, thank you for asking! How can I assist you today?",
      "role": "assistant",
      "timestamp": "2023-01-01T00:01:02.000Z",
      "metadata": {
        "model": "llama3:8B",
        "tokens": 12,
        "isEdited": false
      }
    }
  }
}
```

#### Stream a message (SSE)
```
POST /api/v1/chat/conversations/:conversationId/messages/stream
```

**Request Body:**
```json
{
  "content": "Tell me a story"
}
```

**Response (SSE stream):**
```
event: message
data: {"id": "message-chunk-1", "content": "Once", "done": false}

event: message
data: {"id": "message-chunk-2", "content": " upon", "done": false}

...

event: message
data: {"id": "message-chunk-n", "content": "the end.", "done": false}

event: done
data: {"id": "message-chunk-n", "messageId": "message-id", "done": true}
```

#### Get conversation messages
```
GET /api/v1/chat/conversations/:conversationId/messages?limit=50&startAfter=last-message-id
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "message-id-1",
      "conversationId": "conversation-id",
      "content": "Hello, how are you?",
      "role": "user",
      "timestamp": "2023-01-01T00:01:00.000Z",
      "metadata": {
        "tokens": 5,
        "isEdited": false
      }
    },
    {
      "id": "message-id-2",
      "conversationId": "conversation-id",
      "content": "I'm doing well, thank you for asking! How can I assist you today?",
      "role": "assistant",
      "timestamp": "2023-01-01T00:01:02.000Z",
      "metadata": {
        "model": "llama3:8B",
        "tokens": 12,
        "isEdited": false
      }
    }
  ],
  "pagination": {
    "hasMore": false,
    "nextCursor": null
  }
}
```

## Models

### Conversation
- `id` (string): Unique identifier for the conversation
- `userId` (string): ID of the user who owns the conversation
- `title` (string): Title of the conversation
- `model` (string): AI model used for the conversation (e.g., 'llama2')
- `style` (string): Conversation style (e.g., 'empathetic', 'coach', 'playful', 'mindful')
- `createdAt` (Date): When the conversation was created
- `updatedAt` (Date): When the conversation was last updated
- `isArchived` (boolean): Whether the conversation is archived
- `metadata` (object): Additional metadata
  - `messageCount` (number): Total number of messages in the conversation
  - `lastMessage` (string): Preview of the last message

### Message
- `id` (string): Unique identifier for the message
- `conversationId` (string): ID of the conversation this message belongs to
- `content` (string): The message content
- `role` (string): The role of the message sender ('user' or 'assistant')
- `timestamp` (Date): When the message was sent
- `metadata` (object): Additional metadata
  - `model` (string, optional): AI model used for assistant messages
  - `tokens` (number): Number of tokens in the message
  - `isEdited` (boolean): Whether the message has been edited

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "msg": "Invalid value",
      "param": "model",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Conversation not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "An unexpected error occurred"
}
```
