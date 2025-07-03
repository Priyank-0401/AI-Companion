# AI Companion Backend

A modern, secure, and scalable backend for the AI Companion application, built with Node.js, Express, and Firebase.

## Features

- **RESTful API** with proper HTTP methods and status codes
- **Authentication & Authorization** using Firebase Authentication and JWT
- **File Uploads** with size and type validation
- **Email Notifications** for user registration, password reset, etc.
- **Rate Limiting** to prevent abuse
- **Security Best Practices** including CORS, Helmet, and more
- **Logging** with Winston for production and development
- **Input Validation** using Joi
- **Environment-based Configuration**
- **API Documentation** (coming soon)

## Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- Firebase project with Authentication and Firestore enabled
- MongoDB (optional, if using MongoDB)
- Redis (optional, for rate limiting and caching)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-companion.git
   cd ai-companion/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration
   - For Firebase, download the service account key and update the credentials

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## Project Structure

```
backend/
├── config/               # Configuration files
├── controllers/          # Route controllers
├── middleware/           # Custom middleware
├── models/               # Database models
├── routes/               # API routes
├── services/             # Business logic
├── templates/            # Email templates
├── tests/                # Test files
├── utils/                # Utility functions
├── .env.example          # Environment variables example
├── .eslintrc.js          # ESLint configuration
├── .gitignore            # Git ignore file
├── app.js                # Express application
├── package.json          # Project dependencies
└── server.js             # Server entry point
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user profile

### Journal Entries

- `GET /api/journal/entries` - Get all journal entries
- `POST /api/journal/entries` - Create a new journal entry
- `GET /api/journal/entries/:id` - Get a journal entry by ID
- `PUT /api/journal/entries/:id` - Update a journal entry
- `DELETE /api/journal/entries/:id` - Delete a journal entry

### Wellness Data

- `GET /api/wellness/stats` - Get wellness statistics
- `POST /api/wellness/log` - Log wellness data
- `GET /api/wellness/history` - Get wellness history

### Chat

- `GET /api/chat/conversations` - Get all conversations
- `POST /api/chat/conversations` - Start a new conversation
- `GET /api/chat/conversations/:id` - Get conversation by ID
- `POST /api/chat/conversations/:id/messages` - Send a message

## Environment Variables

See `.env.example` for all available environment variables.

## Deployment

### Production

1. Set `NODE_ENV=production` in your environment
2. Ensure all required environment variables are set
3. Install production dependencies:
   ```bash
   npm install --production
   ```
4. Start the server:
   ```bash
   npm start
   ```

### Docker

```bash
docker build -t ai-companion-backend .
docker run -p 3001:3001 --env-file .env ai-companion-backend
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Linting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact the development team.
