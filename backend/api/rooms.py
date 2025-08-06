# backend/api/rooms.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.db import crud
from backend.db.session import get_db

router = APIRouter(prefix="/api/rooms")


@router.post("/create")
def create_room(db: Session = Depends(get_db)):
    """Create a new room and persist it to the database."""

    room = crud.create_room(db)
    return {"room_id": room.id}


@router.get("/{room_id}")
def get_room(room_id: str, db: Session = Depends(get_db)):
    """Retrieve room information by its identifier."""

    room = crud.get_room(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"room_id": room.id}
