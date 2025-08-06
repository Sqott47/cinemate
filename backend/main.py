from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.ws_endpoint import router as ws_router
from backend.api.rooms import router as room_router
from backend.config import logger  # ← обязательно инициализирует логгер
from backend.routes import auth

logger.info("🚀 Cinemate API starting...")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("[MAIN] FastAPI init")

print("[MAIN] Router imported")
app.include_router(ws_router)
print("[MAIN] Router included")
app.include_router(auth.router)
app.include_router(room_router)

@app.get("/")
async def root():
    return {"message": "Cinemate API working"}