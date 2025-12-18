# Agent-Specific Instructions

Welcome! This project is being developed by 7 specialized AI agents working in parallel. Each agent has specific responsibilities and files to work on.

---

## 📚 Quick Links

- [Project README](./README.md) - Project overview and setup
- [Agent Coordination Guide](./AGENT_COORDINATION.md) - Git workflow and merge order
- [Type Definitions](./src/types/index.ts) - Shared TypeScript types
- [Design System](./src/constants/colors.ts) - Colors and theme

---

## 🤖 Agent Roster

### AGENT_1: Authentication & User Management

**Your Mission:** Build the authentication flow and user management system.

**Files You Own:**
- `src/screens/auth/WelcomeScreen.tsx`
- `src/screens/auth/SignInScreen.tsx`
- `src/screens/auth/SignUpScreen.tsx`
- `src/store/authStore.ts`
- `src/hooks/useAuth.ts`

**Key Deliverables:**
1. **WelcomeScreen**: App logo, "Get Started" button, "Sign In" link
2. **SignUpScreen**: Email/password form with validation, create account
3. **SignInScreen**: Email/password form, login functionality
4. **authStore**: Zustand store for auth state (user, loading, error)
5. **useAuth hook**: Custom hook for auth operations (signIn, signUp, signOut)

**Dependencies:**
- Firebase Auth service (from AGENT_6)
- UI components: Button, Input (from AGENT_5)

**Design Notes:**
- Use dark theme colors from `@constants`
- Form validation with react-hook-form + yup
- Show error messages on failed auth
- Navigate to MainTabs on successful auth

**Merge Order:** 4th (after AGENT_7, AGENT_6, AGENT_5)

---

### AGENT_2: Dashboard & Real-time Session Tracking

**Your Mission:** Build the main dashboard with live safety monitoring.

**Files You Own:**
- `src/screens/dashboard/DashboardScreen.tsx`
- `src/store/sessionStore.ts`
- `src/hooks/useSession.ts`
- `src/hooks/useRealtimeScore.ts`

**Key Deliverables:**
1. **DashboardScreen**:
   - Large circular gauge showing safety score (0-100)
   - Color-coded: Green (85+), Yellow (70-84), Red (<70)
   - Current session status (driving/idle)
   - Real-time distraction alerts
   - Start/End session buttons
2. **sessionStore**: Current session state, telemetry buffer
3. **useSession**: Hook for session management (start, end, current)
4. **useRealtimeScore**: Subscribe to Firebase realtime updates

**Dependencies:**
- Firebase Realtime Database (from AGENT_6)
- Scoring algorithm (from AGENT_7)
- CircularGauge component (from AGENT_5)

**Data Flow:**
1. Subscribe to Firebase `/telemetry/{userId}/{sessionId}`
2. Buffer incoming telemetry events
3. Calculate score using `calculateScore()` from AGENT_7
4. Update UI in real-time

**Merge Order:** 5th (after scoring, backend, UI components, auth)

---

### AGENT_3: Reports & Historical Data

**Your Mission:** Build session history and detailed reporting screens.

**Files You Own:**
- `src/screens/reports/ReportsScreen.tsx`
- `src/screens/reports/SessionDetailScreen.tsx`

**Key Deliverables:**
1. **ReportsScreen**:
   - List of past sessions (FlatList)
   - Each item shows: date, duration, safety score, risk level
   - Filter by date range
   - Sort by score/date
   - Navigate to SessionDetailScreen on tap
2. **SessionDetailScreen**:
   - Full session summary (score, duration, distraction count)
   - Distraction breakdown chart (pie/bar chart)
   - Timeline of distraction events
   - Share/export report button

**Dependencies:**
- Supabase sessions query (from AGENT_6)
- Chart component (from AGENT_5)
- Card component (from AGENT_5)

**Merge Order:** 6th

---

### AGENT_4: Profile & Settings

**Your Mission:** Build user profile and app settings screen.

**Files You Own:**
- `src/screens/profile/ProfileScreen.tsx`

**Key Deliverables:**
1. **ProfileScreen**:
   - User info display (name, email, photo)
   - Account settings section
   - Vehicle management (add/edit vehicles)
   - App preferences (notifications, units)
   - Logout button
   - About/Help section

**Dependencies:**
- Auth store (from AGENT_1)
- UI components (from AGENT_5)

**Merge Order:** 7th (last)

---

### AGENT_5: UI Components & Navigation

**Your Mission:** Build the design system and navigation structure.

