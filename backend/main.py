import json
import io
import csv
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, text

from database import engine, Base, get_db
from models import Meeting
from schemas import (
    AnalyzeRequest, AnalyzeResponse, ActionItem, MeetingStats,
    MeetingListItem, DashboardStats, ActionItemStatusUpdate,
    SentimentAnalytics, SpeakerContribution, KeywordItem,
    RougeEvaluation, BenchmarkItem
)
from nlp.preprocessing import clean_text, split_sentences, extract_speakers_and_utterances
from nlp.summarizer import summarize_dispatch
from nlp.information_extraction import (
    extract_decisions, extract_action_items,
    extract_key_discussion_points, extract_pending_issues,
    clean_participant_name
)
from nlp.sentiment import (
    analyze_meeting_sentiment, analyze_speaker_contributions,
    extract_top_keywords
)
from nlp.evaluation import calculate_rouge, get_benchmark_comparison

# Initialize SQLite database tables & ensure schema migration
Base.metadata.create_all(bind=engine)

def ensure_db_schema():
    """Ensure newly added columns exist in the SQLite database."""
    with engine.connect() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(meetings);")).fetchall()
            existing_columns = {row[1] for row in result}
            new_columns = [
                ("summary_algorithm", "VARCHAR(64) DEFAULT 'tfidf_centroid'"),
                ("sentiment", "TEXT DEFAULT '{}'"),
                ("speaker_analytics", "TEXT DEFAULT '[]'"),
                ("keywords", "TEXT DEFAULT '[]'"),
                ("evaluation", "TEXT DEFAULT '{}'")
            ]
            for col_name, col_def in new_columns:
                if col_name not in existing_columns:
                    conn.execute(text(f"ALTER TABLE meetings ADD COLUMN {col_name} {col_def};"))
                    conn.commit()
        except Exception as e:
            print("Schema migration notice:", e)

ensure_db_schema()

