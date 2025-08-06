from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid
from .database import Base


Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class Room(Base):
    __tablename__ = "rooms"

    id = Column(String, primary_key=True, default=generate_uuid)
    created_at = Column(DateTime, default=datetime.utcnow)
    current_video_url = Column(String, nullable=True)
    messages = relationship("Message", back_populates="room", cascade="all, delete-orphan")
    users = relationship("User", back_populates="room", cascade="all, delete-orphan")
    participants = relationship("RoomParticipant", back_populates="room", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    room_id = Column(String, ForeignKey("rooms.id"))
    room = relationship("Room", back_populates="users")
    participants = relationship("RoomParticipant", back_populates="user", cascade="all, delete-orphan")

# models.py
class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String, ForeignKey("rooms.id"))
    user_id = Column(String, ForeignKey("users.id"))
    username = Column(String, nullable=False)  # ⬅️ новое поле
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)


    room = relationship("Room", back_populates="messages")
    user = relationship("User", back_populates="messages")

class RoomParticipant(Base):
    __tablename__ = "room_participants"

    id = Column(String, primary_key=True, default=generate_uuid)
    room_id = Column(String, ForeignKey("rooms.id"))
    user_id = Column(String, ForeignKey("users.id"))

    role = Column(String, default="guest")
    permissions = Column(JSON, default=lambda: {
        "control_video": False,
        "kick": False,
        "change_video": False
    })

    connected = Column(Boolean, default=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("Room", back_populates="participants")
    user = relationship("User", back_populates="participants")

