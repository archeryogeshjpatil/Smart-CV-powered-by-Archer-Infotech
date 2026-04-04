# Software Requirements Specification (SRS): Smart CV powered by Archer Infotech

## 1. Project Overview
**Project Name:** Smart CV powered by Archer Infotech
**Target Audience:** Students and Fresh Graduates
**Goal:** Provide an elegant, AI-driven platform for ATS resume analysis, keyword optimization, and professional template generation.

## 2. Core Features
### 2.1 Resume Parsing & Extraction
- **Inputs:** Support for .docx and .pdf formats.
- **Extraction Fields:**
  - Full Name
  - College/University Name
  - Mobile Number
  - Email ID
  - GitHub & Social Media Links (LinkedIn, etc.)
- **Technology:** Python (FastAPI) + Docling/SharpAPI + Gemini AI for structured JSON output.

### 2.2 ATS Score & Analysis
- **Scoring Engine:** A composite score (0-100) based on keyword matching, parseability, and impact.
- **Defect Detection:** Flagging missing info, weak verbs, and ATS-unfriendly formatting.
- **Recommendations:** Context-aware suggestions to improve bullet points and section headers.

### 2.3 Elegant UI/UX
- **Design:** Modern "Clean & Premium" look using Tailwind CSS + Shadcn/UI.
- **Feedback:** Real-time split-screen analysis with color-coded alerts.

### 2.4 CV Generation
- **Templates:** Minimalist, machine-readable templates.
- **Live Preview:** Instant PDF generation as users update their profile details.

## 3. Tech Stack
- **Frontend:** Next.js (TypeScript), Tailwind, Framer Motion.
- **Backend:** FastAPI (Python).
- **AI:** Gemini 1.5 Pro.
- **Storage:** Supabase.

## 4. Git Architecture
- **Workflow:** Local changes will be tracked and synchronized to a remote Git repository for version control and CI/CD readiness.
