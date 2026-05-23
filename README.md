# Mnemosyne 🧠✨

A beautiful, AI-powered study companion that uses active recall, spaced repetition, and advanced PDF processing to help you learn faster and ace your exams. 

![Mnemosyne Hero Banner] <!-- Replace with a real screenshot later -->

## ✨ Features

- **Smart PDF Processing:** Upload any study material (PDFs) and let the AI instantly break it down into digestible, interconnected key concepts.
- **Specialized AI Tutors:** 
  - **Notes Mode:** A patient tutor that explains concepts using analogies and probes your understanding.
  - **PYQ Mode:** An exam-focused coach that analyzes Previous Year Questions, identifies traps, and teaches you how to score maximum marks.
- **Interactive Concept Graph:** Visually explore how different topics and ideas connect to one another.
- **Analytics Dashboard:** Track your learning distribution, weak concepts, and overall mastery over time.
- **Beautiful, Fluid UI:** A highly responsive frontend built with smooth physics-based animations.

## 🛠️ Tech Stack

**Frontend**
- Next.js (App Router)
- React
- Tailwind CSS
- Framer Motion (for physics-based animations)
- Recharts (for analytics visualization)
- Lucide React (Icons)

**Backend**
- FastAPI (Python)
- SQLite (Development) / PostgreSQL (Production ready)
- Groq AI (Lightning-fast LLM inference)
- pdfplumber & PyMuPDF (Document processing)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/mnemosyne.git
cd mnemosyne
```

### 2. Backend Setup
We use [uv](https://github.com/astral-sh/uv) for lightning-fast Python dependency management.

```bash
cd backend
uv sync

# Configure your environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY (Get it free at https://console.groq.com/keys)

# Start the FastAPI server
uv run uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