app = FastAPI(
    title="Smart Meeting Minutes Analyzer API (MinuteFlow)",
    description="NLP-powered API for meeting transcript summarization, action item extraction, speaker analytics, and sentiment modeling",
    version="2.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "online",
        "service": "Smart Meeting Minutes Analyzer API",
        "nlp_engine": "Extractive TF-IDF Centroid + TextRank Graph + Rule-Based Information Extraction",
        "supported_algorithms": ["tfidf_centroid", "textrank", "frequency"],
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/benchmark", response_model=List[BenchmarkItem], tags=["System"])
def get_benchmarks():
    """Return academic NLP benchmark comparison table (ROUGE-1, ROUGE-2, ROUGE-L)."""
    return get_benchmark_comparison()

@app.get("/stats", response_model=DashboardStats, tags=["Dashboard"])
def get_dashboard_stats(db: Session = Depends(get_db)):
    meetings = db.query(Meeting).order_by(desc(Meeting.created_at)).all()
    
    total_meetings = len(meetings)
    total_action_items = 0
    total_decisions = 0
    pending_items = 0
    completed_items = 0

    recent_items: List[MeetingListItem] = []

    for m in meetings:
        try:
            items = json.loads(m.action_items) if m.action_items else []
            decs = json.loads(m.decisions) if m.decisions else []
            parts = json.loads(m.participants) if m.participants else []
            sent_data = json.loads(m.sentiment) if m.sentiment else {}
        except Exception:
            items, decs, parts, sent_data = [], [], [], {}

        total_action_items += len(items)
        total_decisions += len(decs)

        for item in items:
            st = item.get("status", "Pending")
            if st == "Completed":
                completed_items += 1
            else:
                pending_items += 1

        if len(recent_items) < 6:
            recent_items.append(
                MeetingListItem(
                    id=m.id,
                    title=m.title,
                    date=m.date,
                    participants=parts,
                    summary_snippet=(m.summary[:140] + "...") if len(m.summary) > 140 else m.summary,
                    action_items_count=len(items),
                    decisions_count=len(decs),
                    created_at=m.created_at.strftime("%Y-%m-%d %H:%M") if m.created_at else None,
                    sentiment_tone=sent_data.get("tone")
                )
            )

    return DashboardStats(
        total_meetings=total_meetings,
        total_action_items=total_action_items,
        total_decisions=total_decisions,
        pending_action_items=pending_items,
        completed_action_items=completed_items,
        recent_meetings=recent_items
    )

@app.post("/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
def analyze_meeting(payload: AnalyzeRequest, db: Session = Depends(get_db)):
    raw_transcript = payload.transcript.strip()
    
    # 1. Validation for empty or meaningless input
    if not raw_transcript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript is empty. Please paste a valid meeting transcript or upload a .txt file."
        )

    words = raw_transcript.split()
    if len(words) < 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transcript is too short to analyze meaningfully ({len(words)} words provided; at least 15 words required)."
        )

    cleaned = clean_text(raw_transcript)
    sentences = split_sentences(cleaned)

    if len(sentences) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript could not be segmented into at least two complete sentences. Please provide sufficient meeting content."
        )

    # 2. Extract or infer participants
    extracted_speakers, utterances = extract_speakers_and_utterances(raw_transcript)
    provided_participants = [clean_participant_name(p) for p in (payload.participants or []) if p.strip()]
    final_participants = list(dict.fromkeys(provided_participants + extracted_speakers))
    if not final_participants:
        final_participants = ["Meeting Attendees"]

    # 3. Default meeting title and date if not provided
    meeting_title = payload.title.strip() if payload.title and payload.title.strip() else "Team Sync & Planning"
    meeting_date = payload.date.strip() if payload.date and payload.date.strip() else datetime.now().strftime("%B %d, %Y")

    # 4. Generate Summarization using chosen algorithm
    chosen_algorithm = payload.summary_algorithm or "tfidf_centroid"
    summary_result = summarize_dispatch(cleaned, algorithm=chosen_algorithm, summary_length=payload.summary_length)
    summary_text = summary_result["summary"]
    summary_type = summary_result["method"]

    # 5. Extract Decisions, Action Items, Discussion Points, and Pending Issues
    decisions = extract_decisions(sentences)
    action_items_raw = extract_action_items(cleaned, participants=final_participants)
    action_items = [ActionItem(**item) for item in action_items_raw]
    discussion_points = extract_key_discussion_points(sentences, decisions, action_items_raw, top_n=6)
    pending_issues = extract_pending_issues(sentences)

    # 6. Advanced Data Science Analytics: Sentiment, Speaker Contributions & Keywords
    sentiment_data = analyze_meeting_sentiment(cleaned, utterances)
    speaker_contribs = analyze_speaker_contributions(utterances, len(words))
    top_keywords = extract_top_keywords(cleaned, top_n=8)
    rouge_eval = calculate_rouge(summary_text, cleaned)

    # 7. Compute Statistics
    word_count = len(words)
    sentence_count = len(sentences)
    estimated_duration_min = max(1, round(word_count / 140))  # Average speaking speed ~140 wpm
    reading_time_min = round(word_count / 220, 1)  # Average reading speed ~220 wpm

    stats = MeetingStats(
        word_count=word_count,
        sentence_count=sentence_count,
        estimated_duration_min=estimated_duration_min,
        reading_time_min=reading_time_min,
        action_items_count=len(action_items),
        decisions_count=len(decisions),
        compression_ratio=summary_result.get("compression_ratio", 0.0)
    )

    # 8. Optionally Save to SQLite Database
    meeting_id = None
    created_at_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    if payload.save_to_db:
        new_meeting = Meeting(
            title=meeting_title,
            date=meeting_date,
            participants=json.dumps(final_participants),
            transcript=raw_transcript,
            summary=summary_text,
            summary_type=summary_type,
            summary_algorithm=chosen_algorithm,
            discussion_points=json.dumps(discussion_points),
            decisions=json.dumps(decisions),
            action_items=json.dumps([item.model_dump() for item in action_items]),
            pending_issues=json.dumps(pending_issues),
            stats=json.dumps(stats.model_dump()),
            sentiment=json.dumps(sentiment_data),
            speaker_analytics=json.dumps(speaker_contribs),
            keywords=json.dumps(top_keywords),
            evaluation=json.dumps(rouge_eval)
        )
        db.add(new_meeting)
        db.commit()
        db.refresh(new_meeting)
        meeting_id = new_meeting.id

    return AnalyzeResponse(
        id=meeting_id,
        title=meeting_title,
        date=meeting_date,
        participants=final_participants,
        summary=summary_text,
        summary_type=summary_type,
        summary_algorithm=chosen_algorithm,
        discussion_points=discussion_points,
        decisions=decisions,
        action_items=action_items,
        pending_issues=pending_issues,
        stats=stats,
        sentiment=SentimentAnalytics(**sentiment_data),
        speaker_analytics=[SpeakerContribution(**sc) for sc in speaker_contribs],
        keywords=[KeywordItem(**kw) for kw in top_keywords],
        evaluation=RougeEvaluation(**rouge_eval),
        created_at=created_at_str
    )

