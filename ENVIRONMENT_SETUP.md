# Environment Variables Setup Guide

This guide explains how to securely configure API keys and environment variables for the AI Companion application.

## 🔐 Security Overview

All API keys and sensitive configuration data are stored in `.env` files which are **excluded from version control** to prevent accidental exposure.

## 📁 Environment Files Structure

```
AI-COMPANION/
├── frontend/.env              # Frontend environment variables
├── frontend/.env.example      # Frontend example template
├── backend/.env              # Backend environment variables
├── backend/.env.example      # Backend example template
└── .gitignore               # Ensures .env files are not committed
```

## 🚀 Quick Setup

### 1. Frontend Environment Setup

Copy the example file and configure your API keys:

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` and add your actual API keys:

```env
# Azure TTS Configuration
VITE_AZURE_TTS_KEY=your_actual_azure_tts_key_here
VITE_AZURE_TTS_REGION=eastus

# Firebase Configuration  
VITE_FIREBASE_API_KEY=your_actual_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... (see .env.example for all required variables)
```

### 2. Backend Environment Setup

The backend `.env` is already configured for local development. Modify as needed:

```bash
cd backend
# Review and update backend/.env if needed
```

## 🔑 Required API Keys

### Azure Text-to-Speech (TTS)
- **Purpose**: High-quality neural voice synthesis for the AI avatar
- **Required Variables**: 
  - `VITE_AZURE_TTS_KEY`: Your Azure Cognitive Services subscription key
  - `VITE_AZURE_TTS_REGION`: Azure region (e.g., 'eastus')
- **How to get**: Create an Azure Cognitive Services resource

### Firebase
- **Purpose**: Authentication and database services
- **Required Variables**: All Firebase config values (see `.env.example`)
- **How to get**: Create a Firebase project and web app

## ⚠️ Important Security Notes

1. **Never commit `.env` files** - They're excluded by `.gitignore`
2. **Use different API keys** for development/production
3. **Rotate API keys regularly** for security
4. **Keep `.env.example` updated** when adding new variables
5. **Validate environment variables** - The app will show console errors if keys are missing

## 🔍 Environment Variable Validation

The application automatically validates that required environment variables are loaded:

- **Frontend**: Check browser console for missing configuration errors
- **Backend**: Check server logs for configuration validation messages

## 🔄 Environment Updates

When adding new environment variables:

1. Add to the appropriate `.env` file
2. Update the corresponding `.env.example` file
3. Add validation in the relevant service/config file
4. Update this documentation

## 🚨 Troubleshooting

### Common Issues:

1. **"Configuration missing" errors**: Check that your `.env` file exists and contains all required variables
2. **API calls failing**: Verify your API keys are valid and have proper permissions
3. **Build errors**: Ensure all `VITE_` prefixed variables are properly named

### Debug Steps:

1. Check browser console for validation errors
2. Verify `.env` file exists in the correct location
3. Confirm all required variables are present
4. Test API keys manually if needed

## 📝 Example Configuration

See the `.env.example` files in both `frontend/` and `backend/` directories for complete configuration templates.
