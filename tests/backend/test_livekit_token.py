import os
import sys
import json
import base64
from fastapi.testclient import TestClient

# Ensure project root on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))


def _decode_payload(token: str) -> dict:
    _, payload_b64, _ = token.split('.')
    padding = '=' * (-len(payload_b64) % 4)
    decoded = base64.urlsafe_b64decode(payload_b64 + padding).decode()
    return json.loads(decoded)


def _reload_backend():
    for mod in [
        'backend.config',
        'backend.livekit.token_service',
        'backend.routers.livekit',
        'backend.main',
    ]:
        if mod in sys.modules:
            del sys.modules[mod]


def test_generate_token_success(monkeypatch):
    monkeypatch.setenv('LIVEKIT_API_KEY', 'test_key')
    monkeypatch.setenv('LIVEKIT_API_SECRET', 'test_secret')
    monkeypatch.setenv('LIVEKIT_URL', 'wss://test.url')

    _reload_backend()
    from backend.main import app
    client = TestClient(app)

    resp = client.post('/livekit/token', json={'user_id': 'u1', 'room_id': 'room1'})
    assert resp.status_code == 200
    data = resp.json()
    assert data['url'] == 'wss://test.url'

    payload = _decode_payload(data['token'])
    assert payload['iss'] == 'test_key'
    assert payload['sub'] == 'u1'
    assert payload['video']['room'] == 'room1'


def test_generate_token_rewrites_livekit_host(monkeypatch):
    monkeypatch.setenv('LIVEKIT_API_KEY', 'test_key')
    monkeypatch.setenv('LIVEKIT_API_SECRET', 'test_secret')
    monkeypatch.setenv('LIVEKIT_URL', 'ws://livekit:7880')

    _reload_backend()
    from backend.main import app
    client = TestClient(app)

    resp = client.post('/livekit/token', json={'user_id': 'u1', 'room_id': 'room1'})
    assert resp.status_code == 200
    data = resp.json()
    assert data['url'] == 'ws://testserver:7880'


def test_generate_token_unknown_role(monkeypatch):
    monkeypatch.setenv('LIVEKIT_API_KEY', 'test_key')
    monkeypatch.setenv('LIVEKIT_API_SECRET', 'test_secret')
    monkeypatch.setenv('LIVEKIT_URL', 'wss://test.url')

    _reload_backend()
    from backend.main import app
    client = TestClient(app, raise_server_exceptions=False)

    resp = client.post('/livekit/token', json={'user_id': 'u1', 'room_id': 'room1', 'role': 'unknown'})
    assert resp.status_code == 500
