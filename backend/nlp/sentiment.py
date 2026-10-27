import re
from typing import List, Dict, Any, Tuple
from collections import Counter
from nlp.preprocessing import clean_text, split_sentences

# Lexicons tailored for professional meetings and collaborative discussions
POSITIVE_TERMS = {
    "great", "excellent", "progress", "agreed", "solid", "perfect", "approved", "success",
    "successful", "good", "resolve", "resolved", "optimizations", "reduced", "reduce",
    "faster", "productive", "achievement", "completed", "finish", "finished", "excited",
    "clear", "helpful", "confidence", "support", "supported", "innovative", "effective",
    "efficient", "stable", "smooth", "concur", "consensus", "aligned", "forward", "impressive"
}

CRITICAL_TERMS = {
    "latency", "issue", "issues", "problem", "problems", "bug", "bugs", "blocker", "blockers",
    "delay", "delayed", "expensive", "risk", "risks", "missing", "slow", "failure", "fail",
    "failed", "bottleneck", "concern", "concerned", "conflict", "difficult", "unresolved",
    "overdue", "error", "errors", "impediment", "vulnerable", "warning", "caution"
}

ACTION_TERMS = {
    "will", "implement", "create", "build", "complete", "deploy", "deliver", "review",
    "test", "tests", "finalize", "optimize", "schedule", "launch", "verify", "execute",
    "action", "commit", "prepare", "organize"
}

NEGATION_TERMS = {"not", "never", "no", "hardly", "barely", "scarcely", "without", "cannot", "cant", "couldnt", "wont"}

INTENSIFIERS = {"very", "extremely", "significantly", "highly", "substantially", "totally", "completely"}

def score_sentence_sentiment(sentence: str) -> float:
    """
    Compute polarity score for a sentence (-1.0 to +1.0)
    Accounts for negations and intensifiers.
    """
    words = re.findall(r'\b[A-Za-z\'-]+\b', sentence.lower())
    if not words:
        return 0.0

    score = 0.0
    is_negated = False
    multiplier = 1.0

    for i, word in enumerate(words):
        if word in NEGATION_TERMS:
            is_negated = True
            continue

        if word in INTENSIFIERS:
            multiplier = 1.6
            continue

        weight = 0.0
        if word in POSITIVE_TERMS:
            weight = 1.0 * multiplier
        elif word in CRITICAL_TERMS:
            weight = -1.0 * multiplier
        elif word in ACTION_TERMS:
            weight = 0.3 * multiplier

        if weight != 0.0:
            if is_negated:
                weight = -weight * 0.7
                is_negated = False
            score += weight
            multiplier = 1.0

    # Normalize by sentence length
    normalized = score / max(1.0, len(words) ** 0.5)
    return max(-1.0, min(1.0, round(normalized, 3)))

