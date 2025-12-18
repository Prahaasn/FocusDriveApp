# Agent Coordination Guide

## Parallel Development Workflow

Multiple Claude agents will work on this project simultaneously. Follow these rules to avoid conflicts and ensure smooth integration.

---

## 🎯 Agent Assignments

### AGENT_1: Authentication & User Management
**Files to Work On:**
- `src/screens/auth/` (WelcomeScreen, SignInScreen, SignUpScreen)
- `src/store/authStore.ts`
- `src/hooks/useAuth.ts`

**Responsibilities:**
- Welcome screen with app branding
- Sign in/sign up forms with validation
- Firebase authentication integration
- Auth state management with Zustand
- Protected route logic

---

### AGENT_2: Dashboard & Real-time Session Tracking
**Files to Work On:**
- `src/screens/dashboard/DashboardScreen.tsx`
- `src/store/sessionStore.ts`
- `src/hooks/useSession.ts`
- `src/hooks/useRealtimeScore.ts`

**Responsibilities:**
- Live safety score display (circular gauge)
- Current session status
- Real-time distraction alerts
- Session start/end controls
- Firebase Realtime Database integration for live telemetry

---

### AGENT_3: Reports & Historical Data
**Files to Work On:**
- `src/screens/reports/ReportsScreen.tsx`
- `src/screens/reports/SessionDetailScreen.tsx`

**Responsibilities:**
- Session history list
- Detailed session reports
- Trend charts (safety score over time)
- Distraction breakdown visualization
- Filter/search functionality

---

### AGENT_4: Profile & Settings
**Files to Work On:**
- `src/screens/profile/ProfileScreen.tsx`

**Responsibilities:**
- User profile display
- Account settings
- Vehicle management
- App preferences
- Logout functionality

---

### AGENT_5: UI Components & Navigation
**Files to Work On:**
- `src/components/ui/` (all components)
- `src/components/layout/` (navigation, header)
- `src/navigation/RootNavigator.tsx`

**Responsibilities:**
- Reusable Button, Card, Input components
- CircularGauge for safety score
- Chart component for trends
- Tab navigator (Dashboard, Reports, Profile)
- Root navigation setup (Auth stack vs Main tabs)

---

### AGENT_6: Backend Services Integration
**Files to Work On:**
- `src/services/firebase/` (auth, realtime, config)
- `src/services/supabase/` (client, queries, mutations)
- `src/services/api/` (telemetry, sessions)

**Responsibilities:**
- Firebase SDK configuration
- Supabase client setup
- Authentication service layer
- Realtime database listeners
- CRUD operations for sessions
- API wrappers for cloud functions

---

### AGENT_7: Scoring Logic & Event Processing
**Files to Work On:**
- `src/utils/scoring.ts`
- `src/utils/eventSegmentation.ts`
- `__tests__/scoring.test.ts`
- `__tests__/eventSegmentation.test.ts`

**Responsibilities:**
- Safety score calculation algorithm
- Event segmentation (group consecutive distracted states)
- Distraction duration calculation
- Confidence weighting
- Comprehensive unit tests

---

## 📋 Git Workflow

### 1. Before Starting
Always pull the latest changes:
```bash
git pull origin main
```

### 2. Create Your Feature Branch
Use the naming convention: `agent-X/feature-name`

Examples:
```bash
git checkout -b agent-1/auth-screens
git checkout -b agent-2/dashboard-screen
git checkout -b agent-5/ui-components
```

### 3. Work ONLY in Your Assigned Files
- Check the agent assignments above
- If you need to modify shared files (like `src/types/index.ts`), add a comment with your agent number:
  ```typescript
  // [AGENT_2] Added Session type
  export interface Session { ... }
  ```

### 4. Commit Frequently
Make small, focused commits:
```bash
git add src/screens/dashboard/
git commit -m "feat(dashboard): add circular safety score gauge"
git commit -m "feat(dashboard): integrate realtime score updates"
```

### 5. Push Your Branch
```bash
git push origin agent-2/dashboard-screen
```

### 6. Merge Order (IMPORTANT!)
Agents must merge in this specific order to minimize conflicts:

**Phase 1: Foundation**
1. **AGENT_7** (Scoring Logic) - Merge first
2. **AGENT_6** (Backend Services) - Depends on types

