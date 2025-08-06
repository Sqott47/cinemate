import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))
from backend.ws.db_manager import DBConnectionManager


class DummyWebSocket:
    def __init__(self, fail: bool = False):
        self.fail = fail
        self.sent = []

    async def send_text(self, message: str):
        if self.fail:
            raise RuntimeError("send failed")
        self.sent.append(message)


def test_broadcast_removes_failed_connections():
    manager = DBConnectionManager()
    room_id = "room"
    good_ws = DummyWebSocket()
    bad_ws = DummyWebSocket(fail=True)

    manager.active_connections[room_id] = {"good": good_ws, "bad": bad_ws}

    asyncio.run(manager.broadcast("hello", room_id))

    assert "bad" not in manager.active_connections[room_id]
    assert "good" in manager.active_connections[room_id]
    assert good_ws.sent == ["hello"]


def test_broadcast_removes_room_if_all_connections_fail():
    manager = DBConnectionManager()
    room_id = "room"
    bad_ws = DummyWebSocket(fail=True)

    manager.active_connections[room_id] = {"bad": bad_ws}

    asyncio.run(manager.broadcast("hello", room_id))

    assert room_id not in manager.active_connections
