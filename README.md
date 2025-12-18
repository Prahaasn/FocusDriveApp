# FocusDrive - AI-Powered Driver Safety System

> Complete end-to-end driver distraction detection and safety monitoring platform

[![React Native](https://img.shields.io/badge/React%20Native-0.72-61DAFB.svg)](https://reactnative.dev/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB.svg)](https://www.python.org/)
[![Raspberry Pi](https://img.shields.io/badge/Raspberry%20Pi-4-C51A4A.svg)](https://www.raspberrypi.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Components](#components)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Documentation](#documentation)

---

## 🎯 Overview

FocusDrive is a comprehensive driver safety monitoring system that combines **edge AI computing**, **real-time data streaming**, and **mobile analytics** to detect and report driver distractions.

### How It Works

1. **📹 Raspberry Pi Camera** captures live video of the driver
2. **🤖 AI Model** (running on Raspberry Pi) detects distraction events in real-time
3. **📡 Firebase Realtime Database** streams telemetry data to the mobile app
4. **📱 Mobile App** displays safety scores, alerts, and historical analytics
5. **💾 Supabase** stores session data for long-term reporting

### Key Goals

- ✅ **Real-time Detection**: Identify distractions as they happen (<500ms latency)
- ✅ **Privacy-First**: All computer vision runs on-device (Raspberry Pi)
- ✅ **Actionable Insights**: Clear safety scores and trend analysis
- ✅ **Production-Ready**: Scalable architecture, clean codebase, comprehensive documentation

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FocusDrive System                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  Raspberry Pi    │         │   Mobile App     │
│  (Edge Device)   │         │   (iOS/Android)  │
├──────────────────┤         ├──────────────────┤
│ • Camera Module  │         │ • React Native   │
│ • AI Model       │         │ • TypeScript     │
│ • Python Script  │────────▶│ • Navigation     │
│ • BLE Server     │   WiFi  │ • Charts/UI      │
└──────────────────┘         └──────────────────┘
         │                            │
         │                            │
         ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│    Firebase      │         │    Supabase      │
│ Realtime Database│         │   PostgreSQL     │
├──────────────────┤         ├──────────────────┤
│ • Live telemetry │         │ • Session history│
│ • Event stream   │         │ • User data      │
│ • Authentication │         │ • Reports/Stats  │
└──────────────────┘         └──────────────────┘
```

### Data Flow

1. **Edge Processing (Raspberry Pi)**
   - Camera captures video frames (30 FPS)
   - AI model processes each frame
   - Outputs: `{state, reason, confidence, timestamp}`

2. **Real-time Streaming (Firebase)**
   - Pi publishes telemetry events to Firebase
   - Mobile app subscribes to real-time updates
   - Updates UI instantly when distraction detected

3. **Persistent Storage (Supabase)**
   - Sessions saved with summary statistics
   - Historical data for trend analysis
   - User profiles and vehicle information

---

## 🔧 Components

### 1. Mobile App (`focusdrive-app/`)

**Platform:** iOS-first React Native (Expo)

**Key Features:**
- Authentication (email/password)
- Live safety dashboard with circular gauge
- Real-time distraction alerts
- Session management (start/stop tracking)
- Historical reports and analytics
- Profile and settings management

**Tech Stack:**
- React Native + Expo SDK 54
- TypeScript (strict mode)
- Zustand (state management)
- React Navigation v6
- Firebase (auth + realtime DB)
- Supabase (PostgreSQL)
- Victory Native (charts)

👉 **[Mobile App Documentation](focusdrive-app/README.md)**

---

### 2. Raspberry Pi Module *(Coming Soon)*

**Hardware:** Raspberry Pi 4 with Camera Module v2

**Key Features:**
- Real-time computer vision processing
- Driver state classification (ATTENTIVE/DISTRACTED)
- Distraction reason detection (PHONE, DROWSY, EYES_CLOSED, etc.)
- BLE peripheral for device pairing
- Firebase data publisher

**Tech Stack:**
- Python 3.8+
- OpenCV / MediaPipe
- TensorFlow Lite (edge AI)
- Firebase Admin SDK
- BLE library (bleak/bluepy)

---

### 3. Backend Services

**Firebase:**
- **Realtime Database**: Live telemetry streaming
- **Authentication**: User sign-up/sign-in
- **Cloud Functions**: Data processing triggers *(optional)*

**Supabase:**
- **PostgreSQL**: Session storage, user profiles, vehicle data
- **REST API**: CRUD operations
- **Row-Level Security**: Multi-tenant data isolation

---

## ✨ Features

### Mobile App Features

#### 🔐 Authentication
- Email/password sign up and sign in
- Secure token-based authentication
- Protected routes and session management

#### 📊 Live Dashboard
- **Real-time safety score** (0-100) with color-coded indicators
  - 🟢 Green (85-100): Low risk
  - 🟡 Yellow (70-84): Medium risk
  - 🔴 Red (0-69): High risk
- **Circular gauge** visualization
- **Current session status** (driving/idle)
- **Live distraction alerts** as they happen
- **Start/End session** controls

#### 📈 Reports & Analytics
- **Session history** with scores and durations
- **Detailed session breakdowns**:
  - Distraction frequency
  - Reason breakdown (pie/bar charts)
  - Timeline of events
- **Trend analysis** over days/weeks/months
- **Filter and search** functionality

#### 👤 Profile & Settings
- User profile management
- Vehicle information
- App preferences
- Account settings

---

### Raspberry Pi Features *(Planned)*

#### 🤖 AI Distraction Detection
- **Face detection** and landmark tracking
- **Eye gaze estimation**
- **Head pose analysis**
- **Phone usage detection**
- **Drowsiness detection** (yawning, eye closure)

#### 📡 Data Streaming
- Real-time telemetry publishing to Firebase
- Configurable update frequency (default: 1 Hz)
- Automatic reconnection on network loss

#### 🔗 Device Connectivity
- BLE advertisement as "FocusDrive"
- Pairing with mobile app
- Status indicators (LED/display)

---

## 🛠️ Tech Stack

### Mobile App
| Category | Technology |
|----------|-----------|
| **Framework** | React Native (Expo SDK 54) |
| **Language** | TypeScript 5.x |
| **State Management** | Zustand |
| **Navigation** | React Navigation v6 |
| **Backend (Auth + Realtime)** | Firebase |
| **Backend (Database)** | Supabase (PostgreSQL) |
| **Charts** | Victory Native |
| **Forms** | React Hook Form + Yup |
| **Animations** | React Native Reanimated |

### Raspberry Pi *(Planned)*
| Category | Technology |
|----------|-----------|
| **Language** | Python 3.8+ |
| **Computer Vision** | OpenCV, MediaPipe |
| **AI Framework** | TensorFlow Lite |
| **Backend** | Firebase Admin SDK |
| **BLE** | Bleak / Bluepy |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Firebase Realtime Database** | Live telemetry streaming |
| **Firebase Authentication** | User auth |
| **Supabase** | PostgreSQL database, REST API |
| **GitHub** | Version control |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **iOS Simulator** (Xcode on macOS) or physical iPhone
- **Expo Go** app (for device testing)
- **Git** for version control
- **Firebase account** (free tier)
- **Supabase account** (free tier)

### Quick Start - Mobile App

1. **Clone the repository**
   ```bash
   git clone https://github.com/Prahaasn/FocusDriveApp.git
   cd FocusDriveApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase and Supabase credentials
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on iOS**
   - Press `i` to open iOS simulator
   - Or scan QR code with Expo Go app on your iPhone

📖 **Detailed setup instructions**: See [focusdrive-app/README.md](focusdrive-app/README.md)

---

## 📁 Project Structure

```
Focus Drive App/
├── focusdrive-app/              # React Native mobile application
│   ├── src/
│   │   ├── screens/             # Screen components
│   │   │   ├── auth/            # Welcome, SignIn, SignUp
│   │   │   ├── dashboard/       # Live safety dashboard
│   │   │   ├── reports/         # Session history & details
│   │   │   └── profile/         # User profile & settings
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/              # Button, Card, Input, Charts
│   │   │   └── layout/          # Navigation, Header
│   │   ├── services/            # Backend integration
│   │   │   ├── firebase/        # Auth & Realtime DB
│   │   │   ├── supabase/        # PostgreSQL queries
│   │   │   └── api/             # API wrappers
│   │   ├── store/               # Zustand state stores
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Helper functions
│   │   │   ├── scoring.ts       # Safety score algorithm
│   │   │   ├── eventSegmentation.ts
│   │   │   ├── formatting.ts
│   │   │   └── validation.ts
│   │   ├── types/               # TypeScript definitions
│   │   ├── constants/           # Colors, config, theme
│   │   └── navigation/          # Navigation setup
│   ├── assets/                  # Images, fonts, icons
│   ├── __tests__/               # Unit tests
│   ├── .env.example             # Environment template
│   ├── package.json
│   ├── tsconfig.json
│   ├── babel.config.js
│   ├── README.md                # Mobile app documentation
│   ├── AGENT_COORDINATION.md    # Git workflow guide
│   └── AGENT_INSTRUCTIONS.md    # Development guide
│
├── raspberry-pi/                # Raspberry Pi module (TBD)
│   └── (Coming soon)
│
├── claude.md                    # Project specification
├── todo.md                      # Task tracking
├── PROJECT_SUMMARY.md           # Setup summary
└── README.md                    # This file
```

---

## 👥 Development Workflow

This project uses a **multi-agent parallel development** approach:

### Agent Assignments

7 specialized agents work on different parts of the mobile app simultaneously:

| Agent | Responsibility | Merge Order |
|-------|---------------|-------------|
| **AGENT_7** | Scoring Algorithm | 1st (foundation) |
| **AGENT_6** | Backend Services | 2nd |
| **AGENT_5** | UI Components | 3rd |
| **AGENT_1** | Authentication | 4th |
| **AGENT_2** | Dashboard | 5th |
| **AGENT_3** | Reports | 6th |
| **AGENT_4** | Profile | 7th (last) |

### Git Workflow

1. Each agent creates a branch: `agent-X/feature-name`
2. Works only on assigned files (no conflicts)
3. Commits and pushes to their branch
4. Merges to `main` in the specified order
5. Next agent pulls and continues

📖 **Full workflow details**: [focusdrive-app/AGENT_COORDINATION.md](focusdrive-app/AGENT_COORDINATION.md)

---

## 📚 Documentation

### Core Documentation
- **[Mobile App README](focusdrive-app/README.md)** - Setup, tech stack, architecture
- **[Agent Coordination Guide](focusdrive-app/AGENT_COORDINATION.md)** - Git workflow, merge strategy
- **[Agent Instructions](focusdrive-app/AGENT_INSTRUCTIONS.md)** - Detailed agent responsibilities
- **[Project Summary](PROJECT_SUMMARY.md)** - Quick start guide
- **[Project Specification](claude.md)** - Original requirements

### Design System
- **[Colors & Theme](focusdrive-app/src/constants/colors.ts)** - Dark mode color palette
- **[TypeScript Types](focusdrive-app/src/types/index.ts)** - Shared type definitions

### API Documentation
- **BLE Protocol** *(Coming soon)*
- **Firebase Schema** *(Coming soon)*
- **Supabase Schema** *(Coming soon)*

---

## 🎨 Design Philosophy

### User Experience
- **Privacy-First**: All video processing happens on-device (Raspberry Pi)
- **Real-time Feedback**: Instant alerts when distractions detected
- **Non-Intrusive**: Minimal driver interaction required
- **Actionable Insights**: Clear metrics and trends

### Technical Design
- **Edge Computing**: AI runs on Raspberry Pi, not cloud
- **Offline-First**: Core features work without internet
- **Scalable Architecture**: Clean separation of concerns
- **Type Safety**: Strict TypeScript, comprehensive types
- **Dark Theme**: Reduce eye strain, professional aesthetic

---

## 📊 Safety Score Algorithm

The safety score (0-100) is calculated based on:

1. **Session Duration** - Longer sessions = more data
2. **Distraction Events** - Frequency and duration
3. **Confidence Levels** - Higher confidence = bigger penalty
4. **Distraction Types** - Some distractions weighted more heavily

**Formula (simplified):**
```
Score = 100 - Σ(distraction_duration × confidence × severity_weight)
```

**Risk Levels:**
- **Low Risk** (85-100): Green, minimal distractions
- **Medium Risk** (70-84): Yellow, moderate concern
- **High Risk** (0-69): Red, significant distractions

📖 **Full algorithm**: [focusdrive-app/src/utils/scoring.ts](focusdrive-app/src/utils/scoring.ts)

---

## 🔒 Privacy & Security

- ✅ **No video stored**: Camera feed processed in real-time, never saved
- ✅ **Local AI**: Computer vision runs on Raspberry Pi, not cloud
- ✅ **Encrypted data**: All network traffic uses HTTPS/WSS
- ✅ **User control**: Users can delete their data anytime
- ✅ **Row-level security**: Supabase enforces multi-tenant isolation

---

## 🛣️ Roadmap

### ✅ Phase 1: MVP (Current)
- [x] Mobile app foundation setup
- [x] TypeScript types and design system
- [x] Firebase/Supabase integration structure
- [ ] UI components implementation
- [ ] Authentication flow
- [ ] Live dashboard
- [ ] Session management
- [ ] Reports screen

### 📅 Phase 2: Hardware Integration (Q1 2025)
- [ ] Raspberry Pi camera setup
- [ ] AI model training/optimization
- [ ] BLE communication protocol
- [ ] Edge deployment pipeline
- [ ] End-to-end testing

### 📅 Phase 3: Enhanced Analytics (Q2 2025)
- [ ] Advanced trend charts
- [ ] Distraction heatmaps
- [ ] Weekly/monthly summaries
- [ ] Goal setting and achievements
- [ ] Driver comparison (gamification)

### 📅 Phase 4: Expansion (Q3 2025)
- [ ] Android support
- [ ] Multi-vehicle support
- [ ] Fleet management features
- [ ] Insurance integration
- [ ] API for third-party apps

---

## 🤝 Contributing

This project is currently in active development with a structured multi-agent workflow.

**For Contributors:**
1. Read [AGENT_COORDINATION.md](focusdrive-app/AGENT_COORDINATION.md)
2. Choose an available agent role
3. Create your branch: `agent-X/feature-name`
4. Work only on assigned files
5. Submit PR when ready
6. Merge in designated order

---

## 📄 License

**Proprietary** - FocusDrive 2025

All rights reserved. This project is not open source and may not be reproduced, distributed, or modified without explicit permission.

---

## 📞 Contact & Support

- **Email**: support@focusdrive.com
- **GitHub**: [https://github.com/Prahaasn/FocusDriveApp](https://github.com/Prahaasn/FocusDriveApp)
- **Documentation**: See `/focusdrive-app/` README

---

## 🙏 Acknowledgments

- **React Native** & **Expo** teams for the amazing framework
- **Firebase** & **Supabase** for backend infrastructure
- **OpenCV** & **MediaPipe** for computer vision tools
- **Claude AI** for development assistance

---

<div align="center">

**Built with ❤️ for safer driving**

🚗 FocusDrive - Making Roads Safer, One Trip at a Time

</div>
