import unittest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

class TestAPIEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_check(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("version", data)
        self.assertIn("tfidf_centroid", data.get("supported_algorithms", []))

    def test_benchmark_endpoint(self):
        res = self.client.get("/benchmark")
        self.assertEqual(res.status_code, 200)
        benchmarks = res.json()
        self.assertGreaterEqual(len(benchmarks), 3)

    def test_analyze_meeting_and_flow(self):
        payload = {
            "title": "Automated Sprint Testing",
            "date": "October 20, 2026",
            "participants": ["Sarah Jenkins", "Michael Chang", "Alex Rodriguez"],
            "transcript": """
            Sarah Jenkins: Good morning team. Let's begin our testing sync.
            Alex Rodriguez: I finished the database indexing and latency dropped to 15 milliseconds.
            Michael Chang: The React UI charts and PDF export modules are ready.
            Sarah Jenkins: We have decided that we will approve the release candidate for Sprint 14.
            Alex Rodriguez: Alex will prepare the release documentation by Friday.
            Michael Chang: I will deploy the staging build before next Monday.
            Sarah Jenkins: One pending issue: we still need to determine whether the cloud hosting credits are approved. That is tabled for next meeting.
            """,
            "summary_length": "medium",
            "summary_algorithm": "tfidf_centroid",
            "save_to_db": True
        }
        res = self.client.post("/analyze", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsNotNone(data["id"])
        meeting_id = data["id"]
        self.assertEqual(data["title"], "Automated Sprint Testing")
        self.assertGreaterEqual(len(data["decisions"]), 1)
        self.assertGreaterEqual(len(data["action_items"]), 2)
        self.assertIsNotNone(data["sentiment"])
        self.assertGreaterEqual(len(data["speaker_analytics"]), 2)
        self.assertGreaterEqual(len(data["keywords"]), 1)
        self.assertIsNotNone(data["evaluation"])

        # Test GET /meetings/{id}
        res_get = self.client.get(f"/meetings/{meeting_id}")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["title"], "Automated Sprint Testing")

        # Test PATCH /meetings/{id}/action_items
        res_patch = self.client.patch(f"/meetings/{meeting_id}/action_items", json={"index": 0, "status": "Completed"})
        self.assertEqual(res_patch.status_code, 200)
        self.assertEqual(res_patch.json()["status"], "success")

        # Test GET /stats
        res_stats = self.client.get("/stats")
        self.assertEqual(res_stats.status_code, 200)
        stats = res_stats.json()
        self.assertGreater(stats["total_meetings"], 0)

        # Test GET /meetings with search
        res_search = self.client.get("/meetings?q=Automated")
        self.assertEqual(res_search.status_code, 200)
        self.assertGreater(len(res_search.json()), 0)

        # Test Exports: /txt and /csv
        res_txt = self.client.get(f"/meetings/{meeting_id}/export/txt")
        self.assertEqual(res_txt.status_code, 200)
        self.assertIn("MEETING MINUTES", res_txt.text)

        res_csv = self.client.get(f"/meetings/{meeting_id}/export/csv")
        self.assertEqual(res_csv.status_code, 200)
        self.assertIn("Task Description", res_csv.text)

        # Test DELETE /meetings/{id}
        res_del = self.client.delete(f"/meetings/{meeting_id}")
        self.assertEqual(res_del.status_code, 200)

        # Verify 404 after deletion
        res_deleted = self.client.get(f"/meetings/{meeting_id}")
        self.assertEqual(res_deleted.status_code, 404)

    def test_analyze_validation_errors(self):
        # Empty transcript
        res1 = self.client.post("/analyze", json={"transcript": ""})
        self.assertEqual(res1.status_code, 400)

        # Too short transcript
        res2 = self.client.post("/analyze", json={"transcript": "Too brief meeting dialogue"})
        self.assertEqual(res2.status_code, 400)

if __name__ == '__main__':
    unittest.main()
