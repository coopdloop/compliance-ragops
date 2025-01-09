from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict


class ComplianceTrend(BaseModel):
    month: str
    scans: int
    issues: int
    compliance: float

    model_config = ConfigDict(from_attributes=True)


class AIRecommendation(BaseModel):
    id: str
    message: str
    severity: str
    category: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplianceStatus(BaseModel):
    status: str
    score: float
    critical_findings: int
    required_actions: List[str]
    last_assessment: datetime


class ComplianceRequirement(BaseModel):
    id: str
    framework: str
    control_id: str
    description: str
    status: str
    evidence: str
    last_checked: datetime