@app.get("/meetings", response_model=List[MeetingListItem], tags=["Meetings"])
def get_meetings(q: Optional[str] = Query(None, description="Search query"), db: Session = Depends(get_db)):
    query = db.query(Meeting).order_by(desc(Meeting.created_at))
    if q and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            (Meeting.title.ilike(search_term)) |
            (Meeting.summary.ilike(search_term)) |
            (Meeting.participants.ilike(search_term))
        )
    meetings = query.all()

    results = []
    for m in meetings:
        try:
            parts = json.loads(m.participants) if m.participants else []
            items = json.loads(m.action_items) if m.action_items else []
            decs = json.loads(m.decisions) if m.decisions else []
            sent_data = json.loads(m.sentiment) if m.sentiment else {}
        except Exception:
            parts, items, decs, sent_data = [], [], [], {}

        snippet = (m.summary[:150] + "...") if len(m.summary) > 150 else m.summary

        results.append(
            MeetingListItem(
                id=m.id,
                title=m.title,
                date=m.date,
                participants=parts,
                summary_snippet=snippet,
                action_items_count=len(items),
                decisions_count=len(decs),
                created_at=m.created_at.strftime("%Y-%m-%d %H:%M") if m.created_at else None,
                sentiment_tone=sent_data.get("tone")
            )
        )
    return results

