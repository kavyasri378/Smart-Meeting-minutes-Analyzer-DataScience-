import re
from typing import List, Dict, Any, Optional, Tuple
from nlp.preprocessing import clean_text, split_sentences, extract_speakers_and_utterances

# Decision trigger phrases indicating explicit conclusion or consensus
DECISION_PATTERNS = [
    r'\b(?:we\s+(?:have\s+)?decided\s+(?:that|to)?|it\s+was\s+decided\s+(?:that|to)?)\b',
    r'\b(?:(?:we\s+)?(?:all\s+)?agreed\s+(?:that|to|on)|consensus\s+(?:was|is)\s+(?:that|to)?)\b',
    r'\b(?:the\s+final\s+decision\s+is\s+to|decision\s*(?::|is)\s*)\b',
    r'\b(?:concluded\s+that|resolved\s+that|approved\s+(?:that|to|the)?)\b',
    r'\b(?:we\s+will\s+go\s+with|settled\s+on|finalized\s+(?:that|the)?)\b',
    r'\b(?:motion\s+(?:carried|passed)|confirmed\s+that)\b'
]

# Suggestion / speculative markers that must NOT be counted as confirmed decisions
SUGGESTION_MARKERS = [
    r'\b(?:maybe\s+we\s+should|what\s+if\s+we|i\s+suggest|i\s+propose)\b',
    r'\b(?:should\s+we|could\s+we|perhaps\s+we|might\s+want\s+to)\b',
    r'\b(?:wondering\s+if|would\s+it\s+be\s+better|let\'s\s+consider)\b'
]

# Due date / deadline regex patterns
DUE_DATE_PATTERNS = [
    # "by Friday", "by next Monday", "by Wednesday afternoon", "by tomorrow evening", "by tonight", "by end of day", "by EOD"
    r'\b(?:by|before|due|until|no\s+later\s+than)\s+(?:the\s+)?((?:next\s+|this\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:afternoon|evening|morning|night))?|tomorrow(?:\s+(?:afternoon|evening|morning|night))?|tonight|eod|end\s+of\s+(?:day|week|month|sprint)|next\s+week(?:\s+morning)?)\b',
    # "by Oct 24th", "before November 5", "by 15th of March", "by Oct 31"
    r'\b(?:by|before|due|until)\s+((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)\b',
    # "by 10/24/2026" or "by 2026-10-24"
    r'\b(?:by|before|due)\s+(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{4}-\d{2}-\d{2})\b',
    # "by end of Q3", "by sprint 4"
    r'\b(?:by|before)\s+((?:end\s+of\s+)?(?:q[1-4]|sprint\s+\d+))\b'
]

# Pending issues / follow-up patterns
PENDING_PATTERNS = [
    r'\b(?:(?:one\s+)?pending\s+(?:issue|question|matter|decision|item|topic|approval|feedback|clarification))\b',
    r'\b(?:tabled\s+(?:for|until)|postponed\s+(?:until|to)|deferred\s+to)\b',
    r'\b(?:revisit\s+(?:this|next|at\s+the\s+next)|follow[- ]up\s+(?:on|with)?)\b',
    r'\b(?:open\s+question|unresolved|blocker|impediment)\b',
    r'\b(?:need\s+to\s+(?:confirm|verify|check\s+with|ask|determine))\b',
    r'\b(?:we\s+still\s+need\s+to\s+determine)\b',
    r'\b(?:to\s+be\s+determined|tbd)\b'
]

def clean_sentence_for_display(sent: str) -> str:
    """Strip speaker tags, timestamps, and leading punctuation."""
    s = re.sub(r'^(?:\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*)?[A-Z][A-Za-z0-9\s\.\'-]{1,30}?(?::|—|-)\s*', '', sent)
    s = s.strip()
    if s:
        s = s[0].upper() + s[1:]
    return s

def clean_participant_name(raw_name: str) -> str:
    """Strip parenthetical roles like '(Tech Lead)' or '(Frontend)' to get the human name."""
    cleaned = re.sub(r'\s*\([^)]*\)', '', raw_name).strip()
    return cleaned if cleaned else raw_name.strip()

def build_participant_lookup(participants: List[str]) -> Dict[str, str]:
    """
    Create lookup dictionary mapping first names, last names, and full names
    to the canonical participant name. Prioritizes full names over single names.
    """
    lookup = {}
    sorted_participants = sorted(participants, key=lambda x: len(clean_participant_name(x).split()), reverse=True)
    for p in sorted_participants:
        clean = clean_participant_name(p)
        if not clean:
            continue
        key = clean.lower()
        if key not in lookup or len(lookup[key].split()) < len(clean.split()):
            lookup[key] = clean
        parts = clean.split()
        if len(parts) >= 2:
            first = parts[0].lower()
            if first not in lookup or len(lookup[first].split()) < len(parts):
                lookup[first] = clean
            full = f"{parts[0]} {parts[-1]}".lower()
            if full not in lookup or len(lookup[full].split()) < len(parts):
                lookup[full] = clean
    return lookup

