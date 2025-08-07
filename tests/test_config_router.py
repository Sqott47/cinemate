import os
import sys

from fastapi.testclient import TestClient

# Ensure project root is on sys.path for module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app
from backend.routers import config_router


def test_same_room_receives_same_use_livekit():
    """Two requests for the same room should return identical flags."""
    # Force LiveKit logic to be active so the room_id is used
    config_router.USE_LIVEKIT = True

    with TestClient(app) as client:
        resp1 = client.get("/config", params={"room_id": "room_a"})
        resp2 = client.get("/config", params={"room_id": "room_a"})

        assert resp1.status_code == 200
        assert resp2.status_code == 200
        assert resp1.json()["use_livekit"] == resp2.json()["use_livekit"]

