# Command Dashboard

A production-grade, personal life management dashboard hosted at command.edwardwhitehead.dev. This system serves as the central hub for managing life, health, AI insights, personal goals, Violt development, and more.

## Features

- **Daily Planner & Review**: Morning focus prompts and evening reflection
- **Tasks & Goals**: Task management with priority levels and goal tracking
- **Health Tracker**: Monitor health metrics, symptoms, and medications
- **Journal**: Emotion and thought journaling with AI sentiment analysis
- **Violt Developer Panel**: Track development progress for Violt projects
- **Bullet Journal**: Flexible note-taking and task tracking
- **Echo CLI Integration**: Command-line interface for dashboard interaction
- **AI Insights**: Gemini-powered analysis and recommendations
- **Reminders & Exports**: Schedule notifications and export data

## Tech Stack

- **Frontend**: Next.js 15 (App Router, TypeScript)
- **UI Library**: Mantine UI
- **State Management**: Zustand
- **Authentication**: Firebase Auth
- **Data Storage**: MongoDB Atlas
- **AI Engine**: Gemini API
- **Hosting**: Firebase Hosting
- **CI/CD**: GitHub Actions
- **Containerization**: Docker

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- MongoDB Atlas account
- Firebase account
- Gemini API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/personal-dashboard.git
   cd personal-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on `.env.local.example`:
   ```
   MONGODB_URI=your_mongodb_uri
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

### Automated Deployment

The project is configured with GitHub Actions for CI/CD. Simply push to the main branch, and the pipeline will:

1. Build and test the application
2. Create a Docker image
3. Deploy to Firebase Hosting

## Docker

To run the application using Docker:

1. Build the Docker image:
   ```bash
   docker build -t command-dashboard .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 --env-file .env.local command-dashboard
   ```

## Voice Input Support

The dashboard includes comprehensive voice input support:

- Voice-to-text for journal entries and notes
- Voice commands for navigation
- Voice control for task management

To use voice commands, click the microphone icon in the bottom right corner of any page.

## Project Structure

```
/personal-dashboard/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Dashboard modules
│   │   ├── daily/          # Daily planner
│   │   ├── tasks/          # Tasks & goals
│   │   ├── health/         # Health tracker
│   │   ├── journal/        # Journal
│   │   ├── violt/          # Violt developer panel
│   │   ├── bullet/         # Bullet journal
│   │   ├── echo/           # Echo CLI
│   │   ├── ai/             # AI insights
│   │   └── reminders/      # Reminders & exports
│   └── auth/               # Authentication pages
├── components/             # Reusable components
├── lib/                    # Utilities and helpers
│   ├── firebase.ts         # Firebase configuration
│   ├── mongodb.ts          # MongoDB connection
│   ├── gemini.ts           # Gemini API integration
│   ├── store.ts            # Zustand state management
│   ├── hooks.ts            # Custom React hooks
│   └── voice.ts            # Voice recognition utilities
├── types/                  # TypeScript type definitions
├── public/                 # Static assets
├── styles/                 # Global styles
├── .github/workflows/      # GitHub Actions CI/CD
├── .env.local.example      # Environment variables template
├── firebase.json           # Firebase configuration
├── next.config.js          # Next.js configuration
└── package.json            # Project dependencies
```

## Testing

Run the test suite:

```bash
npm test
```

## Security

The application implements several security measures:

- Environment variables for sensitive credentials
- Server-side API routes for secure Gemini access
- Firebase Authentication for user management
- Input validation and sanitization
- Secure HTTP headers in Firebase hosting

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Mantine UI for the component library
- Next.js team for the framework
- Firebase and MongoDB for backend services
- Gemini for AI capabilities
