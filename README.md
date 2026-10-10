# PrepAI — AI-Powered Interview Preparation Platform

PrepAI is an end-to-end, full-stack technical interview preparation platform designed to bridge the gap between a candidate's background and target job requirements. 

It analyzes resumes and job postings, calculates a weighted skill-gap matrix, builds personalized multi-week preparation plans, maintains a user-isolated RAG study vault, and conducts stateful, adaptive mock interviews using LangGraph agents with voice recognition and text-to-speech.

---

## Key Capabilities

1. **Structured Resume & Job Description Parsing**
   - Ingestion of PDF, DOCX, and plain text.
   - Pydantic-validated candidate profile extraction (skills, experience, projects, education, achievements).
   - Analysis of role requirements, domain, seniority, and required vs. preferred technologies.

2. **Objective Skill Gap Matrix**
   - Mathematical alignment score (0% to 100%).
   - Categorization into **Strong Matches**, **Partial Matches**, and **Missing Skills**.
   - Rationale and recommended topics generated for each missing requirement.

3. **Personalized Preparation Roadmap**
   - Multi-week study plan dynamically generated from missing skills.
   - Interactive topic checklists with real-time completion progress tracking.
   - Key concepts and recommended study documentation links.

4. **User-Isolated RAG Knowledge Vault**
   - Upload custom technical notes, cheat sheets, and architecture documents.
   - Automated text chunking and cosine similarity vector search.
   - Complete user data isolation enforced at the database level.

5. **Adaptive Mock Interviews via LangGraph**
   - Stateful agent workflow orchestrating context retrieval, question generation, and answer evaluation.
   - Questions dynamically adapt to probed weak areas across interview rounds.
   - Real-time speech-to-text voice recognition (Web Speech API) and text-to-speech audio question reading.

6. **Multidimensional Answer Evaluation**
   - Structured JSON rubrics assessing **Technical Accuracy**, **Depth**, **Communication**, and **Relevance**.
   - Immediate feedback panel highlighting key strengths, missing dimensions, and model answer recommendations.
   - Post-interview comprehensive scorecard and historical progress trend tracking.

---

## Architecture & Tech Stack

```
PrepAI Architecture
├── Frontend (React 19 + TypeScript + Vite + Tailwind CSS v4)
│   ├── Web Speech Recognition (Microphone) & SpeechSynthesis (TTS)
│   ├── JWT Auth & Protected Route Guards
│   └── Real-time Evaluation Dashboard
│
├── Backend (FastAPI + Python 3.14 + Pydantic v2 + SQLAlchemy)
│   ├── Relational Database (PostgreSQL / SQLite Local Dev)
│   ├── LangGraph Agent Workflow (StateGraph Interview Engine)
│   ├── RAG Engine (Chunking, Metadata, Cosine Vector Search)
│   └── Provider Abstraction (OpenAI, Anthropic, Gemini, Groq, Local Heuristics)
│
└── Infrastructure (Docker Compose + Multi-stage Dockerfiles)
```

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Axios.
- **Backend:** FastAPI, Python, SQLAlchemy ORM, Pydantic v2, PyJWT, bcrypt.
- **AI Agent Workflow:** LangGraph, LangChain Core.
- **Database:** PostgreSQL (production / Docker) or SQLite (zero-config local dev).
- **Document Extractors:** `pypdf`, `python-docx`.

---

## Project Structure