**Phase 2: Components**
3. **AGENT_5** (UI Components) - Shared components used by all screens

**Phase 3: Features**
4. **AGENT_1** (Auth) - Entry point, must be available before main app
5. **AGENT_2** (Dashboard) - Core feature
6. **AGENT_3** (Reports) - Uses scoring logic and UI components
7. **AGENT_4** (Profile) - Final polish

### 7. Merging Protocol
When it's your turn to merge:
```bash
# Pull latest main
git checkout main
git pull origin main

# Merge your branch
git merge agent-X/your-feature

# Resolve any conflicts
# - If conflict with shared files, favor lower-numbered agent's code
# - Update your code to work with existing implementations

# Test that everything compiles
npm run tsc

# Push to main
git push origin main
```

---

## 🔄 Handling Conflicts

### Shared Files
These files may be edited by multiple agents:
- `src/types/index.ts` - Add your types with comments
- `src/constants/index.ts` - Add your constants with comments
- `src/store/index.ts` - Export your stores

**Rule:** Always add, never remove. Comment your additions.

### Merge Conflict Resolution
If two agents edited the same file:
1. The **lower-numbered agent wins** by default
2. The higher-numbered agent updates their code to integrate

Example:
- AGENT_2 and AGENT_5 both edited `src/types/index.ts`
- AGENT_5 merges second
- AGENT_5 keeps AGENT_2's changes and adds theirs below

---

## 🧪 Testing Before Merge

Each agent must verify:
1. **Code compiles**: `npm run tsc`
2. **App runs**: `npx expo start`
3. **No console errors** in their screens/features
4. **Clean commit history** (no debug logs, no commented-out code)

---

## 📢 Communication via Git

Use commit messages to signal to other agents:

```bash
# Signal completion
git commit -m "feat(auth): ✅ useAuth hook complete - AGENT_2 can now use"

# Signal dependencies
git commit -m "feat(types): add Session type - ALL_AGENTS can import"

# Signal breaking changes
git commit -m "refactor(scoring): BREAKING - changed calculateScore signature"
```

---

## 🚀 Development Timeline

**Week 1:**
- AGENT_7: Complete scoring algorithm
- AGENT_6: Set up Firebase/Supabase
- AGENT_5: Build UI component library

**Week 2:**
- AGENT_1: Auth screens
- AGENT_2: Dashboard screen
- AGENT_3: Reports screens
- AGENT_4: Profile screen

**Week 3:**
- Integration testing
- Bug fixes
- Polish

---

## 🎨 Shared Design System

All agents must follow the design system:

### Colors
Import from `@constants`:
```typescript
import { COLORS, getRiskColor, getRiskLevel } from '@constants';
```

### Typography
```typescript
const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
```

### Spacing
Use multiples of 8:
- Small: 8px
- Medium: 16px
- Large: 24px
- XLarge: 32px

---

## ⚠️ Important Rules

1. **DO NOT** edit files assigned to other agents
2. **DO NOT** merge out of order
3. **DO NOT** push directly to `main` (use branches)
4. **DO** test your code before pushing
5. **DO** write clear commit messages
6. **DO** resolve conflicts by favoring lower-numbered agents
7. **DO** add comments when editing shared files

---

## 📦 Dependencies

If you need to install a new package:
1. Check if it's already in `package.json`
2. If not, install it: `npm install package-name`
3. Commit the `package.json` and `package-lock.json`:
   ```bash
   git add package.json package-lock.json
   git commit -m "chore(deps): add package-name for [feature]"
   ```
4. Notify other agents via commit message

---

## 🎯 Success Criteria

Before marking your agent's work as complete:

- [ ] All assigned files implemented
- [ ] TypeScript compiles with no errors
- [ ] App runs without crashes
- [ ] Features are visually polished (dark theme, proper spacing)
- [ ] No console warnings/errors
- [ ] Code is commented where necessary
- [ ] Committed and pushed to your branch
- [ ] Ready for merge in proper order

---

## 📞 Questions?

If you're blocked or need clarification:
1. Check this document first
2. Check `AGENT_INSTRUCTIONS.md` for your specific instructions
3. Check the project README
4. Add a TODO comment in code and move forward

**Good luck! 🚀**
