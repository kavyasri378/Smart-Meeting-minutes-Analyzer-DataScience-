import sys
import os
import json

# Force UTF-8 output encoding for console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_demo(transcript_path, title, algorithm):
    print("=" * 80)
    print(f" ANALYZING: {title}")
    print(f" ALGORITHM: {algorithm}")
    print("=" * 80)

    with open(transcript_path, "r", encoding="utf-8") as f:
        transcript = f.read()

    payload = {
        "transcript": transcript,
        "title": title,
        "summary_length": "medium",
        "summary_algorithm": algorithm
    }

    res = client.post("/analyze", json=payload)
    if res.status_code != 200:
        print(f"ERROR: {res.status_code} - {res.text}")
        return

    data = res.json()
    print("\n[1] MEETING METADATA:")
    print(f"    * ID:           {data['id']}")
    print(f"    * Title:        {data['title']}")
    print(f"    * Date:         {data['date']}")
    print(f"    * Participants: {', '.join(data['participants'])}")
    print(f"    * Duration:     ~{data['stats']['estimated_duration_min']} mins ({data['stats']['word_count']} words, {data['stats']['sentence_count']} sentences)")

    print(f"\n[2] EXECUTIVE SUMMARY ({data['summary_type']}):")
    print(f"    \"{data['summary']}\"")
    print(f"    (Compression Ratio: {data['stats']['compression_ratio'] * 100:.1f}%)")

    print(f"\n[3] EXTRACTED DECISIONS ({len(data['decisions'])}):")
    for i, dec in enumerate(data['decisions'], 1):
        print(f"    {i}. {dec}")

    print(f"\n[4] ACTION ITEMS & ASSIGNEES ({len(data['action_items'])}):")
    for i, act in enumerate(data['action_items'], 1):
        print(f"    {i}. [{act['assignee']}] {act['task']}")
        print(f"       |-- Deadline: {act['due_date']} | Status: {act['status']}")

    print(f"\n[5] PENDING ISSUES & BLOCKERS ({len(data['pending_issues'])}):")
    for i, p in enumerate(data['pending_issues'], 1):
        print(f"    {i}. {p}")

    print(f"\n[6] MEETING SENTIMENT & TONE ANALYTICS:")
    s = data['sentiment']
    print(f"    * Overall Tone:    {s['tone']}")
    print(f"    * Polarity Score:  {s['score']:+.3f}")
    print(f"    * Distribution:    {s['breakdown']['positive']}% Positive | {s['breakdown']['neutral']}% Neutral | {s['breakdown']['critical']}% Critical/Blockers")
    print(f"    * Speaker Sentiment Breakdown:")
    for spk in s['speaker_sentiments']:
        print(f"       - {spk['speaker']}: Tone = '{spk['tone']}', Polarity = {spk['score']:+.3f} ({spk['utterance_count']} turns)")

    print(f"\n[7] SPEAKER PARTICIPATION (TALK-TIME):")
    for spk in data['speaker_analytics']:
        bar = "#" * int(spk['percentage'] / 5)
        print(f"    * {spk['speaker']:<12} : {spk['percentage']:>5.1f}% | {spk['words']:>3} words | {spk['turns']} turns [{bar}]")

    print(f"\n[8] TOPIC KEYWORDS:")
    kw_str = ", ".join([f"{k['keyword']} ({k['score']:.2f})" for k in data['keywords'][:6]])
    print(f"    {kw_str}")

    print(f"\n[9] NLP ROUGE BENCHMARK EVALUATION:")
    ev = data['evaluation']
    print(f"    * ROUGE-1 (Unigram Overlap):  P={ev['rouge_1']['precision']*100:.1f}%, R={ev['rouge_1']['recall']*100:.1f}%, F1={ev['rouge_1']['f1']*100:.1f}%")
    print(f"    * ROUGE-2 (Bigram Overlap):   P={ev['rouge_2']['precision']*100:.1f}%, R={ev['rouge_2']['recall']*100:.1f}%, F1={ev['rouge_2']['f1']*100:.1f}%")
    print(f"    * ROUGE-L (Longest Subseq):   P={ev['rouge_l']['precision']*100:.1f}%, R={ev['rouge_l']['recall']*100:.1f}%, F1={ev['rouge_l']['f1']*100:.1f}%")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    t1 = os.path.join(base, "sample_transcripts", "01_project_team_meeting.txt")
    run_demo(t1, "Sprint 14 Planning & Performance Optimization", "tfidf_centroid")
    
    t2 = os.path.join(base, "sample_transcripts", "02_college_project_review.txt")
    run_demo(t2, "AI Healthcare Triage - Capstone Project Review", "textrank")
