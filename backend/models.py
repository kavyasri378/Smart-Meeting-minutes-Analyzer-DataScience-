from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, default="Untitled Meeting")
    date = Column(String(64), nullable=False)
    participants = Column(Text, default="[]")  # JSON encoded list of names
    transcript = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    summary_type = Column(String(64), default="Extractive TF-IDF")
    summary_algorithm = Column(String(64), default="tfidf_centroid")
    discussion_points = Column(Text, default="[]")  # JSON encoded list
    decisions = Column(Text, default="[]")  # JSON encoded list
    action_items = Column(Text, default="[]")  # JSON encoded list of objects
    pending_issues = Column(Text, default="[]")  # JSON encoded list
    stats = Column(Text, default="{}")  # JSON encoded stats dict
    sentiment = Column(Text, default="{}")  # JSON encoded sentiment dict
    speaker_analytics = Column(Text, default="[]")  # JSON encoded speaker analytics list
    keywords = Column(Text, default="[]")  # JSON encoded keywords list
    evaluation = Column(Text, default="{}")  # JSON encoded ROUGE evaluation dict
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
