# backend/db/schemas.py
from pydantic import BaseModel
from typing import Literal

class VideoControlEvent(BaseModel):
    type: Literal["play", "pause", "seek"]
    timestamp: float
