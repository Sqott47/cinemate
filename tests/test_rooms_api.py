import os
import sys

from fastapi.testclient import TestClient

# Ensure project root is on sys.path for module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app
from backend.db.database import Base, engine

# Ensure a clean database for tests
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def test_create_and_get_room():
    # Create a new room
    resp = client.post("/api/rooms/create")
    assert resp.status_code == 200
    data = resp.json()
    room_id = data["room_id"]
    assert data["room_url"] == f"/?room={room_id}"

    # Retrieve the same room
    resp = client.get(f"/api/rooms/{room_id}")
    assert resp.status_code == 200
    assert resp.json()["room_id"] == room_id
