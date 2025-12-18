# FocusDrive Mobile App

> AI-powered driver safety monitoring system for iOS (React Native)

[![React Native](https://img.shields.io/badge/React%20Native-0.72-61DAFB.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.x-FFCA28.svg)](https://firebase.google.com/)

---

## 📱 Overview

FocusDrive is a mobile application that provides real-time driver safety monitoring and analytics. The app connects to a Raspberry Pi device that performs AI-powered distraction detection and streams telemetry data to the mobile app.

### Key Features

- **Real-time Safety Monitoring**: Live safety score (0-100) with visual indicators
- **Distraction Detection**: Track phone use, drowsiness, head position, and more
- **Session Management**: Start/stop driving sessions with automatic duration tracking
- **Historical Reports**: View past sessions with detailed analytics
- **Trend Analysis**: Charts showing safety score trends over time
- **Dark Mode UI**: Modern, eye-friendly interface designed for drivers

---

## 🏗️ Project Status

**Status:** 🚧 Under Active Development

This project is being built using a **parallel agent development** workflow. Multiple specialized AI agents are working simultaneously on different features.

See [AGENT_COORDINATION.md](./AGENT_COORDINATION.md) for the coordination strategy.

---

## 🛠️ Tech Stack

### Core
- **React Native** (via Expo) - Cross-platform mobile framework
- **TypeScript** - Type-safe JavaScript
- **Expo SDK 54** - Development framework and tooling

### State Management
- **Zustand** - Lightweight state management

### Backend Services
- **Firebase**
  - Authentication (email/password)
  - Realtime Database (live telemetry streaming)
- **Supabase**
  - PostgreSQL database (session storage)
  - RESTful API

### UI & Navigation
- **React Navigation v6** - Routing and navigation
- **React Native Reanimated** - Smooth animations
- **Victory Native** - Charts and data visualization
- **React Native SVG** - Custom graphics

### Forms & Validation
- **React Hook Form** - Form state management
- **Yup** - Schema validation

---

## 📂 Project Structure

```
focusdrive-app/
├── src/
│   ├── screens/          # Screen components
│   │   ├── auth/         # Welcome, SignIn, SignUp
│   │   ├── dashboard/    # Main dashboard
│   │   ├── reports/      # Session history & details
│   │   └── profile/      # User profile & settings
│   │
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Button, Card, Input, Charts
│   │   └── layout/       # Navigation, Header
│   │
│   ├── services/         # Backend integration
│   │   ├── firebase/     # Firebase auth & realtime DB
│   │   ├── supabase/     # Supabase queries & mutations
│   │   └── api/          # API service wrappers
│   │
│   ├── store/            # Zustand state stores
│   │   ├── authStore.ts
│   │   └── sessionStore.ts
│   │
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useSession.ts
│   │   └── useRealtimeScore.ts
│   │
│   ├── utils/            # Helper functions
│   │   ├── scoring.ts           # Safety score algorithm
│   │   ├── eventSegmentation.ts # Distraction event grouping
│   │   ├── formatting.ts
│   │   └── validation.ts
│   │
│   ├── types/            # TypeScript type definitions
│   ├── constants/        # App constants & theme
│   └── navigation/       # Navigation configuration
│
├── assets/               # Images, fonts, icons
├── __tests__/            # Unit tests
└── ...config files
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- iOS Simulator (Xcode on macOS) or physical iPhone
- Expo Go app (for testing on device)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd focusdrive-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your Firebase and Supabase credentials.

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on iOS**
   - Press `i` to open iOS simulator
   - Or scan QR code with Expo Go app on your iPhone

---

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password provider)
3. Create a Realtime Database
4. Copy your config to `.env`:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_DATABASE_URL=...
   ```

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the database migration (schema provided separately)
3. Copy your credentials to `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```

---

## 🎨 Design System

### Color Palette (Dark Mode)
- **Background**: `#0A0E1A` (dark navy)
- **Surface**: `#151B2E` (card backgrounds)
- **Success/Green**: `#00D68F` (safe driving, high scores)
- **Warning/Yellow**: `#FFAB00` (medium risk)
- **Danger/Red**: `#FF3366` (high risk, distractions)

### Typography
- **Headings**: Bold, white (`#FFFFFF`)
- **Body**: Regular, light gray (`#8F9BB3`)

### Components
All UI components are in `src/components/ui/` and follow the design system defined in `src/constants/colors.ts`.

---

## 📊 Data Flow

1. **Raspberry Pi** detects driver state via camera + AI model
2. **Pi streams telemetry** to Firebase Realtime Database:
   ```json
   {
     "state": "DISTRACTED",
     "reason": "PHONE",
     "confidence": 0.91,
     "timestamp": "2024-01-15T10:30:45Z"
   }
   ```
3. **Mobile app subscribes** to realtime updates via Firebase listener
4. **App calculates safety score** using scoring algorithm
5. **Session data persisted** to Supabase for historical reporting

---

## 🧪 Testing

Run unit tests:
```bash
npm test
```

Run TypeScript type checking:
```bash
npm run tsc
```

---

## 👥 Agent Assignments

This project uses a **multi-agent development** approach:

| Agent | Responsibility | Files |
|-------|---------------|-------|
| **AGENT_1** | Authentication | `src/screens/auth/*`, `src/store/authStore.ts` |
| **AGENT_2** | Dashboard & Sessions | `src/screens/dashboard/*`, `src/hooks/useSession.ts` |
| **AGENT_3** | Reports & History | `src/screens/reports/*` |
| **AGENT_4** | Profile & Settings | `src/screens/profile/*` |
| **AGENT_5** | UI Components | `src/components/*`, `src/navigation/*` |
| **AGENT_6** | Backend Services | `src/services/*` |
| **AGENT_7** | Scoring Algorithm | `src/utils/scoring.ts`, tests |

See [AGENT_COORDINATION.md](./AGENT_COORDINATION.md) for detailed workflow.

---

## 📋 Roadmap

### Phase 1: MVP (Current)
- [x] Project setup and structure
- [ ] Authentication screens
- [ ] Dashboard with live safety score
- [ ] Session management
- [ ] Historical reports
- [ ] Profile screen

### Phase 2: Enhanced Analytics
- [ ] Advanced trend charts
- [ ] Distraction heatmaps
- [ ] Weekly/monthly summaries
- [ ] Goal setting and achievements

### Phase 3: Social & Insights
- [ ] Driver leaderboards
- [ ] Share achievements
- [ ] Personalized safety tips
- [ ] Integration with insurance partners

---

## 📜 Scripts

```bash
# Start development server
npm start
# or
npx expo start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web

# Type checking
npm run tsc

# Lint code
npm run lint

# Run tests
npm test
```

---

## 🔐 Environment Variables

All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

See [.env.example](./.env.example) for the complete list.

---

## 📄 License

Proprietary - FocusDrive 2025

---

## 🤝 Contributing

This project follows the [AGENT_COORDINATION.md](./AGENT_COORDINATION.md) workflow. Each agent works on their assigned files in separate branches and merges in a specific order.

---

## 📞 Support

For questions or issues, contact: support@focusdrive.com

---

**Built with ❤️ by the FocusDrive Team**