def extract_decisions(sentences: List[str]) -> List[str]:
    """
    Extract explicitly confirmed decisions from sentences.
    Avoids hypothetical suggestions, question-sentences, and speculative discussion.
    """
    decisions = []
    seen = set()

    for sent in sentences:
        sent_clean = sent.strip()
        if not sent_clean or sent_clean.endswith('?'):
            continue

        sent_lower = sent_clean.lower()

        # Reject hypothetical / speculative remarks
        if any(re.search(pat, sent_lower) for pat in SUGGESTION_MARKERS):
            continue

        for pattern in DECISION_PATTERNS:
            if re.search(pattern, sent_lower):
                cleaned = clean_sentence_for_display(sent_clean)
                norm_key = re.sub(r'[^a-z0-9]', '', cleaned.lower())
                if norm_key not in seen and len(cleaned.split()) >= 4:
                    seen.add(norm_key)
                    decisions.append(cleaned)
                break

    return decisions

def extract_deadline(text: str) -> str:
    """Extract due date or deadline phrase from sentence text."""
    text_lower = text.lower()
    for pattern in DUE_DATE_PATTERNS:
        match = re.search(pattern, text_lower, re.IGNORECASE)
        if match:
            raw_date = match.group(1).strip()
            # Standardize common variations
            raw_title = raw_date.title()
            if "Eod" in raw_title:
                raw_title = raw_title.replace("Eod", "EOD")
            return raw_title
    return "Not specified"

def extract_assignee(
    sentence: str,
    speaker: str,
    participant_lookup: Dict[str, str]
) -> str:
    """
    Extract the responsible person from sentence context, speaker tag, or participant lookup.
    Resolves first names to full canonical names.
    """
    sent_lower = sentence.lower()

    # Pattern 1: Explicit "assigned to <Name>"
    assigned_match = re.search(r'\bassigned\s+to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b', sentence)
    if assigned_match:
        cand = assigned_match.group(1).strip()
        return participant_lookup.get(cand.lower(), cand)

    # Pattern 2: Direct assignment "<Name> will / shall / is to / is going to / to handle"
    for name_key, canonical in participant_lookup.items():
        name_pat = rf'\b{re.escape(name_key)}\s+(?:will|shall|is\s+to|is\s+going\s+to|to|must|should|can)\b'
        if re.search(name_pat, sent_lower):
            return canonical

    # Pattern 3: First-person commitment ("I will...", "I'll take care of...", "I can...")
    if re.search(r'\b(i\s+will|i\'ll|i\s+can|i\s+am\s+going\s+to|i\s+have\s+to|i\s+will\s+take\s+care)\b', sent_lower):
        clean_spk = clean_participant_name(speaker)
        if clean_spk and clean_spk.lower() not in ["unknown", "none", ""]:
            return participant_lookup.get(clean_spk.lower(), clean_spk)

    # Pattern 4: General Capitalized Name before "will" or "is to"
    general_match = re.search(r'\b([A-Z][a-z]+)\s+(?:will|shall|is\s+to|is\s+going\s+to)\s+[a-z]+', sentence)
    if general_match:
        cand = general_match.group(1).strip()
        if cand.lower() not in {"this", "that", "there", "what", "which", "then", "when", "how", "so", "we", "they"}:
            return participant_lookup.get(cand.lower(), cand)

    return "Not specified"

