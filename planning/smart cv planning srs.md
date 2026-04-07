# Software Requirements Specification (SRS): Smart CV powered by Archer Infotech

## 1. Project Overview
**Project Name:** Smart CV powered by Archer Infotech
**Target Audience:** Students and Fresh Graduates
**Goal:** Provide an elegant, AI-driven platform for ATS resume analysis, keyword optimization, AI-powered resume regeneration, and professional CV template generation.
**Architecture:** 100% local — no cloud databases or third-party auth services.

## 2. Core Features

### 2.1 Resume Parsing & Extraction
- **Inputs:** Support for .docx and .pdf formats via drag-and-drop upload.
- **Extraction Fields:**
  - Full Name
  - College/University Name
  - Mobile Number
  - Email ID
  - GitHub & Social Media Links (LinkedIn, etc.)
  - **Technical Skills** (auto-extracted from entire resume — languages, frameworks, tools, databases, platforms)
- **Technology:** Python (FastAPI) + PyPDF + python-docx for text extraction, Google Gemini AI for structured JSON output.

### 2.2 ATS Score & Analysis
- **Scoring Engine:** A composite score (0-100) based on keyword matching, parseability, and impact.
- **Defect Detection:** Flagging missing info, weak verbs, and ATS-unfriendly formatting.
- **Recommendations:** Context-aware suggestions to improve bullet points and section headers.
- **Null Handling:** All extracted fields are sanitized — null, "N/A", and empty values are filtered out before display.

### 2.3 AI Resume Regeneration (Requires Login)
- **Clarifying Questions:** After analysis, AI identifies missing information and asks the user targeted questions (3-8 questions) via a chat-like UI.
- **Improved Resume Generation:** AI takes the original resume + user answers and generates a defect-free, ATS-optimized resume applying all recommendations.
- **Auto-Fill CV Generator:** Regenerated content is automatically passed to the CV Generator page with all fields pre-filled.
- **Access Control:** Analysis works without login; regeneration requires authentication.

### 2.4 Elegant Glassmorphism UI/UX
- **Design:** Dark theme with animated gradient orbs, glass cards (backdrop-blur), glow buttons, and Framer Motion animations.
- **Feedback:** Real-time split-screen analysis with color-coded alerts (green for score/recommendations, red for defects, cyan for skills).
- **Responsive:** Mobile-first with hamburger menu navigation, works across all screen sizes.

### 2.5 CV Generation & PDF Export
- **Templates:** 3 professional, ATS-friendly templates:
  - **Minimal** — Clean centered layout, uppercase section headers, grey skill tags.
  - **Modern** — Bold gradient header (indigo/purple), accent bars, pill-shaped skill tags.
  - **Elegant** — Sidebar layout with emerald gradient, avatar initial, timeline dots.
- **Live Preview:** Instant A4-proportional preview as users update their profile details.
- **PDF Download:** High-quality PDF export (3x scale, JPEG 95%, multi-page support) using html2canvas + jsPDF.
- **Inline Styles:** Templates use pure inline styles (no Tailwind/SVG) for reliable PDF rendering.

### 2.6 Authentication System
- **Signup/Login:** Email and password authentication with JWT tokens (7-day expiry).
- **Password Security:** PBKDF2 hashing with random salt — all local, no cloud auth.
- **Session:** Token stored in localStorage, auto-attached to API requests.

### 2.7 Dashboard & History
- **Stats:** Total resumes analyzed, average ATS score, best ATS score.
- **History List:** Past analysis results with file name, score, defect/recommendation counts, and timestamps.
- **Actions:** Delete individual history entries.
- **Access:** Login required.

## 3. Tech Stack
- **Frontend:** Next.js 16 (TypeScript), Tailwind CSS v4, Framer Motion, html2canvas, jsPDF.
- **Backend:** FastAPI (Python), Uvicorn.
- **AI:** Google Gemini 2.5 Flash (via google-genai SDK) with automatic model fallback (2.5-flash → 2.0-flash → 2.0-flash-lite).
- **Database:** SQLite (local, zero config, auto-created on first run).
- **Auth:** JWT tokens + PBKDF2 password hashing (all local).
- **File Parsing:** PyPDF (PDF), python-docx (DOCX).

## 4. API Endpoints

| Method | Endpoint               | Auth | Description                              |
|--------|------------------------|------|------------------------------------------|
| GET    | `/`                    | No   | Health check — API status                |
| POST   | `/auth/signup`         | No   | Create account, returns JWT              |
| POST   | `/auth/login`          | No   | Login, returns JWT                       |
| GET    | `/auth/me`             | Yes  | Verify token, get user info              |
| POST   | `/analyze`             | No   | Upload resume, get AI analysis + skills  |
| POST   | `/regenerate/questions`| Yes  | Get clarifying questions for regeneration|
| POST   | `/regenerate`          | Yes  | Generate improved resume from answers    |
| POST   | `/history/save`        | Yes  | Save analysis result to history          |
| GET    | `/history`             | Yes  | Get user's resume history                |
| DELETE | `/history/:id`         | Yes  | Delete a history entry                   |

## 5. Access Control

| Feature              | Without Login | With Login |
|----------------------|:------------:|:----------:|
| Resume Analysis      | Yes          | Yes        |
| View Results + Skills| Yes          | Yes        |
| Regenerate Resume    | No           | Yes        |
| CV Generator         | Yes          | Yes        |
| Dashboard / History  | No           | Yes        |

## 6. Pages

| Route           | Description                                              |
|-----------------|----------------------------------------------------------|
| `/`             | Landing — upload resume, view analysis + skills, regenerate |
| `/generate`     | CV Generator — fill form (or auto-fill), pick template, PDF |
| `/dashboard`    | Resume history and stats (requires login)                |
| `/auth/login`   | Sign in with email/password                              |
| `/auth/signup`  | Create new account                                       |

## 7. Project Structure

```
Smart-CV-powered-by-Archer-Infotech/
├── backend/
│   ├── main.py          # FastAPI app — all endpoints
│   ├── utils.py         # PDF/DOCX extraction + Gemini AI analysis + regeneration
│   ├── database.py      # SQLite operations (users, resume_history)
│   ├── auth.py          # JWT tokens + PBKDF2 password hashing
│   ├── requirements.txt # Python dependencies
│   └── .env             # GEMINI_API_KEY
├── frontend/
│   ├── src/app/         # Pages (/, /generate, /dashboard, /auth/login, /auth/signup)
│   ├── src/components/  # Navbar
│   ├── src/lib/         # api.ts — local API client (auth, analysis, history, regeneration)
│   ├── package.json     # NPM dependencies
│   └── globals.css      # Glassmorphism styles, animations
└── planning/
    └── smart cv planning srs.md  # This document
```

## 8. Git Architecture
- **Workflow:** Local changes tracked and synchronized to a remote Git repository for version control and CI/CD readiness.

## 9. How to Run

### Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Required
```bash
# In backend/.env
GEMINI_API_KEY=your-google-gemini-api-key
```
