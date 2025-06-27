# Mood Tracking Feature

This feature allows users to track their daily mood and view their mood history through an interactive dashboard.

## Features

- **Mood Tracking**: Users can log their current mood on a scale of 1-5
- **Mood History**: Visual timeline of mood entries with a chart
- **Notes**: Optional notes can be added to mood entries
- **Responsive Design**: Works on both mobile and desktop devices

## Setup

1. Make sure you have the required environment variables set up in your `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

2. Install the required dependencies:

```bash
npm install chart.js react-chartjs-2 date-fns
```

3. Deploy the Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

## Components

- **MoodTracker.jsx**: Main component for logging moods
- **MoodHistory.jsx**: Displays mood trends and history
- **useMoodTracking.js**: Custom hook for mood tracking logic
- **dateUtils.js**: Utility functions for date formatting

## Data Structure

### Mood Entry

```typescript
interface MoodEntry {
  id: string;
  userId: string;
  mood: number; // 1-5
  notes?: string;
  timestamp: Date;
}
```

## Security Rules

Security rules are defined in `firestore.rules` to ensure users can only access their own mood entries.

## Styling

Uses Tailwind CSS for styling with the following color scheme:

- Primary: `#00ADB5` (teal)
- Background: `#222831` (dark gray)
- Surface: `#393E46` (lighter gray)
- Text: `#EEEEEE` (off-white)

## Future Enhancements

- Mood insights and patterns
- Mood triggers tracking
- Export mood data
- Set mood goals and reminders
