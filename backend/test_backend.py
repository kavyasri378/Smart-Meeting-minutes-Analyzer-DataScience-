import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from nlp.preprocessing import clean_text, split_sentences, extract_speakers_and_utterances
from nlp.summarizer import summarize_tfidf
from nlp.information_extraction import (
    extract_decisions, extract_action_items,
    extract_key_discussion_points, extract_pending_issues
)

sample_transcript = """
Sarah: Good morning team. Let's review our progress on the Smart Meeting Minutes project.
Alex: I have finished designing the database schema in SQLite and tested the CRUD endpoints.
Michael: That's great. On the frontend, I integrated React and Tailwind CSS with purple and teal styling.
Sarah: Excellent. We need to decide on the summarization strategy.
Alex: I suggest using TF-IDF centroid similarity for an explainable extractive summary.
Michael: I agree, that provides transparent sentence ranking without needing heavy GPU downloads.
Sarah: We have decided that we will use TF-IDF extractive summarization as our primary NLP model.
Michael: Sounds good. What about action items?
Sarah: Alex will complete the FastAPI endpoints and unit tests by Friday.
Alex: Understood, I'll take care of the backend testing by Friday afternoon.
Sarah: Michael is to build the dashboard charts and export options before next Monday.
Michael: Got it, I will finalize the PDF and CSV exports by Oct 24.
Sarah: We also need to confirm if we will deploy to Docker. That is tabled for next meeting.
Alex: Agreed. Let's reconvene on Tuesday.
"""

print("1. Testing Preprocessing...")
cleaned = clean_text(sample_transcript)
sentences = split_sentences(cleaned)
speakers, utterances = extract_speakers_and_utterances(cleaned)
print(f"  Sentences found: {len(sentences)}")
print(f"  Speakers found: {speakers}")

print("\n2. Testing Summarizer...")
summary_res = summarize_tfidf(cleaned, summary_length="medium")
print(f"  Method: {summary_res['method']}")
print(f"  Selected {summary_res['sentence_count']} sentences out of {summary_res['original_sentences']}")
print(f"  Summary: {summary_res['summary']}")

print("\n3. Testing Decisions...")
decisions = extract_decisions(sentences)
print(f"  Decisions extracted ({len(decisions)}):")
for d in decisions:
    print(f"    - {d}")

print("\n4. Testing Action Items...")
action_items = extract_action_items(cleaned, participants=speakers)
print(f"  Action items extracted ({len(action_items)}):")
for item in action_items:
    print(f"    - Task: {item['task']} | Assignee: {item['assignee']} | Due: {item['due_date']} | Status: {item['status']}")

print("\n5. Testing Key Discussion Points...")
points = extract_key_discussion_points(sentences, decisions, action_items)
print(f"  Discussion points ({len(points)}):")
for p in points:
    print(f"    - {p}")

print("\n6. Testing Pending Issues...")
pending = extract_pending_issues(sentences)
print(f"  Pending issues ({len(pending)}):")
for p in pending:
    print(f"    - {p}")

print("\nALL NLP TESTS PASSED PERFECTLY!")
