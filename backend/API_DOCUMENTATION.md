# AI Companion - Backend API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Base URL](#base-url)
3. [Endpoints](#endpoints)
   - [Chat](#chat)
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
http://localhost:3001/api/v1
```

## Endpoints

### Chat

#### Send Message (Non-streaming)

```
POST /chat
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "provider": "groq",
  "model": "llama3-70b-8192",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "chatcmpl-123",
    "object": "chat.completion",
    "created": 1677652288,
    "model": "llama3-70b-8192",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "I'm doing well, thank you! How can I assist you today?"
        },
        "finish_reason": "stop"
      }
    ],
    "usage": {
      "prompt_tokens": 10,
      "completion_tokens": 12,
      "total_tokens": 22
    }
  }
}
```

#### Stream Message (SSE)

```
POST /chat/stream
```

**Request Body:** (Same as non-streaming, with `"stream": true`)

**Response:**
Server-Sent Events (SSE) stream with the following format:
```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"llama3-70b-8192","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"llama3-70b-8192","choices":[{"index":0,"delta":{"content":" there"},"finish_reason":null}]}

data: [DONE]
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
  "data": [
    {
      "id": "llama3-70b-8192",
      "name": "LLaMA 3 70B",
      "provider": "groq",
      "max_tokens": 8192,
      "supports_streaming": true
    },
    {
      "id": "mixtral-8x7b-32768",
      "name": "Mixtral 8x7B",
      "provider": "groq",
      "max_tokens": 32768,
      "supports_streaming": true
    },
    {
      "id": "openai/gpt-4-turbo",
      "name": "GPT-4 Turbo",
      "provider": "openrouter",
      "max_tokens": 128000,
      "supports_streaming": true
    }
  ]
}
```

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
        "date": "2023-03-01",
        "requests": 10,
        "tokens": 3000,
        "cost": 0.1
      },
      {
        "date": "2023-03-02",
        "requests": 32,
        "tokens": 9000,
        "cost": 0.32
      }
    ],
    "by_model": [
      {
        "model": "llama3-70b-8192",
        "requests": 30,
        "tokens": 8000,
        "cost": 0.3
      },
      {
        "model": "mixtral-8x7b-32768",
        "requests": 12,
        "tokens": 4000,
        "cost": 0.12
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
    "groq": {
      "status": "operational",
      "models": ["llama3-70b-8192", "mixtral-8x7b-32768"],
      "rate_limit": 1000,
      "remaining_requests": 950
    },
    "openrouter": {
      "status": "operational",
      "models": ["openai/gpt-4-turbo", "anthropic/claude-3-opus"],
      "rate_limit": 500,
      "remaining_requests": 500
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
