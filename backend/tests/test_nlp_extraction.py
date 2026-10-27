import unittest
from nlp.preprocessing import clean_text, split_sentences
from nlp.information_extraction import (
    extract_decisions, extract_action_items,
    extract_key_discussion_points, extract_pending_issues,
    clean_participant_name, build_participant_lookup
)

class TestNLPExtraction(unittest.TestCase):
    def test_extract_decisions_affirmative_vs_speculative(self):
        sentences = [
            "What if we migrate to Postgres?",
            "Maybe we should postpone the demo.",
            "We have decided that we will keep SQLite and add composite indexes to resolve the latency issue.",
            "We agreed to launch the enterprise tier publicly on November 15."
        ]
        decisions = extract_decisions(sentences)
        self.assertEqual(len(decisions), 2)
        self.assertTrue(any("keep SQLite" in d for d in decisions))
        self.assertTrue(any("enterprise tier" in d for d in decisions))
        # Ensure questions and suggestions were filtered out
        self.assertFalse(any("What if" in d for d in decisions))
        self.assertFalse(any("Maybe we should" in d for d in decisions))

    def test_extract_action_items_canonical_names_and_is_to(self):
        transcript = """
        Sarah Jenkins (Tech Lead): Let's assign tasks.
        Sarah Jenkins: Michael is to complete the PDF and CSV export functionality before next Monday.
        Alex: I will implement the database indexing by Friday.
        """
        participants = ["Sarah Jenkins (Tech Lead)", "Michael Chang (Frontend)", "Alex Rivera (Backend)"]
        items = extract_action_items(transcript, participants=participants)
        self.assertEqual(len(items), 2)

        # Michael Chang should be resolved as assignee
        michael_task = next((it for it in items if "Michael" in it["assignee"]), None)
        self.assertIsNotNone(michael_task)
        self.assertEqual(michael_task["assignee"], "Michael Chang")
        self.assertEqual(michael_task["due_date"], "Next Monday")

        # Alex Rivera should be resolved
        alex_task = next((it for it in items if "Alex" in it["assignee"]), None)
        self.assertIsNotNone(alex_task)
        self.assertEqual(alex_task["assignee"], "Alex Rivera")
        self.assertEqual(alex_task["due_date"], "Friday")

    def test_filter_false_positive_action_items(self):
        # When describing UI components using the words "action items"
        transcript = """
        Marcus: I designed the user interface with React. The user can view the summary, action items table, and export formatted minutes.
        David: David will submit the final project report by Friday.
        """
        items = extract_action_items(transcript, participants=["Marcus", "David"])
        # Should ONLY extract David's task, NOT the UI description
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["assignee"], "David")
        self.assertTrue("report" in items[0]["task"])

    def test_dedup_consecutive_assignment_and_confirmation(self):
        transcript = """
        Sarah: Elena will configure the Cypress end-to-end tests by Wednesday.
        Elena: I will set up the test suites and pipeline by Wednesday afternoon.
        """
        items = extract_action_items(transcript, participants=["Sarah", "Elena"])
        # Should deduplicate into one task for Elena with the specific deadline
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["assignee"], "Elena")
        self.assertEqual(items[0]["due_date"], "Wednesday Afternoon")

    def test_extract_pending_issues(self):
        sentences = [
            "We have decided to keep SQLite.",
            "One pending issue: we still need to determine whether the server will be packaged as a single Docker container or multi-container setup.",
            "That is tabled for next meeting."
        ]
        pending = extract_pending_issues(sentences)
        self.assertEqual(len(pending), 2)
        self.assertTrue(any("Docker" in p for p in pending))
        self.assertTrue(any("tabled" in p for p in pending))

if __name__ == '__main__':
    unittest.main()
