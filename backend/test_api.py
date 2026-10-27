import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("1. Testing GET /health...")
res = client.get("/health")
assert res.status_code == 200, f"Health check failed: {res.text}"
print("   /health response:", res.json())

print("\n2. Testing POST /analyze (Valid Meeting)...")
payload = {
    "title": "Semester Capstone Project Sprint",
    "date": "October 18, 2026",
    "participants": ["Sarah Jenkins", "Alex Rodriguez", "Michael Chang"],
    "transcript": """
Sarah Jenkins: Welcome everyone to our Capstone Project Review meeting.
Alex Rodriguez: I completed the data ingestion pipeline and cleaned the dataset.
Michael Chang: I finished the UI wireframes and connected the frontend routing.
Sarah Jenkins: We need to agree on our database architecture for production.
Alex Rodriguez: SQLite is ideal for demonstration and local persistence, and we can switch to PostgreSQL later.
Sarah Jenkins: We agreed to use SQLite for our local demo and prototype storage.
Michael Chang: That makes total sense. Who handles the documentation?
Sarah Jenkins: Alex will write the API documentation and test coverage report by Friday.
Michael Chang: I will prepare the presentation slides and benchmark charts before next Monday.
Sarah Jenkins: Excellent. The cloud deployment budget is pending approval from our faculty advisor.
""",
    "summary_length": "medium",
    "save_to_db": True
}
res = client.post("/analyze", json=payload)
assert res.status_code == 200, f"Analyze failed: {res.text}"
data = res.json()
meeting_id = data["id"]
print(f"   Analyze Success! Meeting ID created: {meeting_id}")
print(f"   Title: {data['title']}")
print(f"   Decisions count: {len(data['decisions'])}")
print(f"   Action items count: {len(data['action_items'])}")
for it in data['action_items']:
    print(f"     * Task: {it['task']} | Assignee: {it['assignee']} | Due: {it['due_date']}")

print("\n3. Testing GET /meetings...")
res = client.get("/meetings")
assert res.status_code == 200
meetings = res.json()
print(f"   Found {len(meetings)} meetings in history")

print("\n4. Testing GET /meetings/{id}...")
res = client.get(f"/meetings/{meeting_id}")
assert res.status_code == 200
assert res.json()["title"] == "Semester Capstone Project Sprint"
print("   Fetched meeting details successfully!")

print("\n5. Testing PATCH /meetings/{id}/action_items (update status)...")
res = client.patch(f"/meetings/{meeting_id}/action_items", json={"index": 0, "status": "In Progress"})
assert res.status_code == 200
print("   Action item status successfully updated to 'In Progress'!")

print("\n6. Testing GET /stats...")
res = client.get("/stats")
assert res.status_code == 200
stats = res.json()
print("   Dashboard stats:", stats)

print("\n7. Testing GET /meetings/{id}/export/txt and /csv...")
res_txt = client.get(f"/meetings/{meeting_id}/export/txt")
assert res_txt.status_code == 200 and "MEETING MINUTES" in res_txt.text
res_csv = client.get(f"/meetings/{meeting_id}/export/csv")
assert res_csv.status_code == 200 and "Task Description" in res_csv.text
print("   Export endpoints validated successfully!")

print("\n8. Testing Validation Error on Empty / Short Transcript...")
res_err = client.post("/analyze", json={"transcript": "Too short"})
assert res_err.status_code == 400
print("   Error handling validated successfully: returned 400 with detail:", res_err.json()["detail"])

print("\nALL FASTAPI INTEGRATION TESTS PASSED 100%!")