```
PrepAI/
├── frontend/                     # React + TypeScript SPA
│   ├── src/
│   │   ├── components/           # Navbar, Footer, Layout
│   │   ├── context/              # AuthContext (JWT session state)
│   │   ├── pages/                # HomePage, Dashboard, ResumeJob, SkillGap,
│   │   │                         # PrepPlan, RAG, MockInterview, Progress, Settings
│   │   ├── services/             # Axios API client & typed interfaces
│   │   └── App.tsx               # Route definitions & guards
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── backend/                      # FastAPI Application
│   ├── app/
│   │   ├── core/                 # Config, Database engine, Security/JWT
│   │   ├── models/               # SQLAlchemy models (User, Resume, Job, etc.)
│   │   ├── schemas/              # Pydantic data contracts
│   │   ├── services/             # LLMService, ResumeParser, SkillGapAnalyzer,
│   │   │                         # PlanGenerator, EvaluationService, RAGService
│   │   ├── agents/               # LangGraph Interview Agent Workflow
│   │   ├── api/                  # FastAPI routers (auth, resumes, jobs,
│   │   │                         # analysis, plans, rag, interviews, progress)
│   │   └── main.py               # API application entrypoint
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml            # Full-stack Docker deployment
├── .env.example                  # Environment configuration template
└── README.md
```

---

## Quickstart & Local Setup

### Prerequisites
- Node.js 18+ (tested on Node v20)
- Python 3.10+ (tested on Python 3.14)

### 1. Clone & Set Up Backend

```bash
cd backend

# (Optional) Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

The backend starts at `http://127.0.0.1:8001`.
Interactive Swagger API documentation is available at `http://127.0.0.1:8001/api/docs`.

### 2. Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The frontend will run at `http://localhost:5173`.
All `/api/*` requests are proxied automatically to the backend on port 8001.

---

## Running with Docker Compose

To run the entire system including PostgreSQL, backend, and frontend via Docker:

```bash
# Build and run containers
docker-compose up --build
```

- **Frontend:** `http://localhost:80`
- **Backend API:** `http://localhost:8001/api/docs`
- **PostgreSQL:** `localhost:5432`

---

## AI Provider Configuration

PrepAI features an abstraction layer in `app/services/llm_service.py`. When no API key is specified, PrepAI executes with a deterministic NLP engine that extracts information directly from your real resume and JD text rather than returning mock strings.

To enable live LLM integration, create a `.env` file in the root or backend directory:

```env
LLM_PROVIDER=openai # options: openai, anthropic, gemini, groq, local
OPENAI_API_KEY=sk-your-openai-key
LLM_MODEL=gpt-4o-mini
```

For Anthropic:
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-key
```

For Google Gemini:
```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key
```

For Groq:
```env
LLM_PROVIDER=groq
GROQ_API_KEY=your-groq-key
```

---

## Database Relational Models

- `users`: Candidate credentials (bcrypt hashed), session timestamps.
- `resumes`: Raw file text, filename, upload date.
- `candidate_profiles`: Structured skills, experience objects, education, projects, years of experience.
- `job_descriptions`: Structured required skills, preferred skills, responsibilities, seniority.
- `skill_gaps`: Match percentage, strong matches, partial matches, missing competencies with rationale.
- `preparation_plans`: Target role, duration in weeks, total topics, completed topics, progress %.
- `preparation_topics`: Topic order, title, key concepts, study resources, completion checkbox state.
- `documents` & `document_chunks`: RAG text chunks with embeddings, strictly filtered by `user_id`.
- `interview_sessions`: Target role, track, difficulty, questions array, overall score.
- `interview_questions`: Order index, question prompt, category, expected key points.
- `interview_answers`: Transcribed answer, duration in seconds.
- `answer_evaluations`: Technical accuracy, depth, relevance, communication, strengths, missing points.
- `progress_records`: Metric type, value, timestamp for historical trend analysis.

---

## Testing the End-to-End Workflow

1. Navigate to `http://localhost:5173/register` and create an account.
2. In **Resume & JD**, upload a sample resume (or paste text) and paste a target job description.
3. Click **Run Skill Gap Analysis** to view matched skills, partial matches, and missing competencies.
4. Click **Generate Prep Plan** to produce a personalized weekly study roadmap.
5. In **Mock Interview**, select your track and difficulty, then enter the interview room.
6. Use the microphone voice button or type an answer, then submit for instant multidimensional scoring.
7. Finish the round to view your completed scorecard and historical progress charts.
