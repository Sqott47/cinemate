import base64
import hmac
import hashlib
import json
import time
from typing import Dict

from backend.config import LIVEKIT_API_KEY, LIVEKIT_API_SECRET
from .roles import ROLES


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def create_livekit_token(user_id: str, room_id: str, role: str) -> str:
    grants: Dict[str, bool] = ROLES.get(role)
    if grants is None:
        raise ValueError("Unknown role")

    header = {"alg": "HS256", "typ": "JWT"}
    iat = int(time.time())
    payload = {
        "iss": LIVEKIT_API_KEY,
        "sub": user_id,
        "iat": iat,
        "exp": iat + 3600,
        "video": {**grants, "room": room_id},
    }

    segments = [
        _b64encode(json.dumps(header, separators=(",", ":")).encode()),
        _b64encode(json.dumps(payload, separators=(",", ":")).encode()),
    ]
    signing_input = ".".join(segments).encode()
    signature = hmac.new(
        LIVEKIT_API_SECRET.encode(), signing_input, hashlib.sha256
    ).digest()
    return ".".join(segments + [_b64encode(signature)])
