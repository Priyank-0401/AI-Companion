# AI Companion - Backend API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Base URL](#base-url)
3. [Endpoints](#endpoints)
   - [Conversations](#conversations)
   - [Messages](#messages)
   - [Models](#models)
   - [Usage](#usage)
   - [Status](#status)
4. [Request/Response Formats](#requestresponse-formats)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [WebSocket/SSE](#websocketsse)

## Authentication

All API endpoints require authentication using Firebase ID tokens. The token should be included in the `Authorization` header:

```
Authorization: Bearer <firebase_id_token>
```

## Base URL

```
http://localhost:3001/api/v1/chat
```

## Endpoints

### Conversations

#### Create a New Conversation

```
POST /conversations
```

**Request Body:**
```json
{
  "title": "Therapy Session",
  "model": "llama3-8b-8192",
  "systemMessage": "You are Seriva, a kind and empathetic human-like friend and therapist."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "674fbcfe-9676-4d0c-b74d-e5d33a69fac5",
    "title": "Therapy Session",
    "model": "llama3-8b-8192",
    "createdAt": "2025-07-09T08:51:49.531Z",
    "updatedAt": "2025-07-09T08:51:49.531Z"
  }
}
```

#### Get Conversation

```
GET /conversations/:conversationId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "674fbcfe-9676-4d0c-b74d-e5d33a69fac5",
    "title": "Therapy Session",
    "model": "llama3-8b-8192",
    "messages": [
      {
        "id": "41fc309f-e94f-416b-8076-3f893a766ac0",
        "role": "user",
        "content": "Tell me a short story about a robot learning to paint",
        "timestamp": "2025-07-09T08:51:49.531Z"
      },
      {
        "id": "8f6ced71-b6fc-47c2-87f1-f39e46c5e7e8",
        "role": "assistant",
        "content": "In a small studio nestled in the heart of the city...",
        "timestamp": "2025-07-09T08:51:49.881Z",
        "metadata": {
          "model": "llama3-8b-8192",
          "tokens": 20,
          "isEdited": false
        }
      }
    ],
    "createdAt": "2025-07-09T08:51:49.531Z",
    "updatedAt": "2025-07-09T08:51:49.881Z"
  }
}
```

### Messages

#### Send a Message

```
POST /conversations/:conversationId/messages
```

**Request Body:**
```json
{
  "content": "Tell me a short story about a robot learning to paint"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "41fc309f-e94f-416b-8076-3f893a766ac0",
      "conversationId": "674fbcfe-9676-4d0c-b74d-e5d33a69fac5",
      "content": "Tell me a short story about a robot learning to paint",
      "role": "user",
      "timestamp": "2025-07-09T08:51:49.531Z"
    },
    "aiMessage": {
      "id": "8f6ced71-b6fc-47c2-87f1-f39e46c5e7e8",
      "conversationId": "674fbcfe-9676-4d0c-b74d-e5d33a69fac5",
      "content": "In a small studio nestled in the heart of the city...",
      "role": "assistant",
      "timestamp": "2025-07-09T08:51:49.881Z",
      "metadata": {
        "model": "llama3-8b-8192",
        "tokens": 20,
        "isEdited": false
      }
    },
    "conversation": {
      "id": "674fbcfe-9676-4d0c-b74d-e5d33a69fac5",
      "title": "Therapy Session",
      "updatedAt": "2025-07-09T08:51:49.881Z"
    }
  }
}
```

### Models

#### List Available Models

```
GET /models
```

**Response:**
```json
{
  "success": true,
  "data": {
    "groq": [
      "llama3-8b-8192",
      "llama3-70b-8192"
    ],
    "openrouter": []
  }
}
```

**Note:** The `mixtral-8x7b-32768` model has been decommissioned and is no longer available.

### Usage

#### Get Usage Statistics

```
GET /usage
```

**Query Parameters:**
- `start_date` (optional): Filter usage from this date (ISO format)
- `end_date` (optional): Filter usage until this date (ISO format)
- `provider` (optional): Filter by provider (groq, openrouter)
- `model` (optional): Filter by model ID

**Response:**
```json
{
  "success": true,
  "data": {
    "total_requests": 42,
    "total_tokens": 12000,
    "total_cost": 0.42,
    "daily_usage": [
      {
        "date": "2025-07-09",
        "requests": 10,
        "tokens": 3000,
        "cost": 0.03
      }
    ],
    "by_model": [
      {
        "model": "llama3-8b-8192",
        "provider": "groq",
        "requests": 30,
        "tokens": 8000,
        "cost": 0.08
      },
      {
        "model": "llama3-70b-8192",
        "provider": "groq",
        "requests": 12,
        "tokens": 4000,
        "cost": 0.31
      }
    ]
  }
}
```

### Status

#### Get Service Status

```
GET /status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "version": "1.0.0",
    "uptime": 123456,
    "providers": {
      "groq": {
        "status": "operational",
        "models": ["llama3-8b-8192", "llama3-70b-8192"],
        "default_model": "llama3-8b-8192"
      },
      "openrouter": {
        "status": "disabled",
        "reason": "API key not configured"
      }
    },
    "rate_limiting": {
      "enabled": true,
      "max_requests_per_minute": 60
    }
  }
}
```

## Request/Response Formats

### Request Headers
- `Content-Type: application/json` (for POST/PUT requests with body)
- `Authorization: Bearer <firebase_id_token>`
- `Accept: text/event-stream` (for streaming endpoints)

### Response Format

All responses follow this format:
```typescript
{
  success: boolean;    // Whether the request was successful
  data?: any;          // Response data (if successful)
  error?: {            // Error details (if failed)
    code: string;      // Error code (e.g., 'auth/unauthorized')
    message: string;   // Human-readable error message
    details?: any;     // Additional error details
  }
}
```

## Error Handling

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `validation_error` | Request validation failed |
| 401 | `unauthorized` | Invalid or missing authentication |
| 403 | `forbidden` | Insufficient permissions |
| 404 | `not_found` | Resource not found |
| 429 | `rate_limit_exceeded` | Rate limit exceeded |
| 500 | `server_error` | Internal server error |
| 503 | `service_unavailable` | Service temporarily unavailable |

### Model-Specific Errors

When a model is not available (e.g., decommissioned), you might see:

```json
{
  "success": false,
  "error": "Failed to generate AI response",
  "errorDetails": "Groq API error: The model `mixtral-8x7b-32768` has been decommissioned and is no longer supported.",
  "errorType": "api_error",
  "retryable": true
}
```

## Rate Limiting

- Default: 1000 requests per minute per user
- Streaming: 10 concurrent streams per user
- Headers:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (UTC timestamp)

## WebSocket/SSE

### Connection

1. Client opens an SSE connection to `/chat/stream`
2. Server sends a welcome message
3. Client can send messages as JSON objects
4. Server streams responses as Server-Sent Events
5. Either side can close the connection

### Message Format

**Client to Server:**
```json
{
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "model": "llama3-70b-8192",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Server to Client (SSE):**
```
event: message
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"llama3-70b-8192","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

event: message
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"llama3-70b-8192","choices":[{"index":0,"delta":{"content":" there"},"finish_reason":null}]}

event: done
data: {}
```

### Events

- `message`: New message chunk received
- `error`: Error occurred
- `done`: Stream completed successfully
- `ping`: Keep-alive ping (sent every 30s)