def extract_action_items(
    text: str,
    participants: Optional[List[str]] = None
) -> List[Dict[str, str]]:
    """
    Extract structured tasks with description, owner, deadline, and status.
    Intelligently handles turn confirmations and filters false positives.
    """
    if participants is None:
        participants = []

    speakers, utterances = extract_speakers_and_utterances(text)
    combined = list(set(participants + speakers))
    participant_lookup = build_participant_lookup(combined)

    sentences = split_sentences(text)
    action_items: List[Dict[str, str]] = []
    seen_tasks = set()

    for sent in sentences:
        sent_clean = sent.strip()
        if not sent_clean or sent_clean.endswith('?'):
            continue

        sent_lower = sent_clean.lower()

        # Filter out UI descriptions or non-task occurrences of "action item"
        if re.search(r'\b(?:user\s+can|action\s+items\s+table|list\s+of\s+action\s+items)\b', sent_lower):
            continue

        is_action = False

        # Action item keywords
        if any(term in sent_lower for term in [
            "assigned to", "responsible for", "will deliver",
            "will prepare", "will update", "will create", "will build", "will implement",
            "will review", "will send", "will contact", "will finalize", "will share",
            "will schedule", "will follow up", "will configure", "will refine", "will submit",
            "will upload", "will launch", "is to complete", "is to build", "is to finalize",
            "is to prepare", "needs to complete", "has to complete", "action item:"
        ]):
            is_action = True
        elif re.search(r'\b(?:will|shall|is\s+to|going\s+to|needs?\s+to)\s+[a-z]+', sent_lower):
            if any(re.search(pat, sent_lower) for pat in DUE_DATE_PATTERNS) or "assigned" in sent_lower or "i will" in sent_lower:
                is_action = True

        if not is_action:
            continue

        # Determine speaker for this sentence
        current_speaker = "Unknown"
        for utt in utterances:
            if sent_clean in utt['text'] or utt['text'] in sent_clean:
                current_speaker = utt['speaker']
                break

        owner = extract_assignee(sent_clean, current_speaker, participant_lookup)
        deadline = extract_deadline(sent_clean)
        display_task = clean_sentence_for_display(sent_clean)

        task_key = re.sub(r'[^a-z0-9]', '', display_task.lower()[:45])
        if task_key not in seen_tasks and len(display_task.split()) >= 4:
            seen_tasks.add(task_key)
            action_items.append({
                "task": display_task,
                "assignee": owner,
                "due_date": deadline,
                "status": "Pending"
            })

    # Deduplicate consecutive assignment + confirmation turns (e.g. Lead assigns -> Assignee confirms)
    deduped_items: List[Dict[str, str]] = []
    for item in action_items:
        is_duplicate = False
        for existing in deduped_items:
            # If same assignee and same deadline (or one is not specified)
            if existing["assignee"] != "Not specified" and existing["assignee"] == item["assignee"]:
                # Check deadline overlap
                d1, d2 = existing["due_date"].lower(), item["due_date"].lower()
                deadline_matches = (d1 == d2) or (d1 in d2) or (d2 in d1) or (d1 == "not specified") or (d2 == "not specified")
                if deadline_matches:
                    # Keep whichever has the richer, more specific deadline or longer description
                    if len(item["due_date"]) > len(existing["due_date"]) and item["due_date"] != "Not specified":
                        existing["due_date"] = item["due_date"]
                    # If existing task was an imperative assignment, keep it or append confirmation details
                    is_duplicate = True
                    break
        if not is_duplicate:
            deduped_items.append(item)

    return deduped_items

def extract_key_discussion_points(
    sentences: List[str],
    decisions: List[str],
    action_items: List[Dict[str, str]],
    top_n: int = 5
) -> List[str]:
    """
    Extract high-value discussion points, excluding verbatim decisions and noise.
    """
    from nlp.summarizer import is_noise_sentence, IMPORTANCE_KEYWORDS

    points = []
    seen = set()
    decision_keys = {re.sub(r'[^a-z0-9]', '', d.lower()[:35]) for d in decisions}
    action_keys = {re.sub(r'[^a-z0-9]', '', a['task'].lower()[:35]) for a in action_items}

    scored_sentences = []
    for s in sentences:
        s_clean = s.strip()
        if is_noise_sentence(s_clean) or s_clean.endswith('?'):
            continue
        s_lower = s_clean.lower()
        key = re.sub(r'[^a-z0-9]', '', s_clean.lower()[:35])
        if key in decision_keys or key in action_keys:
            continue

        words = s_lower.split()
        if len(words) < 6 or len(words) > 45:
            continue

        score = sum(1.5 for kw in IMPORTANCE_KEYWORDS if kw in s_lower)
        if any(w in s_lower for w in ["discussed", "focused on", "reviewed", "presented", "noted that", "highlighted", "addressed", "evaluated", "profiled", "suggested"]):
            score += 2.0

        scored_sentences.append((score, clean_sentence_for_display(s_clean)))

    scored_sentences.sort(key=lambda x: x[0], reverse=True)

    for _, text in scored_sentences:
        norm = re.sub(r'[^a-z0-9]', '', text.lower())
        if norm not in seen:
            seen.add(norm)
            points.append(text)
            if len(points) >= top_n:
                break

    if not points and sentences:
        for s in sentences:
            if not is_noise_sentence(s) and len(s.split()) >= 6:
                points.append(clean_sentence_for_display(s))
                if len(points) >= 3:
                    break

    return points

def extract_pending_issues(sentences: List[str]) -> List[str]:
    """
    Extract open questions, deferred items, and blockers.
    """
    pending = []
    seen = set()

    for sent in sentences:
        sent_clean = sent.strip()
        sent_lower = sent_clean.lower()
        for pat in PENDING_PATTERNS:
            if re.search(pat, sent_lower):
                cleaned = clean_sentence_for_display(sent_clean)
                norm = re.sub(r'[^a-z0-9]', '', cleaned.lower())
                if norm not in seen and len(cleaned.split()) >= 4:
                    seen.add(norm)
                    pending.append(cleaned)
                break

    return pending
