from fastapi import APIRouter, Query
import hashlib

from backend.config import USE_LIVEKIT


router = APIRouter()


@router.get("/config")
def get_client_config(room_id: str | None = Query(default=None)):
    """Return client configuration.

    The LiveKit usage flag is determined globally by ``USE_LIVEKIT`` and, when
    enabled, consistently for everyone in the same room based on ``room_id``.
    """
    use_livekit = USE_LIVEKIT
    if USE_LIVEKIT and room_id:
        digest = hashlib.sha256(room_id.encode()).hexdigest()
        use_livekit = int(digest, 16) % 2 == 0
    return {"use_livekit": use_livekit}