def analyze_meeting_sentiment(
    text: str,
    utterances: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Perform multi-level sentiment and meeting tone analytics.
    Returns overall tone, score, tone breakdown, and per-speaker sentiment.
    """
    sentences = split_sentences(text)
    if not sentences:
        return {
            "score": 0.0,
            "tone": "Neutral / Informational",
            "breakdown": {"positive": 33.3, "neutral": 33.4, "critical": 33.3},
            "sentiment_timeline": [],
            "speaker_sentiments": []
        }

    sent_scores = []
    positive_count = 0
    neutral_count = 0
    critical_count = 0

    timeline = []
    for idx, s in enumerate(sentences):
        sc = score_sentence_sentiment(s)
        sent_scores.append(sc)
        if sc > 0.15:
            positive_count += 1
            label = "Positive"
        elif sc < -0.15:
            critical_count += 1
            label = "Critical / Blocker"
        else:
            neutral_count += 1
            label = "Neutral"

        if idx < 12:  # sample timeline for chart
            timeline.append({
                "turn": idx + 1,
                "score": sc,
                "label": label,
                "snippet": (s[:60] + "...") if len(s) > 60 else s
            })

    total = len(sentences)
    pos_pct = round((positive_count / total) * 100, 1)
    neu_pct = round((neutral_count / total) * 100, 1)
    crit_pct = round((critical_count / total) * 100, 1)

    avg_score = round(float(sum(sent_scores) / total), 3)

    # Classify overall tone
    if avg_score >= 0.20:
        overall_tone = "Highly Collaborative & Productive"
    elif avg_score >= 0.05:
        overall_tone = "Constructive & Forward-Looking"
    elif avg_score <= -0.15:
        overall_tone = "Critical / Problem-Solving Focus"
    else:
        overall_tone = "Neutral & Informational"

    # Per-speaker sentiment
    speaker_scores: Dict[str, List[float]] = {}
    for utt in utterances:
        spk = utt.get("speaker", "Unknown")
        sc = score_sentence_sentiment(utt.get("text", ""))
        speaker_scores.setdefault(spk, []).append(sc)

    speaker_sentiments = []
    for spk, scores in speaker_scores.items():
        if spk.lower() in ["unknown", "none", ""]:
            continue
        spk_avg = round(float(sum(scores) / max(1, len(scores))), 3)
        if spk_avg >= 0.15:
            st_label = "Positive / Encouraging"
        elif spk_avg <= -0.15:
            st_label = "Challenging / Problem-Solving"
        else:
            st_label = "Constructive"
        speaker_sentiments.append({
            "speaker": spk,
            "score": spk_avg,
            "tone": st_label,
            "utterance_count": len(scores)
        })

    return {
        "score": avg_score,
        "tone": overall_tone,
        "breakdown": {
            "positive": pos_pct,
            "neutral": neu_pct,
            "critical": crit_pct
        },
        "timeline": timeline,
        "speaker_sentiments": speaker_sentiments
    }

def analyze_speaker_contributions(
    utterances: List[Dict[str, str]],
    total_words: int
) -> List[Dict[str, Any]]:
    """
    Compute speaking time distribution, word share, and turn counts per speaker.
    """
    speaker_data: Dict[str, Dict[str, int]] = {}

    for utt in utterances:
        spk = utt.get("speaker", "Unknown").strip()
        if not spk or spk.lower() in ["unknown", "none"]:
            continue
        text = utt.get("text", "")
        word_count = len(text.split())

        if spk not in speaker_data:
            speaker_data[spk] = {"words": 0, "turns": 0}
        speaker_data[spk]["words"] += word_count
        speaker_data[spk]["turns"] += 1

    total_spoken_words = sum(d["words"] for d in speaker_data.values()) or max(1, total_words)

    results = []
    for spk, data in sorted(speaker_data.items(), key=lambda x: x[1]["words"], reverse=True):
        words = data["words"]
        turns = data["turns"]
        pct = round((words / total_spoken_words) * 100, 1)
        avg_turn_words = round(words / max(1, turns), 1)
        results.append({
            "speaker": spk,
            "words": words,
            "percentage": pct,
            "turns": turns,
            "avg_words_per_turn": avg_turn_words
        })

    return results

def extract_top_keywords(text: str, top_n: int = 8) -> List[Dict[str, Any]]:
    """
    Extract salient n-gram keyphrases and topics using Scikit-Learn TF-IDF.
    """
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        sentences = split_sentences(text)
        if len(sentences) < 2:
            return []

        vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            stop_words='english',
            min_df=1,
            max_df=0.9
        )
        tfidf_matrix = vectorizer.fit_transform(sentences)
        feature_names = vectorizer.get_feature_names_out()

        # Sum TF-IDF scores across sentences
        scores = tfidf_matrix.sum(axis=0).A1
        scored_terms = sorted(zip(feature_names, scores), key=lambda x: x[1], reverse=True)

        # Filter out numbers, single characters, and conversational fillers
        stopwords_extra = {
            "meeting", "today", "team", "let", "lets", "everyone", "thanks",
            "alex", "sarah", "michael", "elena", "david", "priya", "marcus",
            "daniel", "robert", "chloe", "jessica", "morning", "afternoon", "hello"
        }

        keywords = []
        seen = set()
        for term, sc in scored_terms:
            t = term.strip().lower()
            if len(t) < 4 or t.isdigit():
                continue
            if any(w in stopwords_extra for w in t.split()):
                continue
            # avoid sub-string duplicates
            if any(t in s or s in t for s in seen):
                continue

            seen.add(t)
            keywords.append({
                "keyword": t.title(),
                "score": round(float(sc), 2)
            })
            if len(keywords) >= top_n:
                break

        return keywords
    except Exception:
        # Fallback to simple frequency extraction
        words = re.findall(r'\b[A-Za-z]{4,}\b', text.lower())
        c = Counter(words)
        return [{"keyword": k.title(), "score": float(v)} for k, v in c.most_common(top_n)]
