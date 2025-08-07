from fastapi import APIRouter
from pydantic import BaseModel

from backend.livekit.token_service import create_livekit_token
from backend.config import LIVEKIT_URL

router = APIRouter()


class TokenRequest(BaseModel):
    user_id: str
    room_id: str
    role: str = "publisher"


@router.post("/livekit/token")
def generate_token(req: TokenRequest):
    token = create_livekit_token(req.user_id, req.room_id, req.role)
    return {"token": token, "url": LIVEKIT_URL}
