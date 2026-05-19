# Catalyst Student Portal — Developer Documentation

> **Keep this file updated.** Every time a new page, component, or system is added, add a section here. This is the single source of truth for new developers.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Getting Started](#3-getting-started)
4. [Folder Structure](#4-folder-structure)
5. [Architecture at a Glance](#5-architecture-at-a-glance)
6. [Design System](#6-design-system)
7. [Auth System](#7-auth-system)
8. [Routing System](#8-routing-system)
9. [API Layer](#9-api-layer)
10. [Socket (Real-time)](#10-socket-real-time)
11. [Pages Reference](#11-pages-reference)
12. [Component Library](#12-component-library)
13. [How Data Flows](#13-how-data-flows)
14. [Common Patterns](#14-common-patterns)
15. [How to Add Things](#15-how-to-add-things)
16. [Branch History & What Changed](#16-branch-history--what-changed)

---

## 1. Project Overview

Catalyst Student Portal is a **React single-page application** for SAT students. After logging in, a student can:

- View their progress on the **Dashboard**
- Take **Diagnostic, Practice, and Mock SAT tests** (fully adaptive, timed, with a calculator)
- Review **detailed score reports** with AI-generated feedback and SVG charts
- **Chat** with their assigned mentor in real-time
- Manage their **Profile**

There is also a **Guest mode** — a free trial account with access to one diagnostic test only. Guests cannot access Chat.

The app talks to a backend REST API (`/api`) and a Socket.IO server for real-time chat.

---

## 2. Tech Stack

| What | Tool | Why |
|------|------|-----|
| UI Framework | **React 19** | Component-based, hooks |
| Build Tool | **Vite 8** | Fast dev server, fast builds |
| Routing | **React Router DOM v7** | File-level routing via `<Routes>` |
| Styling | **Tailwind CSS v3** | Utility-first, consistent spacing |
| Icons | **Lucide React** | Clean SVG icon set |
| Avatars | **boring-avatars** | Deterministic colourful avatars |
| Math Rendering | **KaTeX** | LaTeX math in SAT questions |
| Math Engine | **mathjs** | In-browser scientific calculator |
| Real-time | **Socket.IO Client** | Chat between student ↔ mentor |
| Emoji Picker | **emoji-picker-react** | Chat attachment picker |

No CSS-in-JS, no Redux, no GraphQL. Keep it simple.

---

## 3. Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Create environment file (copy from example if one exists)
#    Two variables are needed:
#    VITE_API_URL   - backend REST URL, e.g. http://localhost:8000/api
#    VITE_SOCKET_URL - Socket.IO server URL, e.g. http://localhost:8000

# 3. Start dev server
npm run dev

# 4. Build for production
npm run build

# 5. Preview production build locally
npm run preview
```

The app is served from the `/catalyst_student` base path (set in `main.jsx` via `basename`). In development Vite serves from `http://localhost:5173/catalyst_student`.

**To verify a build is clean** (no broken imports, no TypeScript-style errors) run:
```bash
npx vite build --mode development
```
You should see `✓ built in X.XXs`. If it fails there is a real import error somewhere.

---

## 4. Folder Structure

```
src/
├── main.jsx                  # App entry point — mounts React, wraps BrowserRouter + AuthProvider
├── App.jsx                   # Route definitions (all routes live here)
├── index.css                 # Global CSS: Tailwind base + reusable class utilities (.btn, .card, .page-content)
│
├── theme/
│   └── tokens.js             # ★ Single source of truth for ALL design tokens (colors, gradients, mastery levels)
│
├── utils/
│   ├── colorMapping.js       # Re-exports getMasteryLevel, CHART_PALETTE, MASTERY_CHART_COLORS from tokens
│   └── formatters.js         # formatTime(ts), formatDate(ts), formatBytes(bytes)
│
├── context/
│   └── AuthContext.jsx       # Global auth state (student object, login, logout, isGuest)
│
├── routes/
│   ├── ProtectedRoute.jsx    # Redirects to / if not logged in
│   ├── PublicOnlyRoute.jsx   # Redirects to /dashboard if already logged in
│   └── GuestBlockedRoute.jsx # Redirects guests to /dashboard
│
├── services/
│   ├── api.js                # All HTTP calls (authService, studentService, satService, chatService)
│   └── socket.js             # Socket.IO singleton (connectSocket, disconnectSocket, getSocket)
│
├── assets/
│   ├── catalyst-logo.png     # Logo shown in sidebar header
│   └── hero.png              # Used on sign-in page
│
├── components/
│   ├── auth/
│   │   └── SignIn.jsx        # Login form (email + password, guest signup)
│   │
│   ├── layout/
│   │   ├── Layout.jsx        # Shell: sidebar + top bar + <Outlet /> (page content goes here)
│   │   └── Sidebar.jsx       # Left nav on desktop (≥700px), bottom tab bar on mobile (<700px)
│   │
│   ├── common/               # Small reusable display components
│   │   ├── Badge.jsx         # Coloured pill badge
│   │   ├── EmptyState.jsx    # Empty list placeholder (icon + text)
│   │   ├── MathContent.jsx   # Renders SAT question HTML with KaTeX math
│   │   ├── Modal.jsx         # Generic overlay modal wrapper
│   │   └── StatCard.jsx      # Small stat number card
│   │
│   ├── ui/                   # Core UI primitives (the "design system" layer)
│   │   ├── Button.jsx        # <Button variant="primary|outline|danger|success" size="sm">
│   │   ├── Card.jsx          # <Card>, <CardHeader>, <CardTitle>
│   │   ├── ProgressRing.jsx  # SVG circular progress ring
│   │   └── index.js          # Barrel: export all ui components from one import
│   │
│   └── test/                 # SAT test-taking UI components
│       ├── SATDivider.jsx    # Colourful 9-segment horizontal divider
│       ├── TestTopBar.jsx    # Top bar during a test (section name, timer, calculator toggle, submit)
│       ├── TestBottomBar.jsx # Bottom bar during a test (back/next, question counter)
│       ├── QuestionView.jsx  # Single question + answer choices + bookmark
│       ├── SplitContentArea.jsx # Split or full-screen passage + question layout
│       ├── NotesModal.jsx    # Per-question sticky notes overlay
│       ├── QuestionPicker.jsx# Question grid picker (jump to any question)
│       └── index.js          # Barrel: export all test components
│
├── pages/
│   ├── Dashboard/
│   │   ├── Dashboard.jsx     # Main dashboard page
│   │   ├── TestCard.jsx      # Card for Diagnostic / Practice / Mock (shows progress ring)
│   │   └── OverallRing.jsx   # Animated SVG ring with indigo-purple gradient
│   │
│   ├── SATTests/
│   │   └── SATTests.jsx      # Tabbed test page: list view + full test-taking flow
│   │
│   ├── Assignments/          # Score reports and test infrastructure
│   │   ├── Assignments.jsx   # Assignment list page
│   │   ├── StudentReportModal.jsx  # ★ Orchestrator: score report modal (tabs, section nav)
│   │   ├── reportUtils.js          # Pure functions: computeTopicMastery, generateAISummary, downloadReport
│   │   ├── ReportCharts.jsx        # SVG chart components (column, pie, line) + TopicCharts wrapper
│   │   ├── AISummaryView.jsx       # AI feedback cards (strengths, focus areas, next steps)
│   │   ├── QuestionReview.jsx      # Per-question answer/explanation review
│   │   ├── testConstants.js        # SAT test design tokens (C object) + formatTime(secs)
│   │   ├── TestSharedComponents.jsx # Backward-compat re-export barrel → src/components/test/
│   │   ├── Calculator.jsx          # In-browser scientific calculator (mathjs)
│   │   ├── DesmosCalculator.jsx    # Desmos graphing calculator embed
│   │   └── MathReferencesPanel.jsx # SAT math reference sheet panel
│   │
│   ├── Communication/
│   │   ├── Communication.jsx # Full chat page (conversation list + message thread)
│   │   └── MessageContent.jsx# Renders chat messages (text, images [IMG:…], files [FILE:…])
│   │
│   ├── Profile/
│   │   └── Profile.jsx       # View/edit student name, batch details, mentor info
│   │
│   ├── Sessions/
│   │   └── Sessions.jsx      # Scheduled sessions list (view upcoming mentor sessions)
│   │
│   ├── Slots/
│   │   └── Slots.jsx         # Book a slot with the mentor
│   │
│   └── NotFound/
│       └── NotFound.jsx      # 404 page
│
└── data/
    └── mockData.js           # Static fallback data (used during development/offline)
```

---

## 5. Architecture at a Glance

```
Browser
  │
  └─► main.jsx
        ├── BrowserRouter (basename: /catalyst_student)
        └── AuthProvider (global auth state)
              └── App.jsx
                    ├── PublicOnlyRoute  ──► SignIn
                    └── ProtectedRoute
                          └── Layout (Sidebar + TopBar + Outlet)
                                ├── /dashboard        → Dashboard
                                ├── /sat/diagnostic   → SATTests (tab=diagnostic)
                                ├── /sat/practice     → SATTests (tab=practice)
                                ├── /sat/mock         → SATTests (tab=mock)
                                ├── /profile          → Profile
                                └── GuestBlockedRoute
                                      └── /communication → Communication
```

**Key rule:** `App.jsx` owns ALL routes. Never create routes inside a page component. If you need a new page, add it here.

---

## 6. Design System

### 6.1 Token File — `src/theme/tokens.js`

This is the **single source of truth** for every colour and visual constant. If you need a colour, check here first — do not hardcode hex values unless they are very component-specific.

```
brand          → primary (#4f46e5 indigo), secondary (#7c3aed violet), accent (#80AF81 SAT green)
status         → success / warning / error / info — each has DEFAULT, bg, border, dark variants
surface        → SAT test screen colours (light grey bg, white cards, borders)
neutral        → Slate palette 50–900
gradients      → Named gradients (primary, darkHeader, deepDark, diagnostic, practice, mock…)
masteryLevels  → Array of {min, label, color, bg, bar} — MASTER/ELITE/EXPERT/ADVANCED/INTERMEDIATE/NOVICE
getMasteryLevel(pct) → Returns the matching level object for a score percentage
chartPalette   → 6 colours for column/line charts
masteryChartColors → Maps mastery label → chart colour
subjects       → rw and math subject configs (icon, accent colour, bg)
dashboardCards → Config for the 3 dashboard test type cards
```

### 6.2 CSS Classes — `src/index.css`

Reusable classes defined with `@layer components` so Tailwind knows about them:

| Class | What it does |
|-------|--------------|
| `.btn` | Base button styles (flex, padding, rounded, font) |
| `.btn-primary` | Indigo→violet gradient button |
| `.btn-outline` | Transparent with indigo border |
| `.btn-sm` | Smaller button padding |
| `.btn-danger` | Red tinted button |
| `.btn-success` | Green tinted button |
| `.card` | White rounded card with border + shadow |
| `.card-header` | Flex row, space-between, bottom margin |
| `.card-title` | Bold text with icon gap |
| `.page-content` | Standard page padding (`p-7`) |

### 6.3 UI Component Usage

Always use these instead of raw HTML elements for consistency:

```jsx
import { Button, Card, CardHeader, CardTitle, ProgressRing } from '../../components/ui';

// Button
<Button variant="primary" onClick={handleSave}>Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="danger" loading={isDeleting}>Delete</Button>

// Card
<Card>
  <CardHeader>
    <CardTitle><SomeIcon size={18} /> Section Title</CardTitle>
    <Button size="sm">Action</Button>
  </CardHeader>
  {/* content */}
</Card>

// ProgressRing (generic SVG ring)
<ProgressRing pct={75} size={72} stroke={7} color="#4f46e5" />
```

### 6.4 Mastery Levels

When you need to colour-code a score percentage (topics, charts, badges), use:

```js
import { getMasteryLevel } from '../../utils/colorMapping';

const mastery = getMasteryLevel(78); // → { label: 'ELITE', color: '#0891b2', bg: '#cffafe', bar: '#06b6d4' }
```

Levels: MASTER (≥85%) · ELITE (≥70%) · EXPERT (≥55%) · ADVANCED (≥40%) · INTERMEDIATE (≥25%) · NOVICE (<25%)

---

## 7. Auth System

**File:** `src/context/AuthContext.jsx`

The context provides:

```js
const { student, loading, isGuest, login, logout, updateStudent } = useAuth();
```

| Value | Type | Description |
|-------|------|-------------|
| `student` | object \| null | Full student object (null if not logged in) |
| `loading` | boolean | True while checking session on startup |
| `isGuest` | boolean | True if `student.role === 'guest'` |
| `login(data)` | fn | Called after successful sign-in — sets student state |
| `logout()` | fn | Calls `/auth/logout`, clears student state |
| `updateStudent(partial)` | fn | Merges partial update into student (preserves mentors) |

**`student` object shape** (after login):
```js
{
  _id, name, email, role,          // from /auth/me
  mentors: [{ mentor, batch }],    // from /students/:id/mentor
  mentor:  mentors[0]?.mentor,     // convenience shortcut
  batchInfo: mentors[0]?.batch,    // convenience shortcut
}
```

**On startup**, `AuthContext` calls `authService.me()` automatically. If the httpOnly session cookie is valid, the student is restored without a login page.

---

## 8. Routing System

**File:** `src/App.jsx`

Three custom route wrappers protect access:

| Component | Guards |
|-----------|--------|
| `ProtectedRoute` | Requires `student != null` → else redirect to `/` |
| `PublicOnlyRoute` | Requires `student == null` → else redirect to `/dashboard` |
| `GuestBlockedRoute` | Requires `!isGuest` → else redirect to `/dashboard` |

All protected routes share the `<Layout>` component as their parent so they all get the sidebar + top bar.

**Current routes:**

| Path | Component | Access |
|------|-----------|--------|
| `/` | `SignIn` | Public only |
| `/dashboard` | `Dashboard` | Authenticated |
| `/sat/diagnostic` | `SATTests` (tab=diagnostic) | Authenticated |
| `/sat/practice` | `SATTests` (tab=practice) | Authenticated |
| `/sat/mock` | `SATTests` (tab=mock) | Authenticated |
| `/profile` | `Profile` | Authenticated |
| `/communication` | `Communication` | Authenticated + Non-guest |
| `*` | `NotFound` | Any |

---

## 9. API Layer

**File:** `src/services/api.js`

All HTTP calls go through a single `req()` helper that:
- Prepends `VITE_API_URL` (defaults to `/api`)
- Sends `credentials: 'include'` (so the httpOnly session cookie is attached automatically)
- Throws on non-2xx responses

**Four service objects:**

### `authService`
```js
authService.login(email, password)   // POST /auth/login
authService.guestSignup(payload)     // POST /auth/guest-signup
authService.logout()                 // POST /auth/logout
authService.me()                     // GET  /auth/me
authService.updateName(name)         // PUT  /auth/me
```

### `studentService`
```js
studentService.getAll()              // GET  /students
studentService.getById(id)           // GET  /students/:id
studentService.getMentor(id)         // GET  /students/:id/mentor
studentService.create(payload)       // POST /students
studentService.update(id, payload)   // PUT  /students/:id
studentService.remove(id)            // DELETE /students/:id
```

### `satService`
```js
// Config
satService.listExamConfigs()                        // GET  /sat/test/configs
satService.listPractice()                           // GET  /sat/test/practice
satService.getHistory()                             // GET  /sat/test/history
satService.getPracticeHistory()                     // GET  /sat/test/practice/history
satService.getMyAssignments(studentId)              // GET  /sat/test/assignments?studentId=…

// Full test flow (2-module adaptive)
satService.startSessionDirect(examConfigId)         // POST /sat/test/start  { exam_config_id }
satService.startSession(assignmentId)               // POST /sat/test/start  { assignment_id }
satService.submitModule1(sessionId, answers)        // POST /sat/test/:id/module/1/submit
satService.getModule2(sessionId)                    // GET  /sat/test/:id/module/2
satService.submitModule2(sessionId, answers)        // POST /sat/test/:id/module/2/submit
satService.getResults(sessionId)                    // GET  /sat/test/:id/results

// Practice test flow (single module)
satService.startPractice(configId, assignmentId)    // POST /sat/test/practice/start
satService.submitPractice(sessionId, answers)       // POST /sat/test/practice/:id/submit
satService.getPracticeResults(sessionId)            // GET  /sat/test/practice/:id/results
```

### `chatService`
```js
chatService.getConversations(userId)                // GET /chat/conversations/:userId
chatService.getMessages(userId, otherId, page)      // GET /chat/messages/:userId/:otherId?page=N
chatService.markRead(senderId, receiverId)          // PUT /chat/messages/read
chatService.searchUsers(q)                          // GET /chat/users/search?q=…
```

---

## 10. Socket (Real-time)

**File:** `src/services/socket.js`

A singleton Socket.IO connection. Only one socket is created per browser session.

```js
import { connectSocket, disconnectSocket, getSocket } from '../../services/socket';

// Connect (creates the socket if not already connected)
const socket = connectSocket();

// Subscribe to events
socket.on('receive_message', (msg) => { /* ... */ });

// Emit events
socket.emit('send_message', { senderId, receiverId, content });

// Disconnect (called on component unmount)
disconnectSocket();

// Get existing socket without reconnecting
const socket = getSocket();
```

The socket URL comes from `VITE_SOCKET_URL` (defaults to `http://localhost:8000`).

---

## 11. Pages Reference

### Dashboard (`/dashboard`)

**File:** `src/pages/Dashboard/Dashboard.jsx`

Shows:
- Welcome banner with time-based greeting
- 3 test cards (Diagnostic / Practice / Mock) — each with a progress ring showing completed/total
- Course Details card (batch info + progress bars)
- My Mentor card (mentor name, specialization, message button)

The overall progress % is the average of the three test-type completion percentages.

Sub-components:
- `TestCard.jsx` — individual test type card with ring + chevron
- `OverallRing.jsx` — SVG ring with an indigo-purple gradient fill

---

### SAT Tests (`/sat/diagnostic`, `/sat/practice`, `/sat/mock`)

**File:** `src/pages/SATTests/SATTests.jsx` (~2000 lines — the most complex file)

This single file manages two completely different states:

**1. List View** — Shows available tests, attempt history, score badges.

**2. Test-Taking View** — Full-screen test experience:
- Section 1: Reading & Writing (two modules)
- Section 2: Math (two modules)
- Each module: timed, bookmarking, cross-out, notes, question picker
- Adaptive: Module 2 difficulty is determined by Module 1 performance
- Practice tests: single-module, no timer-based submission

When a test starts, `App.jsx` collapses the sidebar (`onTestStart`/`onTestEnd` callbacks).

Components used from `src/components/test/`:
`SATDivider`, `TestTopBar`, `TestBottomBar`, `QuestionView`, `SplitContentArea`, `NotesModal`, `QuestionPicker`

These are also re-exported from `src/pages/Assignments/TestSharedComponents.jsx` for backward compatibility.

---

### Communication (`/communication`)

**Files:** `src/pages/Communication/Communication.jsx`, `MessageContent.jsx`

Real-time chat between student and mentor(s).

- Left panel: conversation list (sorted by last message time, unread badge)
- Right panel: message thread with infinite scroll (pagination)
- Supports text, image attachments `[IMG:data-url]`, and file attachments `[FILE:name||size]`
- Emoji picker, image paste, file drag/drop

Uses Socket.IO events:
- `receive_message` — new incoming message
- `send_message` — student sending a message
- `mark_read` — marks messages as read when conversation is opened

`MessageContent.jsx` is a pure display component — it parses the message string format and renders the appropriate UI.

---

### Score Report Modal

**Files:** `src/pages/Assignments/`

The report is split across 5 files for clarity:

| File | Responsibility |
|------|----------------|
| `StudentReportModal.jsx` | Orchestrator: state, tab navigation, section/module switching |
| `reportUtils.js` | Pure JS: `computeTopicMastery()`, `generateAISummary()`, `downloadReport()` |
| `ReportCharts.jsx` | SVG charts: column chart, pie chart, line chart, `TopicCharts` wrapper |
| `AISummaryView.jsx` | AI feedback UI: strength/focus/developing area cards + download button |
| `QuestionReview.jsx` | Per-question answer display with correct/wrong highlighting + explanations |

The modal has 4 tabs:
1. **Questions** — review each question, see correct/wrong answers + explanations
2. **Topic Mastery** — table of topics grouped by section with mastery badge + progress bar
3. **Charts** — column chart per section, mastery distribution pie, performance trend line
4. **AI Summary** — auto-generated analysis based on topic scores

To download the report as an HTML file: `downloadReport()` generates a self-contained HTML string and triggers a browser download.

---

### Profile (`/profile`)

**File:** `src/pages/Profile/Profile.jsx`

Three cards:
1. Personal Info (name — editable, email — read only)
2. Enrollment Details (course, batch, enrolled date)
3. My Mentor (mentor name, specialization, batch)

Name edits call `authService.updateName()` then `updateStudent()` to keep context in sync.

---

## 12. Component Library

### `src/components/ui/` — Core Primitives

Import everything from the barrel:
```js
import { Button, Card, CardHeader, CardTitle, ProgressRing } from '../../components/ui';
```

**`Button`**
```jsx
<Button variant="primary">Save</Button>
<Button variant="outline" size="sm" loading={saving}>Saving…</Button>
<Button variant="danger" onClick={handleDelete}>Delete</Button>
<Button variant="success">Confirm</Button>
```

**`Card` / `CardHeader` / `CardTitle`**
```jsx
<Card>
  <CardHeader>
    <CardTitle><Icon size={18} /> Title</CardTitle>
    <Button size="sm">…</Button>
  </CardHeader>
  {/* body */}
</Card>
```

**`ProgressRing`**
```jsx
<ProgressRing pct={65} size={72} stroke={7} color="#4f46e5" />
// Props: pct (0-100), size (px, default 72), stroke (px, default 7),
//        color (stroke color), trackColor (background ring, default #e2e8f0)
```

---

### `src/components/test/` — SAT Test-Taking Components

These are only used inside `SATTests.jsx`. Import from the barrel:
```js
import { TestTopBar, TestBottomBar, QuestionView, ... } from '../../components/test';
```

All test components import design tokens from `../../pages/Assignments/testConstants` (the `C` object).

| Component | Key Props |
|-----------|-----------|
| `SATDivider` | none — renders a fixed decorative divider |
| `TestTopBar` | sectionName, moduleLabel, timeLeft, showCalc, onSubmit, onExit, … |
| `TestBottomBar` | currentIdx, totalQuestions, onBack, onNext, onOpenPicker, isLastQuestion |
| `QuestionView` | question, answers, onAnswer, index, markedIds, onToggleMark, onOpenNotes |
| `SplitContentArea` | question, answers, onAnswer, questionIdx, markedIds, … (adds split/full panel toggle) |
| `NotesModal` | qid, notes, onAdd, onDelete, onClose |
| `QuestionPicker` | questions, currentIdx, answers, markedIds, onSelect, onClose |

---

### `src/components/common/` — Small Shared Pieces

| Component | Props | Use when |
|-----------|-------|----------|
| `Badge` | label, color | Small label pill |
| `EmptyState` | icon, title, description | No-data placeholder |
| `MathContent` | html, className | Render SAT question HTML with KaTeX math |
| `Modal` | isOpen, onClose, title, children | Generic overlay modal |
| `StatCard` | label, value, icon, color | Single metric display card |

---

### `src/components/layout/`

**`Layout.jsx`** — The main shell. Renders:
1. `<Sidebar>` (as fixed sidebar on desktop, bottom nav on mobile)
2. An optional `<GuestBanner>` if `isGuest` is true
3. A sticky top bar with the page title
4. `<Outlet />` — where the current page renders

The breakpoint is **700px** (not the default Tailwind `md: 768px`). Below 700px: bottom nav bar. Above: left sidebar.

**`Sidebar.jsx`** — Has two modes:
- `bottomNav={false}` (default): renders the full collapsible left sidebar
- `bottomNav={true}`: renders only the mobile bottom tab bar

When collapsed (`collapsed={true}`): sidebar is 72px wide with icon-only items.
When expanded: 250px wide with text labels.

---

## 13. How Data Flows

```
AuthContext (student, isGuest)
       │
       ▼
   App.jsx  ──── passes student as prop ──── Layout ── Sidebar
       │
       │ prop drilling
       ▼
   Dashboard(student)       → reads student.mentors, student.name
   SATTests(student)        → uses student._id to get assignments
   Communication(student)   → uses student._id for chat
   Profile(student, onUpdateStudent)
```

There is **no global state manager** (no Redux, no Zustand). Data flows down via props. The only shared state is:

1. `AuthContext` — who is logged in
2. `chatUnreadCount` — lives in `App.jsx` state, passed down to `Layout → Sidebar`
3. `sidebarCollapsed` — lives in `App.jsx` state, passed to `Layout`

Each page fetches its own data on mount using `useEffect` + the service functions.

---

## 14. Common Patterns

### Fetching data on mount
```jsx
const [data, setData]     = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  satService.listExamConfigs()
    .then(res => setData(res.data || []))
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
}, []);
```

### Derived state with useMemo
```jsx
const topicMastery = useMemo(
  () => computeTopicMastery(assignment, attempt),
  [assignment, attempt],
);
```

### Responsive layout (sidebar breakpoint)
```jsx
// Layout.jsx pattern — DO NOT use md: (768px), use 700px threshold
const isMobile = useMediaQuery('(max-width: 699px)');
```

### Loading skeleton
```jsx
{loading ? (
  <div className="rounded-[18px] h-36 bg-slate-100 animate-pulse" />
) : (
  <ActualContent />
)}
```

### File structure rules
- One concern per file. No file should exceed ~200 lines.
- If a component file grows past 200 lines, extract sub-components.
- If a file has utility functions + a component, split utilities into a `*Utils.js` file.
- All reusable UI: `src/components/ui/`
- All page-specific sub-components: same folder as the page.

---

## 15. How to Add Things

### Add a new page

1. Create `src/pages/MyPage/MyPage.jsx`
2. Add a route in `src/App.jsx`:
   ```jsx
   <Route path="/my-page" element={<MyPage student={student} />} />
   ```
3. Add a nav item in `src/components/layout/Sidebar.jsx` inside `NAV_GROUPS`
4. Add page meta in `src/components/layout/Layout.jsx` inside `PAGE_META`

### Add a new API call

1. Open `src/services/api.js`
2. Add the call to the relevant service object:
   ```js
   export const myService = {
     getData: () => req('/my-endpoint'),
     postData: (payload) => req('/my-endpoint', { method: 'POST', body: JSON.stringify(payload) }),
   };
   ```
3. Import and use in your component:
   ```js
   import { myService } from '../../services/api';
   ```

### Add a new design token

Open `src/theme/tokens.js` and add your value to the appropriate section. Then import it where needed:
```js
import { brand, gradients, status } from '../../theme/tokens';
```

### Add a new reusable UI component

1. Create `src/components/ui/MyComponent.jsx`
2. Export it from `src/components/ui/index.js`:
   ```js
   export { default as MyComponent } from './MyComponent';
   ```
3. Now it's importable everywhere:
   ```js
   import { MyComponent } from '../../components/ui';
   ```

### Add a new mastery level colour

Open `src/theme/tokens.js` → `masteryLevels` array. Add a new entry with `{ min, label, color, bg, bar }`. The `masteryChartColors` object also needs a matching entry.

---

## 16. Branch History & What Changed

### `master` (base)
Original monolithic codebase. No design system, no component library.

### `notifications_system` (current)
Large refactor to make the codebase modular and professional:

**Phase 1 — Design tokens**
- Created `src/theme/tokens.js` — single source of truth for all colours and constants
- Extended `tailwind.config.js` with custom colours, border-radius values, and shadows

**Phase 2 — Utilities & DRY**
- Created `src/utils/colorMapping.js` — re-exports `getMasteryLevel`, `CHART_PALETTE`, `MASTERY_CHART_COLORS`
- Created `src/utils/formatters.js` — `formatTime`, `formatDate`, `formatBytes`
- Removed duplicate local definitions from `SATTests.jsx` and `StudentReportModal.jsx`

**Phase 3 — UI Component Library**
- Created `src/components/ui/Button.jsx` — variant-based button
- Created `src/components/ui/Card.jsx` — `Card`, `CardHeader`, `CardTitle`
- Created `src/components/ui/ProgressRing.jsx` — generic SVG progress ring
- Created `src/components/ui/index.js` — barrel export

**Phase 4 — Swap pages to use UI library**
- `Dashboard.jsx`, `Slots.jsx`, `Sessions.jsx`, `Assignments.jsx`, `Profile.jsx` — all replaced raw divs with `<Card>`, `<Button>`

**Phase 5 — Split oversized files**
- `TestSharedComponents.jsx` (726 lines) → moved to `src/components/test/` (7 files), `TestSharedComponents.jsx` is now a 2-line re-export barrel for backward compatibility
- `Dashboard.jsx` → extracted `TestCard.jsx`, `OverallRing.jsx`
- `Communication.jsx` → extracted `MessageContent.jsx`; formatters moved to `src/utils/formatters.js`
- `StudentReportModal.jsx` (975 lines) → split into 5 files:
  - `reportUtils.js` (pure functions)
  - `ReportCharts.jsx` (SVG charts)
  - `AISummaryView.jsx` (AI feedback UI)
  - `QuestionReview.jsx` (question review UI)
  - `StudentReportModal.jsx` (thin orchestrator, ~185 lines)

---

*Last updated: May 2026 — Phase 5 complete.*
*Next planned: Phase 6 — extract custom hooks (`useSATTest`, `useChatSocket`, `useTestStats`).*
