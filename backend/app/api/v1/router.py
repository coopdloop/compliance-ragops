from fastapi import APIRouter
from app.api.v1.endpoints import (
    scans,
    documents,
    agent,
    compliance,
    user,
    statistics,
    ai,
    service_account,
)

api_router = APIRouter()

# Include the base path routes
api_router.include_router(statistics.router, tags=["statistics"])
api_router.include_router(ai.router, tags=["ai"])

# Include prefixed routes
api_router.include_router(scans.router, prefix="/scans", tags=["scans"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(agent.router, prefix="/agent", tags=["agent"])
api_router.include_router(compliance.router, prefix="/compliance", tags=["compliance"])
api_router.include_router(user.router, prefix="/user", tags=["users"])
api_router.include_router(
    service_account.router, prefix="/service-account", tags=["service_account"]
)
