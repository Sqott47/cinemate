ROLES = {
    "publisher": {
        "room_join": True,
        "can_publish": True,
        "can_subscribe": True,
        "room_admin": False,
    },
    "subscriber": {
        "room_join": True,
        "can_publish": False,
        "can_subscribe": True,
        "room_admin": False,
    },
    "moderator": {
        "room_join": True,
        "can_publish": True,
        "can_subscribe": True,
        "room_admin": True,
    },
}
