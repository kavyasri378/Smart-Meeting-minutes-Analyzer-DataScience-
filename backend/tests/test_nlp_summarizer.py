import unittest
from nlp.summarizer import summarize_tfidf, summarize_textrank, summarize_frequency, summarize_dispatch

SAMPLE_TEXT = """
Sarah: Welcome everyone. Let's begin our architecture review.
Alex: I have finished designing the database schema in SQLite.
Michael: The React frontend has been connected to Tailwind CSS.
Sarah: We need to agree on our indexing strategy.
Elena: Adding composite indexes will reduce latency significantly.
Sarah: We have decided that we will keep SQLite and add composite indexes.
Alex: I will implement the database indexing by Friday.
Michael: I will finalize the PDF export module before next Monday.
Sarah: Thanks team, meeting adjourned.
"""

class TestNLPSummarizer(unittest.TestCase):
    def test_summarize_tfidf_medium(self):
        res = summarize_tfidf(SAMPLE_TEXT, summary_length="medium")
        self.assertIn("summary", res)
        self.assertIn("method", res)
        self.assertGreater(res["sentence_count"], 0)
        self.assertLessEqual(res["sentence_count"], res["original_sentences"])
        # Important decision or action should be in summary
        self.assertTrue(len(res["summary"]) > 20)

    def test_summarize_textrank(self):
        res = summarize_textrank(SAMPLE_TEXT, summary_length="medium")
        self.assertIn("summary", res)
        self.assertEqual(res["method"], "TextRank (Graph Centrality)")
        self.assertGreater(res["sentence_count"], 0)

    def test_summarize_frequency(self):
        res = summarize_frequency(SAMPLE_TEXT, summary_length="short")
        self.assertIn("summary", res)
        self.assertEqual(res["method"], "Lexical Frequency Centrality")
        self.assertGreater(res["sentence_count"], 0)

    def test_summarize_dispatch_algorithms(self):
        r1 = summarize_dispatch(SAMPLE_TEXT, algorithm="tfidf_centroid", summary_length="medium")
        r2 = summarize_dispatch(SAMPLE_TEXT, algorithm="textrank", summary_length="medium")
        r3 = summarize_dispatch(SAMPLE_TEXT, algorithm="frequency", summary_length="medium")
        self.assertIn("Extractive TF-IDF", r1["method"])
        self.assertIn("TextRank", r2["method"])
        self.assertIn("Frequency", r3["method"])

    def test_summarize_empty_transcript(self):
        res = summarize_tfidf("", summary_length="medium")
        self.assertEqual(res["sentence_count"], 0)

if __name__ == '__main__':
    unittest.main()
