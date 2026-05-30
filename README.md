# Mnemosyne

**Precision PYQ Study Guides**

Mnemosyne is a powerful, AI-driven full-stack application that analyzes your Past Year Questions (PYQs) and course notes to generate highly targeted, exam-optimized study guides.

## Features
- **AI-Powered Analysis**: Extracts topics, weightages, and recurring patterns from past exams.
- **Dynamic Study Guides**: Generates beautiful, detailed study notes featuring LaTeX mathematics and Mermaid.js diagrams.
- **Formal Print Export**: Export generated notes to a pristine, academic-grade PDF.
- **Bring Your Own Key (BYOK)**: Securely use your own Gemini API key for generation.

## Tech Stack
- **Frontend**: Next.js 15, React, Tailwind CSS, Framer Motion, GSAP, Lenis (Smooth Scrolling)
- **Backend**: FastAPI (Python), Google Gemini 2.5 Flash
- **Document Processing**: PyPDF2, regular expressions, and intelligent chunking

## Getting Started

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `pip install -r requirements.txt` (or via `uv`).
3. Set your `GEMINI_API_KEY` in a `.env` file.
4. Run the server: `uvicorn app.main:app --reload`

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
