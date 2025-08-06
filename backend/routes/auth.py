from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from backend.config import TELEGRAM_BOT_TOKEN
from backend.db.session import get_db
from backend.db.models import User, Room
import hashlib
import hmac
import time
import uuid

router = APIRouter()

def check_telegram_auth(data: dict, token: str) -> bool:
    auth_data = data.copy()
    hash_ = auth_data.pop("hash", "")
    check_string = "\n".join([f"{k}={auth_data[k]}" for k in sorted(auth_data)])
    secret_key = hashlib.sha256(token.encode()).digest()
    calc_hash = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(calc_hash, hash_) and int(auth_data.get("auth_date", 0)) > (time.time() - 86400)

@router.post("/auth/telegram")
async def telegram_login(request: Request, db: Session = Depends(get_db)):
    data = await request.json()

    if not check_telegram_auth(data, TELEGRAM_BOT_TOKEN):
        return {"error": "Invalid Telegram signature"}

    tg_id = str(data["id"])
    first_name = data.get("first_name", "User")

    user = db.query(User).filter_by(id=tg_id).first()

    if not user:
        user = User(
            id=tg_id,
            name=first_name,
            role="guest",
            permissions={
                "control_video": False,
                "kick": False,
                "change_video": False
            },
            connected=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "status": "ok",
        "user_id": user.id,
        "name": user.name
    }


