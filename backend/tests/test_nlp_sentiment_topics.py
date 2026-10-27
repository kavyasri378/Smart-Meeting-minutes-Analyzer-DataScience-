import unittest
from nlp.sentiment import analyze_meeting_sentiment, analyze_speaker_contributions, extract_top_keywords

class TestNLPSentimentTopics(unittest.TestCase):
    def setUp(self):
        self.utterances = [
            {"speaker": "Sarah", "text": "Good morning team. We have great progress on our sprint."},
            {"speaker": "Alex", "text": "We experienced database latency issues, but adding indexes resolved the problem."},
            {"speaker": "Michael", "text": "The frontend components look solid and test suites are passing perfectly."},
            {"speaker": "Sarah", "text": "Excellent work everyone, let's keep this productive momentum."}
        ]
        self.text = " ".join(u["text"] for u in self.utterances)

    def test_analyze_meeting_sentiment(self):
        sent = analyze_meeting_sentiment(self.text, self.utterances)
        self.assertIn("score", sent)
        self.assertIn("tone", sent)
        self.assertIn("breakdown", sent)
        self.assertIn("speaker_sentiments", sent)
        self.assertGreater(sent["breakdown"]["positive"], 0)
        self.assertGreaterEqual(len(sent["speaker_sentiments"]), 3)

    def test_analyze_speaker_contributions(self):
        total_words = len(self.text.split())
        contribs = analyze_speaker_contributions(self.utterances, total_words)
        self.assertEqual(len(contribs), 3)
        # Sum of percentages should be ~100%
        pct_sum = sum(c["percentage"] for c in contribs)
        self.assertAlmostEqual(pct_sum, 100.0, delta=1.5)
        # Sarah had 2 turns
        sarah = next(c for c in contribs if c["speaker"] == "Sarah")
        self.assertEqual(sarah["turns"], 2)

    def test_extract_top_keywords(self):
        keywords = extract_top_keywords(self.text, top_n=5)
        self.assertGreater(len(keywords), 0)
        self.assertTrue(any("Database" in k["keyword"] or "Latency" in k["keyword"] or "Sprint" in k["keyword"] or "Indexes" in k["keyword"] for k in keywords))

if __name__ == '__main__':
    unittest.main()
