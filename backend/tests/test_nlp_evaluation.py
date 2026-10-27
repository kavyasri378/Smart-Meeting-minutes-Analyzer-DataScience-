import unittest
from nlp.evaluation import calculate_rouge, get_benchmark_comparison

class TestNLPEvaluation(unittest.TestCase):
    def test_calculate_rouge_identical_text(self):
        text = "We agreed to keep SQLite and add composite indexes to resolve database latency."
        rouge = calculate_rouge(text, text)
        self.assertAlmostEqual(rouge["rouge_1"]["precision"], 1.0)
        self.assertAlmostEqual(rouge["rouge_1"]["recall"], 1.0)
        self.assertAlmostEqual(rouge["rouge_1"]["f1"], 1.0)
        self.assertAlmostEqual(rouge["rouge_2"]["f1"], 1.0)
        self.assertAlmostEqual(rouge["rouge_l"]["f1"], 1.0)

    def test_calculate_rouge_partial_overlap(self):
        cand = "We decided to keep SQLite and resolve latency."
        ref = "Sarah said we decided to keep SQLite database to resolve performance latency."
        rouge = calculate_rouge(cand, ref)
        self.assertGreater(rouge["rouge_1"]["f1"], 0.0)
        self.assertLessEqual(rouge["rouge_1"]["f1"], 1.0)
        self.assertGreater(rouge["rouge_l"]["f1"], 0.0)

    def test_calculate_rouge_empty(self):
        rouge = calculate_rouge("", "Some meeting transcript")
        self.assertEqual(rouge["rouge_1"]["f1"], 0.0)

    def test_get_benchmark_comparison(self):
        benchmarks = get_benchmark_comparison()
        self.assertGreaterEqual(len(benchmarks), 3)
        algorithms = [b["algorithm"] for b in benchmarks]
        self.assertTrue(any("TF-IDF Centroid" in a for a in algorithms))
        self.assertTrue(any("TextRank" in a for a in algorithms))

if __name__ == '__main__':
    unittest.main()
