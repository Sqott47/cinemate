from fastapi import APIRouter, Request
from pydantic import BaseModel
from urllib.parse import urlparse, urlunparse

from backend.livekit.token_service import create_livekit_token
from backend.config import LIVEKIT_URL

router = APIRouter()


class TokenRequest(BaseModel):
    user_id: str
    room_id: str
    role: str = "publisher"


@router.post("/livekit/token")
def generate_token(req: TokenRequest, request: Request):
    token = create_livekit_token(req.user_id, req.room_id, req.role)

    url = LIVEKIT_URL
    if url:
        parsed = urlparse(url)
        if parsed.hostname == "livekit":
            host = request.headers.get("host", "")
            hostname = host.split(":")[0] if host else "localhost"
            netloc = f"{hostname}:{parsed.port}" if parsed.port else hostname
            url = urlunparse(parsed._replace(netloc=netloc))

    return {"token": token, "url": url}
