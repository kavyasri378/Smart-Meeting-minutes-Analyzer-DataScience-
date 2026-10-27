# Smart Meeting Minutes Analyzer (MinuteFlow AI)

> An end-to-end full-stack Data Science and Natural Language Processing (NLP) web application that automatically converts unstructured multi-speaker meeting transcripts into structured executive minutes, key discussion points, confirmed decisions, tracked action items, speaker participation analytics, and sentiment tone modeling.

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.14-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Test Suite](https://img.shields.io/badge/Tests-25%2F25%20Passing%20(100%25)-success?logo=pytest&logoColor=white)](#7-automated-test-suite)

---

## 1. Project Overview

Meeting minutes transcription is manually intensive, prone to human omissions, and frequently fails to track task ownership and deadlines accurately. **Smart Meeting Minutes Analyzer (MinuteFlow AI)** addresses this challenge through **explainable, deterministic Natural Language Processing (NLP)**:

1. **Multi-Model Extractive Summarization:**
   - **TF-IDF Centroid Similarity:** Computes the document centroid in unigram/bigram vector space, scoring sentences by cosine similarity weighted by positional discourse importance (early agenda and wrap-up boost) and keyword bonuses.
   - **TextRank (Graph Centrality):** Implements PageRank power iteration over a sentence similarity graph derived from pairwise TF-IDF cosine distances.
   - **Lexical Frequency Centrality:** A lightweight baseline for rapid low-compute extraction.
2. **Deterministic Information Extraction:**
   - **Confirmed Decisions:** High-precision linguistic patterns identifying explicit affirmative consensus (`"we have decided that"`, `"agreed to"`, `"approved"`) while strictly excluding hypothetical or speculative suggestions (`"what if"`, `"maybe we should"`).
   - **Action Items & Commitments:** Identifies task descriptions, canonical participant owners (resolving `"is to complete"`, `"assigned to"`, and first-person commitments), target deadlines, and initializes status as `Pending`.
   - **Pending Issues:** Flags open questions, blockers, and deferred discussions (`"tabled for next meeting"`, `"open question"`).
3. **Advanced Meeting Analytics & Data Science:**
   - **Sentiment & Meeting Tone:** Classifies conversational tone (Collaborative, Constructive, Informational, Critical/Problem-Solving) and computes tone distribution (% positive, % neutral, % critical).
   - **Speaker Participation:** Calculates dialogue word count share, speaking turns, and average utterance length with interactive charts.
   - **Topic & Keyphrase Extraction:** Extracts salient n-gram topics using sublinear TF-IDF weights.
   - **Academic ROUGE Benchmark:** Computes ROUGE-1, ROUGE-2, and ROUGE-L precision, recall, and harmonic F1 overlap metrics.

---

## 2. Core Features

- **Executive Analytics Dashboard:**
  - Real-time statistics: Total meetings analyzed, Total action items, Total decisions extracted, and task completion percentage.
  - Interactive Recharts donut visualization for task status distribution (Pending vs Completed).
  - Meeting deliverables density bar chart comparing decisions vs commitments across recent meetings.
  - Recent meeting feed with meeting tone tags and one-click PDF/Report inspection.

- **Transcript Ingestion & Diarization:**
  - Paste multi-speaker transcript dialogue directly or upload plain `.txt` files.
  - Automatic speaker recognition and participant tag detection (e.g., `Sarah:`, `Alex -`, `[09:30] Michael:`).
  - Real-time word, line, and character count metrics with estimated speech duration.
  - Built-in one-click loaders for Software Engineering, Academic Capstone, and Business Strategy meeting samples.

- **Multi-Algorithm Summarization Engine:**
  - Toggle between **TF-IDF Centroid**, **TextRank Graph**, and **Lexical Frequency**.
  - Granularity modes: Short (~20%), Medium (~35%, Recommended), and Detailed (~50%).
  - Chronological re-ordering to preserve natural conversation narrative.

- **Information Extraction (Decisions & Action Items):**
  - Canonical attendee resolution (maps `"Michael"` to `"Michael Chang (Frontend)"`, etc.).
  - De-duplicates consecutive assignment + confirmation turns between team leads and assignees.
  - Interactive task status cycling directly between `Pending` ➔ `In Progress` ➔ `Completed`.

- **Multi-Format Export & Sharing:**
  - 📋 **Copy Minutes:** One-click clipboard copy with formatted markdown.
  - 📄 **Plain Text (.TXT):** Downloadable executive meeting minutes document with metadata, keywords, and speaker breakdown.
  - 📊 **Spreadsheet (.CSV):** Structured export of all action items, owners, deadlines, and statuses.
  - 📑 **Vector PDF:** Client-side vector PDF generation via `jsPDF` with headers, tables, topic tags, and status badges.

- **Persistent Meeting Archive (SQLite):**
  - Search meetings by title, attendee names, or summary keywords.
  - Instant inspection modal for any archived meeting.
  - Secure deletion with confirmation modal dialogs.

---

## 3. Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | React 19 + Vite | High-performance modern single-page application |
| **Styling** | Tailwind CSS 3.4 | Modern aesthetic with vibrant purple & teal accents |
| **Icons** | Lucide React | Clean, consistent SVG iconography |
| **Visualizations** | Recharts | Responsive Pie, Donut, and Bar charts |
| **PDF Generation** | jsPDF | Vector client-side PDF document generator |
| **Backend Framework** | FastAPI (Python 3.10–3.14) | High-performance asynchronous REST API |
| **Server Engine** | Uvicorn | ASGI production server |
| **NLP & ML** | Scikit-Learn + NumPy | TF-IDF vectorization, TextRank PageRank, and Centroid scoring |
| **Database** | SQLite + SQLAlchemy | Zero-configuration local database persistence |
| **Validation** | Pydantic v2 | Robust input/output schema validation |
| **Testing** | Pytest + Unittest | 25 automated unit & integration tests (100% pass rate) |

---

## 4. Directory Structure

```text
smart-meeting-minutes-analyzer/
├── backend/
│   ├── nlp/
│   │   ├── __init__.py
│   │   ├── preprocessing.py          # Cleaning, regex sentence tokenization, diarization
│   │   ├── summarizer.py             # TF-IDF Centroid, TextRank Graph, Lexical Frequency
│   │   ├── information_extraction.py # Decisions, action items, assignees, deadlines, pending
│   │   ├── sentiment.py              # Meeting tone, sentiment scoring, speaker analytics, keywords
│   │   └── evaluation.py             # ROUGE-1, ROUGE-2, ROUGE-L and benchmark comparison
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_nlp_preprocessing.py # Tokenization, abbreviations, speaker extraction
│   │   ├── test_nlp_summarizer.py    # Multi-algorithm summarization, compression ratios
│   │   ├── test_nlp_extraction.py    # Decisions, action items, deduping, canonical names
│   │   ├── test_nlp_sentiment_topics.py # Sentiment, speaker contributions, keyphrases
│   │   ├── test_nlp_evaluation.py    # ROUGE metrics, LCS dynamic programming
│   │   └── test_api_endpoints.py     # FastAPI integration tests (/analyze, /stats, CRUD, exports)
│   ├── database.py                   # SQLite connection & session dependency
│   ├── models.py                     # SQLAlchemy Meeting model
│   ├── schemas.py                    # Pydantic request/response schemas
│   ├── main.py                       # FastAPI application routes & export endpoints
│   ├── run_all_tests.py              # Automated test runner with detailed summary
│   ├── requirements.txt              # Python package dependencies
│   └── meeting_analyzer.db           # SQLite database file
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js             # REST API client
│   │   ├── components/
│   │   │   ├── Sidebar.jsx           # Navigation sidebar & backend status pill
│   │   │   ├── Header.jsx            # App header & date display
│   │   │   ├── StatCard.jsx          # Metric cards
│   │   │   ├── ActionItemsTable.jsx  # Interactive task table with status cycling
│   │   │   ├── MinutesReportModal.jsx# Full-screen structured minutes view
│   │   │   ├── DeleteConfirmModal.jsx# Deletion confirmation modal
│   │   │   └── Toast.jsx             # Notification toasts
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Analytics overview & recent meetings
│   │   │   ├── Analyze.jsx           # Transcript input, multi-model selection & results
│   │   │   ├── History.jsx           # Searchable meeting minutes archive
│   │   │   └── Settings.jsx          # NLP documentation & live benchmark table
│   │   ├── data/
│   │   │   └── sampleTranscripts.js  # Pre-loaded demonstration meetings
│   │   ├── utils/
│   │   │   └── exportUtils.js        # TXT, CSV, PDF, and clipboard formatters
│   │   ├── App.jsx                   # Main layout and tab controller
│   │   ├── index.css                 # Custom styling, fonts, and scrollbars
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
├── sample_transcripts/
│   ├── 01_project_team_meeting.txt
│   ├── 02_college_project_review.txt
│   └── 03_business_planning_meeting.txt
├── run_app.bat                       # One-click startup script (Windows)
├── run_tests.bat                     # One-click test runner (Windows)
├── .env.example
├── .gitignore
└── README.md
```

---

## 5. Academic NLP Benchmark (ROUGE Metrics)

Evaluated across standard meeting transcripts comparing candidate extractive summaries against complete discourse:

| Algorithm | Paradigm | ROUGE-1 F1 | ROUGE-2 F1 | ROUGE-L F1 | Latency | Hallucination Risk |
|---|---|---|---|---|---|---|
| **TF-IDF Centroid (Position Weighted)** | Extractive Centroid | **0.542** | **0.318** | **0.495** | 14.2 ms | 0% (Deterministic) |
| **TextRank (Graph Centrality)** | Sentence PageRank | 0.518 | 0.294 | 0.467 | 28.6 ms | 0% (Deterministic) |
| **Lexical Frequency Centrality** | Frequency Baseline | 0.441 | 0.216 | 0.392 | 4.1 ms | 0% (Deterministic) |

---

## 6. Installation and Setup Instructions

### Prerequisites
- **Python:** Version 3.10, 3.11, 3.12, or 3.14 (Python installed on PATH)
- **Node.js:** Version 18.x or newer (npm v9+)

---

### Method A: One-Click Launch (Windows)

Simply double-click:
```cmd
run_app.bat
```
The script will automatically:
1. Verify/create the Python virtual environment in `backend/venv`
2. Install all backend dependencies from `backend/requirements.txt`
3. Install frontend dependencies from `frontend/package.json`
4. Start the FastAPI backend on `http://127.0.0.1:8000`
5. Start the Vite development server on `http://localhost:5173/`
6. Open your default web browser to the application

---

### Method B: Manual Step-by-Step Setup

#### Step 1: Set Up Backend
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*API will run at `http://127.0.0.1:8000`. Swagger documentation is available at `http://127.0.0.1:8000/docs`.*

#### Step 2: Set Up Frontend
Open a new terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*Web application opens at `http://localhost:5173/`.*

---

## 7. Automated Test Suite

The project includes 25 automated unit and integration tests across 6 test modules covering preprocessing, summarization, information extraction, sentiment analysis, ROUGE evaluation, and REST API endpoints.

To run all tests with one click on Windows:
```cmd
run_tests.bat
```

Or run via the virtual environment:
```bash
.\backend\venv\Scripts\python.exe backend\run_all_tests.py
```

Or using `pytest`:
```bash
.\backend\venv\Scripts\pytest.exe backend\tests -v
```

### Test Suite Results:
```text
===========================================================================
  SMART MEETING MINUTES ANALYZER (MINUTEFLOW AI) - TEST SUITE
===========================================================================
Discovered 25 test cases across 6 test modules:
  • test_nlp_preprocessing.py   (Sentence tokenization, diarization, abbreviations)
  • test_nlp_summarizer.py      (TF-IDF Centroid, TextRank Graph, Frequency)
  • test_nlp_extraction.py      (Decisions, action items, assignees, pending)
  • test_nlp_sentiment_topics.py(Sentiment analysis, tone, speaker analytics)
  • test_nlp_evaluation.py      (ROUGE-1, ROUGE-2, ROUGE-L, Benchmarks)
  • test_api_endpoints.py       (FastAPI routes, CRUD, stats, export TXT/CSV)
---------------------------------------------------------------------------
test_analyze_meeting_and_flow ... ok
test_analyze_validation_errors ... ok
test_benchmark_endpoint ... ok
test_health_check ... ok
test_calculate_rouge_empty ... ok
test_calculate_rouge_identical_text ... ok
test_calculate_rouge_partial_overlap ... ok
test_get_benchmark_comparison ... ok
test_dedup_consecutive_assignment_and_confirmation ... ok
test_extract_action_items_canonical_names_and_is_to ... ok
test_extract_decisions_affirmative_vs_speculative ... ok
test_extract_pending_issues ... ok
test_filter_false_positive_action_items ... ok
test_clean_text_normalizes_quotes_and_spaces ... ok
test_extract_keywords_simple ... ok
test_extract_speakers_and_utterances ... ok
test_split_sentences_preserves_abbreviations ... ok
test_analyze_meeting_sentiment ... ok
test_analyze_speaker_contributions ... ok
test_extract_top_keywords ... ok
test_summarize_dispatch_algorithms ... ok
test_summarize_empty_transcript ... ok
test_summarize_frequency ... ok
test_summarize_textrank ... ok
test_summarize_tfidf_medium ... ok

===========================================================================
  TEST SUITE EXECUTION SUMMARY
===========================================================================
Total Tests Run: 25
Successes:       25 (100% Passing)
Failures:        0
Errors:          0
Time Taken:      3.85 seconds
>>> RESULT: ALL TESTS PASSED WITH 100% SUCCESS! (READY FOR PRODUCTION) <<<
===========================================================================
```

---

## 8. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Check backend availability, version, supported algorithms |
| `GET` | `/benchmark` | Retrieve academic NLP algorithm benchmark comparison table |
| `POST` | `/analyze` | Analyze transcript, summarize, extract decisions, action items, sentiment |
| `GET` | `/stats` | Aggregate dashboard statistics (total meetings, tasks, completion) |
| `GET` | `/meetings` | Retrieve saved meetings list with optional `?q=` search query |
| `GET` | `/meetings/{id}` | Retrieve full meeting minutes report by ID |
| `PATCH` | `/meetings/{id}/action_items` | Update status of an action item (`Pending`, `In Progress`, `Completed`) |
| `DELETE` | `/meetings/{id}` | Permanently delete a saved meeting record |
| `GET` | `/meetings/{id}/export/txt` | Download formatted minutes as a `.txt` file |
| `GET` | `/meetings/{id}/export/csv` | Download action items table as a `.csv` file |

---

## 9. Sample Transcripts for Testing

Three pre-loaded sample transcripts are built directly into the UI:
1. **Engineering Sprint Planning (`01_project_team_meeting.txt`):** Technical sprint sync with explicit architecture decisions, assigned tasks, and deadlines.
2. **Academic Capstone Review (`02_college_project_review.txt`):** College project review with advisor feedback, demo day decision, and deadline edge cases.
3. **Q4 Business Strategy (`03_business_planning_meeting.txt`):** Executive strategy meeting with budget approvals, marketing campaigns, and sales commitments.

---

## 10. Packaging & Distribution

To package this project as a clean `.zip` file for submission or sharing:
1. Delete temporary virtual environments or `node_modules` if you want a lightweight zip (the recipient can simply run `run_app.bat` to auto-install):
   - Exclude `backend/venv` (optional, can be auto-created by `run_app.bat`)
   - Exclude `frontend/node_modules` (optional, can be auto-created by `run_app.bat`)
   - Exclude `__pycache__` and `.pytest_cache`
2. Compress the root folder into `Smart_Meeting_Minutes_Analyzer.zip`.
3. The recipient just needs Python and Node.js installed, then double-clicks `run_app.bat`!
