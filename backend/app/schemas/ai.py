from datetime import datetime
from pydantic import BaseModel


class AIRecommendation(BaseModel):
    id: str
    message: str
    severity: str
    category: str
    created_at: datetime


class AIModel(BaseModel):
    id: str
    name: str
    description: str
    last_used: datetime
    type: str
