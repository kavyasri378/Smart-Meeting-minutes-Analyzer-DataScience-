import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from nlp.preprocessing import clean_text, split_sentences, extract_speakers_and_utterances
from nlp.summarizer import summarize_tfidf
from nlp.information_extraction import extract_decisions, extract_action_items, extract_key_discussion_points, extract_pending_issues

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
samples = [
    (os.path.join(base_dir, "sample_transcripts", "01_project_team_meeting.txt"), "Engineering"),
    (os.path.join(base_dir, "sample_transcripts", "02_college_project_review.txt"), "Capstone"),
    (os.path.join(base_dir, "sample_transcripts", "03_business_planning_meeting.txt"), "Business")
]

for path, name in samples:
    if not os.path.exists(path):
        print(f"File {path} not found")
        continue
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    cleaned = clean_text(text)
    sents = split_sentences(cleaned)
    spk, utt = extract_speakers_and_utterances(cleaned)
    summ = summarize_tfidf(cleaned, "medium")
    decs = extract_decisions(sents)
    actions = extract_action_items(cleaned, spk)
    pending = extract_pending_issues(sents)
    print(f"=== {name} ===")
    print(f"Speakers ({len(spk)}): {spk}")
    print(f"Decisions ({len(decs)}): {decs}")
    print(f"Action Items ({len(actions)}):")
    for a in actions:
        print(f"  - [{a['assignee']}] {a['task']} (Due: {a['due_date']})")
    print(f"Pending ({len(pending)}): {pending}")
    print()
