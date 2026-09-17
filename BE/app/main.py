import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.routers import (
    auth,
    chat,
    emergency,
    events,
    forum,
    notifications,
    profiles,
    psychologists,
    reports,
    storage,
    wellness,
)

settings = get_settings()

app = FastAPI(
    title="BinaJiwa API",
    description="Backend untuk aplikasi kesehatan mental BinaJiwa (forum anonim, mood tracker, "
    "journal, konsultasi psikolog, event, dan moderasi), dibangun di atas Supabase.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(wellness.router)
app.include_router(forum.router)
app.include_router(psychologists.router)
app.include_router(chat.router)
app.include_router(events.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(emergency.router)
app.include_router(storage.router)


@app.get("/health", tags=["health"])
def health_check() -> dict:
    return {"status": "ok"}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logging.getLogger("uvicorn.error").exception("Unhandled error on %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"detail": "Terjadi kesalahan pada server"})
