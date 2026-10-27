import re
from typing import List, Dict, Tuple, Optional

# Regex pattern for speaker prefixes like: "John:", "Dr. Smith:", "[09:30] Sarah:", "Alex C - "
SPEAKER_PATTERN = re.compile(
    r'^(?:\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*)?([A-Z][A-Za-z0-9\s\.\'-]{1,30}?)\s*(?::|—|-)\s*(.*)$'
)

# Common honorifics and abbreviations to avoid false sentence splits
ABBREVIATIONS = {
    "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "vs", "eg", "ie", "etc",
    "dept", "approx", "est", "inc", "ltd", "co", "fig", "jan", "feb", "mar",
    "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
    "mr.", "mrs.", "ms.", "dr.", "prof.", "sr.", "jr.", "vs.", "e.g.", "i.e.", "etc.",
    "dept.", "approx.", "est.", "inc.", "ltd.", "co.", "fig.", "jan.", "feb.", "mar.",
    "apr.", "jun.", "jul.", "aug.", "sep.", "sept.", "oct.", "nov.", "dec."
}

def clean_text(text: str) -> str:
    """Normalize whitespace, unicode quotes, dashes, and redundant characters."""
    if not text:
        return ""
    # Normalize unicode quotes and dashes
    text = text.replace('“', '"').replace('”', '"').replace('’', "'").replace('‘', "'")
    text = text.replace('–', '-').replace('—', '-')
    # Normalize spaces
    text = re.sub(r'[ \t]+', ' ', text)
    # Remove excessive blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def split_sentences_regex(text: str) -> List[str]:
    """
    Robust sentence segmentation that preserves abbreviations,
    decimal numbers, and currency values.
    """
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    all_sentences = []

    for para in paragraphs:
        speaker_match = SPEAKER_PATTERN.match(para)
        body = para
        prefix = ""
        if speaker_match:
            prefix = speaker_match.group(1).strip() + ": "
            body = speaker_match.group(2).strip()

        tokens = re.split(r'([.?!]+(?=\s+|$))', body)
        current = ""
        for i in range(0, len(tokens) - 1, 2):
            part = tokens[i].strip()
            punct = tokens[i + 1].strip()
            
            # Check if part ends with an abbreviation
            last_word = part.split()[-1].lower() if part.split() else ""
            clean_word = last_word.rstrip('.')
            if clean_word in ABBREVIATIONS or last_word in ABBREVIATIONS:
                current += part + punct + " "
                continue
            
            # Check for decimal numbers like "3.14" or "$5.5"
            if punct == "." and re.search(r'\d$', part) and i + 2 < len(tokens) and re.match(r'^\d', tokens[i + 2]):
                current += part + punct
                continue

            full_sent = (current + part + punct).strip()
            if full_sent:
                all_sentences.append(full_sent)
            current = ""

        if len(tokens) % 2 == 1 and tokens[-1].strip():
            remaining = (current + tokens[-1]).strip()
            if remaining:
                all_sentences.append(remaining)

    return [s for s in all_sentences if len(s) > 2]

def split_sentences(text: str) -> List[str]:
    """Segment text into sentences with regex preservation of abbreviations."""
    return split_sentences_regex(text)

def extract_speakers_and_utterances(text: str) -> Tuple[List[str], List[Dict[str, str]]]:
    """
    Extract unique speakers and segmented utterances from transcript.
    """
    cleaned = clean_text(text)
    lines = cleaned.split('\n')
    speakers = set()
    utterances = []
    current_speaker = "Unknown"

    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        match = SPEAKER_PATTERN.match(line)
        if match:
            spk = match.group(1).strip()
            content = match.group(2).strip()
            if len(spk) <= 25 and not any(char in spk for char in '?!,;'):
                speakers.add(spk)
                current_speaker = spk
                if content:
                    utterances.append({'speaker': current_speaker, 'text': content})
                continue

        utterances.append({'speaker': current_speaker, 'text': line})

    return sorted(list(speakers)), utterances

def extract_keywords_simple(text: str, top_n: int = 15) -> List[str]:
    """Extract frequent meaningful words for tags / topic clues."""
    from collections import Counter
    stopwords = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
        "by", "from", "up", "about", "into", "over", "after", "is", "are", "was", "were",
        "be", "been", "being", "have", "has", "had", "do", "does", "did", "can", "could",
        "will", "would", "shall", "should", "may", "might", "must", "that", "which",
        "who", "whom", "this", "these", "those", "it", "its", "we", "us", "our", "ours",
        "you", "your", "yours", "they", "them", "their", "theirs", "i", "me", "my", "mine",
        "so", "if", "then", "just", "also", "like", "well", "know", "think", "okay",
        "yeah", "yes", "no", "not", "going", "want", "need", "get", "make", "take",
        "see", "say", "said", "meeting", "today", "let", "lets", "everyone", "team"
    }
    words = re.findall(r'\b[A-Za-z]{3,}\b', text.lower())
    filtered = [w for w in words if w not in stopwords]
    counter = Counter(filtered)
    return [word for word, _ in counter.most_common(top_n)]
