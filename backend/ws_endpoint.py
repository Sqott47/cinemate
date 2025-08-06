from datetime import datetime
import json
from uuid import uuid4
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.db.models import Message
from backend.ws.db_manager import DBConnectionManager
from backend.config import logger

router = APIRouter()
manager = DBConnectionManager()

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    username = websocket.query_params.get("username", "Anonymous")
    user_id = websocket.query_params.get("user_id")

    user = manager.add_user(room_id, username, user_id)

    await manager.connect(websocket, room_id, user.id)
    logger.info(f"[WS] New connection to room {room_id}")

    await websocket.send_json({"type": "joined", "user_id": user.id})
    await manager.broadcast_users(room_id)

    with manager.get_db() as db:
        history = (
            db.query(Message)
            .filter_by(room_id=room_id)
            .order_by(Message.timestamp)
            .limit(50)
            .all()
        )
        for msg in history:
            await websocket.send_json({
                "type": "chat",
                "user_id": msg.user_id,
                "username": msg.username,
                "message": msg.text,
                "timestamp": msg.timestamp.isoformat(),
            })

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type in ("play", "pause", "seek"):
                await manager.broadcast(json.dumps(data), room_id)

            elif msg_type == "chat":
                message = data.get("message", "")
                sender_id = data.get("user_id")
                user = manager.get_user(room_id, sender_id)
                sender_name = user.name if user else "Unknown"

                with manager.get_db() as db:
                    entry = Message(
                        user_id=sender_id,
                        username=sender_name,
                        room_id=room_id,
                        text=message,
                    )
                    db.add(entry)
                    db.commit()

                await manager.broadcast(json.dumps({
                    "type": "chat",
                    "user_id": sender_id,
                    "username": sender_name,
                    "message": message,
                    "timestamp": datetime.utcnow().isoformat(),
                }), room_id)

            elif msg_type == "change_video":
                video_url = data.get("video_url", "")
                manager.set_video(room_id, video_url)
                await manager.broadcast(json.dumps({
                    "type": "video_changed",
                    "video_url": video_url,
                }), room_id)

            elif msg_type == "set_permissions":
                with manager.get_db() as db:
                    updated = manager.set_permissions(
                        room_id,
                        data.get("target_id"),
                        data.get("permissions", {})
                    )

                if updated:
                    await manager.broadcast_users(room_id)

            elif msg_type == "kick":
                target_id = data.get("target_id")
                kicked = manager.kick_user(room_id=room_id, target_id=target_id)

                if kicked:
                    ws_to_kick = manager.get_websocket_by_user_id(room_id, target_id)
                    if ws_to_kick:
                        try:
                            await ws_to_kick.send_json({"type": "kicked"})
                            logger.info(f"[KICK] Sent 'kicked' to {target_id}")
                        except Exception as e:
                            logger.warning(f"Failed to send 'kicked' to {target_id}: {e}")
                    await manager.broadcast_users(room_id)

    except WebSocketDisconnect:
        manager.remove_user(room_id, user.id)
        manager.disconnect(websocket, room_id, user.id)
        await manager.broadcast_users(room_id)
