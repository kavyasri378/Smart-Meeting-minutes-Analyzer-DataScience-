import re
import numpy as np
from typing import List, Dict, Any, Tuple
from collections import Counter
from nlp.preprocessing import clean_text, split_sentences

# Filler phrases that typically do not belong in executive summaries
NOISE_PATTERNS = [
    r'can (you|everyone) hear me',
    r'can (you|everyone) see my screen',
    r'thanks? (everyone|you|guys)',
    r'good (morning|afternoon|evening)',
    r'hello (everyone|all)',
    r'how is everyone',
    r'bye bye|see you (all|tomorrow|next week)',
    r'let me share my screen',
    r'sorry (i was|im) on mute',
    r'okay great|sounds good|alright perfect',
    r'yeah exactly|makes sense'
]

# Important topic indicator words
IMPORTANCE_KEYWORDS = {
    "decide", "decided", "decision", "agree", "agreed", "agreement", "objective",
    "goal", "priority", "timeline", "deadline", "budget", "cost", "risk", "deliverable",
    "feature", "milestone", "launch", "release", "action", "status", "update", "issue",
    "blocker", "resolve", "resolved", "strategy", "approved", "review", "test", "demo",
    "implement", "optimize", "optimization", "architecture", "performance"
}

def is_noise_sentence(sentence: str) -> bool:
    """Check if a sentence is primarily conversational small-talk or meeting filler."""
    sent_lower = sentence.lower().strip()
    words = sent_lower.split()
    if len(words) < 5:
        # Very short phrases are rarely informative summaries
        return True
    for pat in NOISE_PATTERNS:
        if re.search(pat, sent_lower):
            return True
    return False

def calculate_sentence_weights(
    sentences: List[str],
    sentence_scores: np.ndarray
) -> np.ndarray:
    """
    Apply position weighting, keyword bonuses, and length penalties to sentence scores.
    """
    total = len(sentences)
    weighted_scores = np.copy(sentence_scores)

    for i, sent in enumerate(sentences):
        lower = sent.lower()
        words = lower.split()

        # Position weighting: favor agenda setting and conclusions
        rel_pos = i / max(1, total - 1)
        if rel_pos <= 0.15:
            # Beginning: introductions of agenda and goals
            weighted_scores[i] *= 1.15
        elif rel_pos >= 0.80:
            # Ending: wrap-up, decisions, next steps
            weighted_scores[i] *= 1.25

        # Keyword bonus
        keyword_hits = sum(1 for kw in IMPORTANCE_KEYWORDS if kw in lower)
        weighted_scores[i] *= (1.0 + min(0.4, 0.08 * keyword_hits))

        # Sentence length penalty (favor 10-35 words, penalize extremely long or short)
        if len(words) < 7:
            weighted_scores[i] *= 0.5
        elif len(words) > 50:
            weighted_scores[i] *= 0.85

        # Noise penalty
        if is_noise_sentence(sent):
            weighted_scores[i] *= 0.2

    return weighted_scores

def _get_target_sentence_count(total_sents: int, summary_length: str) -> int:
    """Determine number of sentences to extract based on length mode."""
    if summary_length == "short":
        target = max(2, min(4, int(np.ceil(total_sents * 0.20))))
    elif summary_length == "detailed":
        target = max(5, min(14, int(np.ceil(total_sents * 0.50))))
    else:  # medium (default)
        target = max(3, min(8, int(np.ceil(total_sents * 0.35))))
    return min(target, total_sents)

def summarize_tfidf(
    text: str,
    summary_length: str = "medium"
) -> Dict[str, Any]:
    """
    Extractive Summarization using Scikit-Learn TF-IDF vectorization and Centroid Similarity.
    """
    cleaned = clean_text(text)
    sentences = split_sentences(cleaned)

    if not sentences:
        return {
            "summary": "Transcript is empty or no valid sentences could be identified.",
            "method": "Extractive TF-IDF Centroid",
            "sentence_count": 0,
            "original_sentences": 0,
            "compression_ratio": 0.0,
            "selected_indices": []
        }

    if len(sentences) <= 3:
        return {
            "summary": " ".join(sentences),
            "method": "Extractive TF-IDF (Direct)",
            "sentence_count": len(sentences),
            "original_sentences": len(sentences),
            "compression_ratio": 1.0,
            "selected_indices": list(range(len(sentences)))
        }

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1
        )
        tfidf_matrix = vectorizer.fit_transform(sentences)

        # Compute document centroid (mean of all sentence TF-IDF vectors)
        centroid = np.asarray(tfidf_matrix.mean(axis=0))

        # Calculate cosine similarity of each sentence to the centroid
        raw_similarities = cosine_similarity(tfidf_matrix, centroid).flatten()

        # Apply structural and position weighting
        final_scores = calculate_sentence_weights(sentences, raw_similarities)

    except Exception:
        final_scores = np.zeros(len(sentences))
        for idx, sent in enumerate(sentences):
            words = [w.lower() for w in re.findall(r'\b[A-Za-z]{3,}\b', sent)]
            final_scores[idx] = sum(1 for w in words if w in IMPORTANCE_KEYWORDS) + len(words) * 0.05
        final_scores = calculate_sentence_weights(sentences, final_scores)

    target_count = _get_target_sentence_count(len(sentences), summary_length)
    top_indices = np.argsort(final_scores)[::-1][:target_count]
    chronological_indices = sorted(top_indices)
    selected_sentences = [sentences[idx] for idx in chronological_indices]

    return {
        "summary": " ".join(selected_sentences),
        "method": "Extractive TF-IDF (Scikit-Learn)",
        "sentence_count": len(selected_sentences),
        "original_sentences": len(sentences),
        "compression_ratio": round(len(selected_sentences) / max(1, len(sentences)), 2),
        "selected_indices": chronological_indices
    }

