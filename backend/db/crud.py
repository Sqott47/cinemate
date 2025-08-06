"""CRUD operations for Room model."""

from sqlalchemy.orm import Session

from . import models


def create_room(db: Session) -> models.Room:
    """Create a new room in the database.

    A fresh :class:`Room` instance is added to the session and committed.  The
    model generates its own UUID so no parameters are required.

    Args:
        db: Database session.

    Returns:
        The persisted :class:`Room` instance.
    """

    room = models.Room()
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def get_room(db: Session, room_id: str) -> models.Room | None:
    """Retrieve a room by its identifier.

    Args:
        db: Database session.
        room_id: Identifier of the room to fetch.

    Returns:
        The :class:`Room` instance if found, otherwise ``None``.
    """

    return db.query(models.Room).filter(models.Room.id == room_id).first()

