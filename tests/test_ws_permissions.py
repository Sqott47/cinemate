import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app
from backend.ws_endpoint import manager
from contextlib import contextmanager


@contextmanager
def _connect(client: TestClient, room: str, username: str, user_id: str):
    with client.websocket_connect(f"/ws/{room}?username={username}&user_id={user_id}") as ws:
        ws.receive_json()  # joined
        ws.receive_json()  # users update
        yield ws


def test_set_permissions_authorized():
    room = "room_perm_allowed"
    with TestClient(app) as client:
        with _connect(client, room, "admin", "admin") as admin_ws:
            with _connect(client, room, "guest", "guest") as guest_ws:
                admin_ws.receive_json()  # users update after guest joins

                admin_ws.send_json({
                    "type": "set_permissions",
                    "user_id": "admin",
                    "target_id": "guest",
                    "permissions": {"kick": True},
                })

                admin_ws.receive_json()  # users update broadcast
                guest_ws.receive_json()  # users update broadcast

                participant = manager.get_participant(room, "guest")
                assert participant.permissions.get("kick") is True


def test_set_permissions_denied():
    room = "room_perm_denied"
    with TestClient(app) as client:
        with _connect(client, room, "admin", "admin") as admin_ws:
            with _connect(client, room, "guest", "guest") as guest_ws:
                admin_ws.receive_json()

                guest_ws.send_json({
                    "type": "set_permissions",
                    "user_id": "guest",
                    "target_id": "admin",
                    "permissions": {"kick": False},
                })

                resp = guest_ws.receive_json()
                assert resp["type"] == "error"

                participant = manager.get_participant(room, "admin")
                assert participant.permissions.get("kick") is True


def test_kick_authorized():
    room = "room_kick_allowed"
    with TestClient(app) as client:
        with _connect(client, room, "admin", "admin") as admin_ws:
            with _connect(client, room, "guest", "guest") as guest_ws:
                admin_ws.receive_json()

                admin_ws.send_json({
                    "type": "kick",
                    "user_id": "admin",
                    "target_id": "guest",
                })

                kicked_msg = guest_ws.receive_json()
                assert kicked_msg["type"] == "kicked"

                admin_ws.receive_json()
                guest_ws.receive_json()

                participant = manager.get_participant(room, "guest")
                assert participant is None


def test_kick_denied():
    room = "room_kick_denied"
    with TestClient(app) as client:
        with _connect(client, room, "admin", "admin") as admin_ws:
            with _connect(client, room, "guest", "guest") as guest_ws:
                admin_ws.receive_json()

                guest_ws.send_json({
                    "type": "kick",
                    "user_id": "guest",
                    "target_id": "admin",
                })

                resp = guest_ws.receive_json()
                assert resp["type"] == "error"

                participant = manager.get_participant(room, "admin")
                assert participant is not None
