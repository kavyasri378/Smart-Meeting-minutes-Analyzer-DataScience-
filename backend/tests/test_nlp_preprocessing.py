import unittest
from nlp.preprocessing import clean_text, split_sentences, extract_speakers_and_utterances, extract_keywords_simple

class TestNLPPreprocessing(unittest.TestCase):
    def test_clean_text_normalizes_quotes_and_spaces(self):
        raw = "“Hello  world” – testing ‘unicode’   quotes.\n\n\n\nNext line."
        cleaned = clean_text(raw)
        self.assertIn('"Hello world"', cleaned)
        self.assertIn("- testing 'unicode'", cleaned)
        self.assertNotIn("\n\n\n", cleaned)

    def test_split_sentences_preserves_abbreviations(self):
        text = "Dr. Smith met with Prof. Jones on Oct. 24. They discussed version 3.14."
        sents = split_sentences(text)
        self.assertGreaterEqual(len(sents), 2)
        # Should not split inside Dr. or Prof. or 3.14
        self.assertTrue(any("Dr. Smith" in s for s in sents))

    def test_extract_speakers_and_utterances(self):
        transcript = """
        Sarah: Good morning team.
        [09:31] Alex Rivera: Over the weekend I optimized queries.
        Michael Chang - I built the charts.
        """
        speakers, utterances = extract_speakers_and_utterances(transcript)
        self.assertIn("Sarah", speakers)
        self.assertIn("Alex Rivera", speakers)
        self.assertIn("Michael Chang", speakers)
        self.assertEqual(len(utterances), 3)

    def test_extract_keywords_simple(self):
        text = "Database latency in SQLite database queries must be optimized for performance."
        keywords = extract_keywords_simple(text, top_n=5)
        self.assertIn("database", keywords)

if __name__ == '__main__':
    unittest.main()