def summarize_textrank(
    text: str,
    summary_length: str = "medium",
    damping: float = 0.85,
    max_iter: int = 40,
    tol: float = 1e-4
) -> Dict[str, Any]:
    """
    Extractive Summarization using TextRank (PageRank centrality on sentence graph).
    Uses cosine similarity of TF-IDF vectors and power iteration.
    """
    cleaned = clean_text(text)
    sentences = split_sentences(cleaned)

    if not sentences:
        return {
            "summary": "Transcript is empty or no valid sentences could be identified.",
            "method": "TextRank (Graph Centrality)",
            "sentence_count": 0,
            "original_sentences": 0,
            "compression_ratio": 0.0,
            "selected_indices": []
        }

    if len(sentences) <= 3:
        return {
            "summary": " ".join(sentences),
            "method": "TextRank (Direct)",
            "sentence_count": len(sentences),
            "original_sentences": len(sentences),
            "compression_ratio": 1.0,
            "selected_indices": list(range(len(sentences)))
        }

    N = len(sentences)
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        vectorizer = TfidfVectorizer(stop_words='english', min_df=1)
        tfidf_matrix = vectorizer.fit_transform(sentences)
        sim_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

        # Set diagonal to zero (no self-loops)
        np.fill_diagonal(sim_matrix, 0.0)

        # Row normalization for transition matrix
        row_sums = sim_matrix.sum(axis=1)
        M = np.zeros_like(sim_matrix)
        for i in range(N):
            if row_sums[i] > 1e-6:
                M[i, :] = sim_matrix[i, :] / row_sums[i]
            else:
                M[i, :] = 1.0 / N

        # PageRank Power Iteration
        ranks = np.ones(N) / N
        for _ in range(max_iter):
            next_ranks = (1 - damping) / N + damping * np.dot(M.T, ranks)
            if np.linalg.norm(next_ranks - ranks, 1) < tol:
                break
            ranks = next_ranks

        final_scores = calculate_sentence_weights(sentences, ranks)

    except Exception:
        return summarize_tfidf(text, summary_length)

    target_count = _get_target_sentence_count(N, summary_length)
    top_indices = np.argsort(final_scores)[::-1][:target_count]
    chronological_indices = sorted(top_indices)
    selected_sentences = [sentences[idx] for idx in chronological_indices]

    return {
        "summary": " ".join(selected_sentences),
        "method": "TextRank (Graph Centrality)",
        "sentence_count": len(selected_sentences),
        "original_sentences": N,
        "compression_ratio": round(len(selected_sentences) / max(1, N), 2),
        "selected_indices": chronological_indices
    }

def summarize_frequency(
    text: str,
    summary_length: str = "medium"
) -> Dict[str, Any]:
    """
    Fast Lexical Frequency Centrality summarizer (baseline model).
    """
    cleaned = clean_text(text)
    sentences = split_sentences(cleaned)

    if len(sentences) <= 3:
        return {
            "summary": " ".join(sentences),
            "method": "Lexical Frequency Centrality",
            "sentence_count": len(sentences),
            "original_sentences": len(sentences),
            "compression_ratio": 1.0,
            "selected_indices": list(range(len(sentences)))
        }

    # Count word frequencies excluding stop words
    from nlp.preprocessing import extract_keywords_simple
    words = re.findall(r'\b[A-Za-z]{3,}\b', cleaned.lower())
    freq = Counter(words)
    max_f = max(freq.values()) if freq else 1

    scores = np.zeros(len(sentences))
    for i, s in enumerate(sentences):
        s_words = re.findall(r'\b[A-Za-z]{3,}\b', s.lower())
        if s_words:
            raw_score = sum(freq.get(w, 0) / max_f for w in s_words) / (len(s_words) ** 0.5)
            scores[i] = raw_score

    final_scores = calculate_sentence_weights(sentences, scores)
    target_count = _get_target_sentence_count(len(sentences), summary_length)
    top_indices = np.argsort(final_scores)[::-1][:target_count]
    chronological_indices = sorted(top_indices)
    selected_sentences = [sentences[idx] for idx in chronological_indices]

    return {
        "summary": " ".join(selected_sentences),
        "method": "Lexical Frequency Centrality",
        "sentence_count": len(selected_sentences),
        "original_sentences": len(sentences),
        "compression_ratio": round(len(selected_sentences) / max(1, len(sentences)), 2),
        "selected_indices": chronological_indices
    }

def summarize_dispatch(
    text: str,
    algorithm: str = "tfidf_centroid",
    summary_length: str = "medium"
) -> Dict[str, Any]:
    """
    Unified entrypoint for multiple summarization algorithms.
    Supported: 'tfidf_centroid', 'textrank', 'frequency'
    """
    alg = algorithm.lower().strip()
    if alg in ["textrank", "graph"]:
        return summarize_textrank(text, summary_length=summary_length)
    elif alg in ["frequency", "lexical"]:
        return summarize_frequency(text, summary_length=summary_length)
    else:
        return summarize_tfidf(text, summary_length=summary_length)