@app.get("/meetings/{meeting_id}", response_model=AnalyzeResponse, tags=["Meetings"])
def get_meeting_details(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    try:
        participants = json.loads(meeting.participants) if meeting.participants else []
        discussion_points = json.loads(meeting.discussion_points) if meeting.discussion_points else []
        decisions = json.loads(meeting.decisions) if meeting.decisions else []
        action_items_data = json.loads(meeting.action_items) if meeting.action_items else []
        action_items = [ActionItem(**item) for item in action_items_data]
        pending_issues = json.loads(meeting.pending_issues) if meeting.pending_issues else []
        stats_data = json.loads(meeting.stats) if meeting.stats else {}
        stats = MeetingStats(**stats_data) if stats_data else MeetingStats()
        
        sent_data = json.loads(meeting.sentiment) if meeting.sentiment else {}
        sentiment = SentimentAnalytics(**sent_data) if sent_data else None

        speaker_data = json.loads(meeting.speaker_analytics) if meeting.speaker_analytics else []
        speaker_analytics = [SpeakerContribution(**sc) for sc in speaker_data]

        keywords_data = json.loads(meeting.keywords) if meeting.keywords else []
        keywords = [KeywordItem(**kw) for kw in keywords_data]

        eval_data = json.loads(meeting.evaluation) if meeting.evaluation else {}
        evaluation = RougeEvaluation(**eval_data) if eval_data else None

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse stored meeting data: {str(e)}")

    return AnalyzeResponse(
        id=meeting.id,
        title=meeting.title,
        date=meeting.date,
        participants=participants,
        summary=meeting.summary,
        summary_type=meeting.summary_type,
        summary_algorithm=meeting.summary_algorithm or "tfidf_centroid",
        discussion_points=discussion_points,
        decisions=decisions,
        action_items=action_items,
        pending_issues=pending_issues,
        stats=stats,
        sentiment=sentiment,
        speaker_analytics=speaker_analytics,
        keywords=keywords,
        evaluation=evaluation,
        created_at=meeting.created_at.strftime("%Y-%m-%d %H:%M:%S") if meeting.created_at else None
    )

@app.patch("/meetings/{meeting_id}/action_items", tags=["Meetings"])
def update_action_item_status(
    meeting_id: int,
    update: ActionItemStatusUpdate,
    db: Session = Depends(get_db)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    try:
        items = json.loads(meeting.action_items) if meeting.action_items else []
        if 0 <= update.index < len(items):
            items[update.index]["status"] = update.status
            meeting.action_items = json.dumps(items)
            db.commit()
            return {"status": "success", "action_items": items}
        else:
            raise HTTPException(status_code=400, detail=f"Invalid action item index {update.index}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/meetings/{meeting_id}", tags=["Meetings"])
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    db.delete(meeting)
    db.commit()
    return {"status": "success", "message": f"Meeting #{meeting_id} deleted successfully"}

@app.get("/meetings/{meeting_id}/export/txt", tags=["Export"])
def export_meeting_txt(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    parts = json.loads(meeting.participants) if meeting.participants else []
    points = json.loads(meeting.discussion_points) if meeting.discussion_points else []
    decs = json.loads(meeting.decisions) if meeting.decisions else []
    items = json.loads(meeting.action_items) if meeting.action_items else []
    pending = json.loads(meeting.pending_issues) if meeting.pending_issues else []
    keywords = json.loads(meeting.keywords) if meeting.keywords else []
    sent_data = json.loads(meeting.sentiment) if meeting.sentiment else {}

    lines = [
        "=" * 72,
        f"MEETING MINUTES: {meeting.title.upper()}",
        "=" * 72,
        f"Date:         {meeting.date}",
        f"Participants: {', '.join(parts) if parts else 'Not specified'}",
        f"Meeting Tone: {sent_data.get('tone', 'Constructive')}",
        "-" * 72,
        "",
        "1. EXECUTIVE SUMMARY",
        f"Method: {meeting.summary_type}",
        meeting.summary,
        "",
        "2. TOP TOPICS & KEYWORDS",
    ]
    if keywords:
        lines.append("  " + " • ".join(k.get("keyword", "") for k in keywords))
    else:
        lines.append("  (No topic keywords extracted)")

    lines.extend(["", "3. KEY DISCUSSION POINTS"])
    for pt in points:
        lines.append(f"  * {pt}")
    if not points:
        lines.append("  (None extracted)")

    lines.extend(["", "4. DECISIONS MADE"])
    for d in decs:
        lines.append(f"  [CONFIRMED] {d}")
    if not decs:
        lines.append("  No explicit decisions were identified in the transcript.")

    lines.extend(["", "5. ACTION ITEMS & COMMITMENTS"])
    for idx, it in enumerate(items, 1):
        lines.append(f"  {idx}. Task:     {it.get('task')}")
        lines.append(f"     Assignee: {it.get('assignee', 'Not specified')}")
        lines.append(f"     Deadline: {it.get('due_date', 'Not specified')}")
        lines.append(f"     Status:   {it.get('status', 'Pending')}")
        lines.append("")
    if not items:
        lines.append("  No action items identified.")

    lines.extend(["", "6. PENDING ISSUES & NEXT STEPS"])
    for p in pending:
        lines.append(f"  * {p}")
    if not pending:
        lines.append("  (No pending issues flagged)")

    lines.extend(["", "=" * 72, "Generated by Smart Meeting Minutes Analyzer (MinuteFlow AI)", "=" * 72])
    content = "\n".join(lines)

    filename = f"minutes_{meeting.id}_{meeting.title.replace(' ', '_').lower()}.txt"
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/meetings/{meeting_id}/export/csv", tags=["Export"])
def export_action_items_csv(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    items = json.loads(meeting.action_items) if meeting.action_items else []
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Meeting Title", "Meeting Date", "Task Description", "Assignee", "Due Date", "Status"])

    for it in items:
        writer.writerow([
            meeting.title,
            meeting.date,
            it.get("task", ""),
            it.get("assignee", "Not specified"),
            it.get("due_date", "Not specified"),
            it.get("status", "Pending")
        ])

    csv_data = output.getvalue()
    filename = f"action_items_{meeting.id}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
