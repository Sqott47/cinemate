import logging
import logging.config
import os

# Абсолютный путь до logs/cinemate.log
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)
SQLALCHEMY_DATABASE_URL = "sqlite:///./cinemate.db"
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
if not TELEGRAM_BOT_TOKEN:
    raise EnvironmentError("TELEGRAM_BOT_TOKEN environment variable is not set")

LOG_FILE = os.path.join(LOG_DIR, "cinemate.log")

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,  # обязательно, чтобы не сбивать логгер FastAPI
    "formatters": {
        "default": {
            "format": "[%(asctime)s] %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "level": "INFO",
        },
        "file": {
            "class": "logging.FileHandler",
            "formatter": "default",
            "filename": LOG_FILE,
            "encoding": "utf-8",
            "level": "INFO",
        },
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "INFO",
    },
    "loggers": {
        "cinemate": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("cinemate")