**Files You Own:**
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/CircularGauge.tsx`
- `src/components/ui/Chart.tsx`
- `src/components/layout/TabNavigator.tsx`
- `src/components/layout/Header.tsx`
- `src/navigation/RootNavigator.tsx`

**Key Deliverables:**
1. **Button**: Primary/secondary variants, loading state, disabled state
2. **Card**: Container with shadow, dark background
3. **Input**: Text input with label, error message, validation state
4. **CircularGauge**: Animated circular progress indicator for safety score
5. **Chart**: Victory Native wrapper for trend charts
6. **TabNavigator**: Bottom tabs (Dashboard, Reports, Profile)
7. **Header**: Screen header with title, back button
8. **RootNavigator**: Auth stack vs Main tabs conditional rendering

**Design System:**
- Import colors from `@constants`
- Use React Native Reanimated for animations
- Consistent spacing (8, 16, 24, 32px)
- Dark theme throughout

**Merge Order:** 3rd (needed by all screen agents)

---

### AGENT_6: Backend Services Integration

**Your Mission:** Build the service layer for Firebase and Supabase.

**Files You Own:**
- `src/services/firebase/auth.ts`
- `src/services/firebase/realtime.ts`
- `src/services/firebase/config.ts`
- `src/services/supabase/client.ts`
- `src/services/supabase/queries.ts`
- `src/services/supabase/mutations.ts`
- `src/services/api/telemetry.ts`
- `src/services/api/sessions.ts`

**Key Deliverables:**

**Firebase:**
1. **config.ts**: Initialize Firebase with env vars
2. **auth.ts**: `signIn()`, `signUp()`, `signOut()`, `getCurrentUser()`
3. **realtime.ts**:
   - `subscribeTelemetry(userId, sessionId, callback)`
   - `unsubscribe()`
   - `writeTelemetryEvent()` (for testing)

**Supabase:**
1. **client.ts**: Initialize Supabase client
2. **queries.ts**:
   - `getSessionHistory(userId, limit, offset)`
   - `getSessionById(sessionId)`
   - `getSessionStats(userId)`
3. **mutations.ts**:
   - `createSession(session)`
   - `endSession(sessionId, summary)`
   - `saveDistractionEvent(event)`

**API:**
1. **telemetry.ts**: Wrappers for telemetry operations
2. **sessions.ts**: Wrappers for session CRUD

**Environment:**
Read from `process.env.EXPO_PUBLIC_*` variables

**Merge Order:** 2nd (after AGENT_7)

---

### AGENT_7: Scoring Logic & Event Processing

**Your Mission:** Implement the safety score algorithm and event segmentation.

**Files You Own:**
- `src/utils/scoring.ts`
- `src/utils/eventSegmentation.ts`
- `__tests__/scoring.test.ts`
- `__tests__/eventSegmentation.test.ts`

**Key Deliverables:**

**1. scoring.ts**
```typescript
export function calculateScore(
  telemetryEvents: TelemetryEvent[],
  durationSeconds: number
): number;
```
- Algorithm:
  - Start with 100 points
  - For each distraction event:
    - Deduct points based on duration and confidence
    - Longer distractions = bigger penalty
    - High confidence (>0.85) = full penalty
    - Medium confidence (0.70-0.85) = partial penalty
  - Final score clamped to [0, 100]

**2. eventSegmentation.ts**
```typescript
export function segmentDistractionEvents(
  telemetryEvents: TelemetryEvent[]
): DistractionEvent[];
```
- Group consecutive "DISTRACTED" states into single events
- Calculate duration, dominant reason, average confidence
- Ignore gaps < 2 seconds (treat as continuous)

**3. Tests**
- Unit tests for edge cases:
  - Empty events
  - All attentive
  - All distracted
  - Mixed states
  - Different confidence levels

**Merge Order:** 1st (foundation for everyone)

---

## 🔄 Workflow Summary

1. **Read your instructions** (this section)
2. **Read [AGENT_COORDINATION.md](./AGENT_COORDINATION.md)** for git workflow
3. **Create your branch**: `git checkout -b agent-X/feature-name`
4. **Implement your files** (work only in your assigned files)
5. **Test your code**: `npm run tsc` and `npx expo start`
6. **Commit and push**: `git push origin agent-X/feature-name`
7. **Wait for your merge turn** (see merge order)
8. **Merge to main** when it's your turn

---

## 💡 Tips

### Import Paths
Use TypeScript path aliases:
```typescript
import { COLORS } from '@constants';
import { User } from '@types';
import { Button } from '@components/ui/Button';
import { useAuth } from '@hooks/useAuth';
```

### Shared Types
All types are in `src/types/index.ts`. If you need to add a type, add it there with a comment:
```typescript
// [AGENT_2] Session store state
export interface SessionState {
  currentSession: DrivingSession | null;
  isActive: boolean;
}
```

### Dark Theme
Always use colors from `@constants/colors`:
```typescript
backgroundColor: COLORS.background
color: COLORS.textPrimary
borderColor: COLORS.border
```

### Error Handling
Show user-friendly error messages:
```typescript
try {
  await signIn(email, password);
} catch (error) {
  alert('Invalid email or password');
}
```

---

## ✅ Definition of Done

Before marking your work complete:

- [ ] All assigned files implemented
- [ ] TypeScript compiles: `npm run tsc` (no errors)
- [ ] App runs: `npx expo start` (no crashes)
- [ ] Your screens are visually complete (match dark theme)
- [ ] No console errors/warnings in your features
- [ ] Code has comments for complex logic
- [ ] Committed with clear messages
- [ ] Ready to merge in proper order

---

## 🆘 Common Issues

**Problem:** Import errors with `@` aliases
**Solution:** Restart Metro bundler: `npx expo start --clear`

**Problem:** Firebase not connecting
**Solution:** Check `.env` file exists and has correct credentials

**Problem:** Type errors from other agents' code
**Solution:** Wait for that agent to merge first, or use `any` temporarily

**Problem:** Merge conflict
**Solution:** Favor lower-numbered agent's code, update yours to integrate

---

**Good luck! Build something amazing! 🚀**
