import sys
import os
import time
import unittest

def run_tests():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, backend_dir)

    print("=" * 75)
    print("  SMART MEETING MINUTES ANALYZER (MINUTEFLOW AI) - TEST SUITE")
    print("=" * 75)
    print(f"Python Version: {sys.version.split()[0]}")
    print(f"Working Dir:    {backend_dir}")
    print("-" * 75)

    loader = unittest.TestLoader()
    start_dir = os.path.join(backend_dir, "tests")
    suite = loader.discover(start_dir, pattern="test_*.py")

    total_tests = suite.countTestCases()
    print(f"Discovered {total_tests} test cases across 6 test modules:")
    print("  • test_nlp_preprocessing.py   (Sentence tokenization, diarization, abbreviations)")
    print("  • test_nlp_summarizer.py      (TF-IDF Centroid, TextRank Graph, Frequency)")
    print("  • test_nlp_extraction.py      (Decisions, action items, assignees, pending)")
    print("  • test_nlp_sentiment_topics.py(Sentiment analysis, tone, speaker analytics)")
    print("  • test_nlp_evaluation.py      (ROUGE-1, ROUGE-2, ROUGE-L, Benchmarks)")
    print("  • test_api_endpoints.py       (FastAPI routes, CRUD, stats, export TXT/CSV)")
    print("-" * 75)

    start_time = time.time()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    elapsed = time.time() - start_time

    print("\n" + "=" * 75)
    print("  TEST SUITE EXECUTION SUMMARY")
    print("=" * 75)
    print(f"Total Tests Run: {result.testsRun}")
    print(f"Successes:       {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures:        {len(result.failures)}")
    print(f"Errors:          {len(result.errors)}")
    print(f"Time Taken:      {elapsed:.2f} seconds")
    print("-" * 75)

    if result.wasSuccessful():
        print(">>> RESULT: ALL TESTS PASSED WITH 100% SUCCESS! (READY FOR PRODUCTION) <<<")
        print("=" * 75)
        return 0
    else:
        print(">>> RESULT: SOME TESTS FAILED. PLEASE CHECK TRACEBACK ABOVE. <<<")
        print("=" * 75)
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
