from fastapi import APIRouter, Query
import hashlib

from backend.config import USE_LIVEKIT


router = APIRouter()


@router.get("/config")
def get_client_config(user_id: str | None = Query(default=None)):
    use_livekit = USE_LIVEKIT
    if USE_LIVEKIT and user_id:
        digest = hashlib.sha256(user_id.encode()).hexdigest()
        use_livekit = int(digest, 16) % 2 == 0
    return {"use_livekit": use_livekit}

