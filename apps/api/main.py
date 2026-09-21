import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from apps.api.core.config import settings
from apps.api.core.logging import configure_logging, logger
from apps.api.core.database import init_db
from apps.api.core.redis_client import redis_service
from apps.api.routers import health, scans, badges

configure_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Auditor API Server", environment=settings.ENVIRONMENT)
    # Ensure artifacts directory exists
    os.makedirs(settings.ARTIFACTS_DIR, exist_ok=True)
    await init_db()
    await redis_service.connect()
    yield
    logger.info("Shutting down Auditor API Server")

app = FastAPI(
    title="Automated UI/UX & Performance Auditor",
    description="Auditing engine and fix-prompt generator for vibe coders",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(scans.router)
app.include_router(badges.router)

# Mount artifacts folder for serving screenshots/recordings
os.makedirs(settings.ARTIFACTS_DIR, exist_ok=True)
app.mount("/artifacts", StaticFiles(directory=settings.ARTIFACTS_DIR), name="artifacts")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host="0.0.0.0", port=8000, reload=True)
