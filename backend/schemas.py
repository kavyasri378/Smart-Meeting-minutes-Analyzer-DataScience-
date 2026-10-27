from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

class ActionItem(BaseModel):
    task: str = Field(..., description="Action item description")
    assignee: str = Field(default="Not specified", description="Responsible person")
    due_date: str = Field(default="Not specified", description="Target deadline")
    status: str = Field(default="Pending", description="Status (Pending, In Progress, Completed)")

class SpeakerContribution(BaseModel):
    speaker: str
    words: int
    percentage: float
    turns: int
    avg_words_per_turn: float

class SentimentTimelineItem(BaseModel):
    turn: int
    score: float
    label: str
    snippet: str

class SpeakerSentiment(BaseModel):
    speaker: str
    score: float
    tone: str
    utterance_count: int

class SentimentAnalytics(BaseModel):
    score: float = 0.0
    tone: str = "Constructive"
    breakdown: Dict[str, float] = Field(default_factory=lambda: {"positive": 33.3, "neutral": 33.4, "critical": 33.3})
    timeline: List[SentimentTimelineItem] = []
    speaker_sentiments: List[SpeakerSentiment] = []

class KeywordItem(BaseModel):
    keyword: str
    score: float

class RougeScoreDetail(BaseModel):
    precision: float
    recall: float
    f1: float

class RougeEvaluation(BaseModel):
    rouge_1: RougeScoreDetail
    rouge_2: RougeScoreDetail
    rouge_l: RougeScoreDetail

class AnalyzeRequest(BaseModel):
    title: Optional[str] = "Untitled Meeting"
    date: Optional[str] = None
    participants: Optional[List[str]] = []
    transcript: str = Field(default="", description="Raw meeting transcript")
    summary_length: Literal["short", "medium", "detailed"] = "medium"
    summary_algorithm: Literal["tfidf_centroid", "textrank", "frequency"] = "tfidf_centroid"
    save_to_db: bool = True

class MeetingStats(BaseModel):
    word_count: int = 0
    sentence_count: int = 0
    estimated_duration_min: int = 0
    reading_time_min: float = 0.0
    action_items_count: int = 0
    decisions_count: int = 0
    compression_ratio: float = 0.0

class AnalyzeResponse(BaseModel):
    id: Optional[int] = None
    title: str
    date: str
    participants: List[str]
    summary: str
    summary_type: str
    summary_algorithm: str = "tfidf_centroid"
    discussion_points: List[str]
    decisions: List[str]
    action_items: List[ActionItem]
    pending_issues: List[str]
    stats: MeetingStats
    sentiment: Optional[SentimentAnalytics] = None
    speaker_analytics: List[SpeakerContribution] = []
    keywords: List[KeywordItem] = []
    evaluation: Optional[RougeEvaluation] = None
    created_at: Optional[str] = None

class MeetingListItem(BaseModel):
    id: int
    title: str
    date: str
    participants: List[str]
    summary_snippet: str
    action_items_count: int
    decisions_count: int
    created_at: Optional[str] = None
    sentiment_tone: Optional[str] = None

class ActionItemStatusUpdate(BaseModel):
    index: int
    status: Literal["Pending", "In Progress", "Completed"]

class DashboardStats(BaseModel):
    total_meetings: int
    total_action_items: int
    total_decisions: int
    pending_action_items: int
    completed_action_items: int
    recent_meetings: List[MeetingListItem]

class BenchmarkItem(BaseModel):
    algorithm: str
    type: str
    rouge_1_f1: float
    rouge_2_f1: float
    rouge_l_f1: float
    avg_latency_ms: float
    zero_hallucination: bool
    recommended: bool
