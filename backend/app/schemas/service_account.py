# schemas/service_account.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ServiceAccountCreate(BaseModel):
    name: str
    description: Optional[str] = None
    expires_in_days: Optional[int] = 30


class ServiceAccountResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    token: str  # Only returned on creation
    created_at: datetime
    expires_at: Optional[datetime]
    is_active: bool
