# backend/api/rooms.py
from fastapi import APIRouter
from uuid import uuid4

router = APIRouter(prefix="/api/rooms")

rooms = {}

@router.post("/create")
def create_room():
    room_id = str(uuid4())
    rooms[room_id] = {"users": []}
    return {"room_id": room_id}
