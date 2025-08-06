from typing import Dict
from fastapi import WebSocket
from sqlalchemy.orm import Session, joinedload
from backend.db.models import Room, User, RoomParticipant
from backend.db.session import SessionLocal
from backend.config import logger
from datetime import datetime
from uuid import uuid4
from contextlib import contextmanager
import json


class DBConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}  # room_id -> {user_id: ws}

    @contextmanager
    def get_db(self) -> Session:
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        self.active_connections.setdefault(room_id, {})[user_id] = websocket

    def disconnect(self, websocket: WebSocket, room_id: str, user_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].pop(user_id, None)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    def add_user(self, room_id: str, username: str, user_id: str | None = None) -> User:
        with self.get_db() as db:
            user = None
            if user_id:
                user = db.query(User).filter_by(id=user_id).first()
            if not user:
                user = User(id=user_id or str(uuid4()), name=username)
                db.add(user)
                db.commit()
                db.refresh(user)

            room = db.query(Room).filter_by(id=room_id).first()
            if not room:
                room = Room(id=room_id)
                db.add(room)
                db.commit()
                db.refresh(room)

            participant = db.query(RoomParticipant).filter_by(user_id=user.id, room_id=room.id).first()
            if participant:
                participant.connected = True
                participant.joined_at = datetime.utcnow()
                db.commit()
                db.refresh(user)
                return user

            is_first = db.query(RoomParticipant).filter_by(room_id=room_id).count() == 0
            role = "admin" if is_first else "guest"
            permissions = {
                "control_video": is_first,
                "kick": is_first,
                "change_video": is_first
            }

            participant = RoomParticipant(
                user_id=user.id,
                room_id=room.id,
                role=role,
                permissions=permissions,
                connected=True
            )
            db.add(participant)
            db.commit()
            db.refresh(user)
            return user

    def remove_user(self, room_id: str, user_id: str):
        with self.get_db() as db:
            participant = db.query(RoomParticipant).filter_by(room_id=room_id, user_id=user_id).first()
            if participant:
                participant.connected = False
                db.commit()

    def get_user(self, room_id: str, user_id: str) -> User | None:
        with self.get_db() as db:
            participant = db.query(RoomParticipant).options(joinedload(RoomParticipant.user)).filter_by(
                room_id=room_id, user_id=user_id, connected=True).first()
            return participant.user if participant else None

    def get_websocket_by_user_id(self, room_id: str, user_id: str) -> WebSocket | None:
        return self.active_connections.get(room_id, {}).get(user_id)

    async def broadcast(self, message: str, room_id: str, sender: WebSocket = None):
        for ws in self.active_connections.get(room_id, {}).values():
            if sender is None or ws != sender:
                try:
                    await ws.send_text(message)
                except Exception as e:
                    logger.warning(f"[Broadcast] Failed to send to websocket: {e}")

    async def broadcast_users(self, room_id: str):
        with self.get_db() as db:
            participants = db.query(RoomParticipant).options(joinedload(RoomParticipant.user)).filter_by(
                room_id=room_id, connected=True).order_by(RoomParticipant.joined_at).all()

            has_admin = any(p.role == "admin" for p in participants)
            if not has_admin and participants:
                new_admin = participants[0]
                new_admin.role = "admin"
                new_admin.permissions = {
                    "control_video": True,
                    "kick": True,
                    "change_video": True
                }
                db.commit()

            user_list = [
                {
                    "id": p.user.id,
                    "name": p.user.name,
                    "role": p.role,
                    "permissions": p.permissions
                }
                for p in participants
            ]

            logger.info(f"Broadcasting users in room {room_id}: {len(user_list)} users")
            await self.broadcast(json.dumps({
                "type": "users_update",
                "users": user_list
            }), room_id)

    def set_permissions(self, room_id: str, target_id: str, new_permissions: dict) -> bool:
        with self.get_db() as db:
            participant = db.query(RoomParticipant).filter_by(room_id=room_id, user_id=target_id).first()
            if participant:
                participant.permissions = {
                    **participant.permissions,
                    **new_permissions
                }
                db.commit()
                return True
        return False

    def kick_user(self, room_id: str, target_id: str) -> bool:
        with self.get_db() as db:
            participant = db.query(RoomParticipant).filter_by(room_id=room_id, user_id=target_id).first()
            if participant:
                participant.connected = False
                db.commit()
                return True
        return False

    def get_participant(self, room_id: str, user_id: str) -> RoomParticipant | None:
        with self.get_db() as db:
            return db.query(RoomParticipant) \
                .options(joinedload(RoomParticipant.user)) \
                .filter_by(room_id=room_id, user_id=user_id, connected=True) \
                .first()
