# main.py
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.init import init_db
from app.utils.logging import setup_logging

# Set up logging
setup_logging()
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Security Analysis API with AI capabilities",
    version=settings.VERSION,
    swagger_ui_parameters={
        "deepLinking": True,  # Enable deep linking to specific operations
        "defaultModelRendering": "example",  # Render models with example by default
    },
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


# Add startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting up application...")
    init_db()


# Add health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.VERSION}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
