import json
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, model_validator


class SeverityCounts(BaseModel):
    CRITICAL: int = 0
    HIGH: int = 0
    MEDIUM: int = 0
    LOW: int = 0


class ScanRequest(BaseModel):
    project_name: str
    trivy_data: Dict[str, Any]
    documents: Optional[List[Union[str, int]]] = []
    scan_type: str


class ScanBase(BaseModel):
    project_name: str
    scan_type: str
    documents: Optional[List[Union[str, int]]] = []


class ScanAnalysisResult(BaseModel):
    summary: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    remediation: Dict[str, Any]
    compliance_impact: Dict[str, Any]


class ScanResponse(BaseModel):
    id: int
    project_name: str
    scan_date: datetime
    severity_counts: Dict[str, int]
    analysis_result: Dict[str, Any]
    documents: List[int] = Field(default_factory=list)
    total_vulnerabilities: int = 0
    critical_vulnerabilities: int = 0
    compliance_score: Optional[float] = None
    scan_type: str

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def compute_vulnerability_counts(self) -> "ScanResponse":
        if isinstance(self.severity_counts, dict):
            self.total_vulnerabilities = sum(self.severity_counts.values())
            self.critical_vulnerabilities = self.severity_counts.get("CRITICAL", 0)
        elif isinstance(self.severity_counts, str):
            try:
                counts = json.loads(self.severity_counts)
                self.total_vulnerabilities = sum(counts.values())
                self.critical_vulnerabilities = counts.get("CRITICAL", 0)
            except json.JSONDecodeError:
                pass

        # Convert document objects to IDs if necessary
        if hasattr(self, "documents"):
            if isinstance(self.documents, list):
                self.documents = [
                    doc.id if hasattr(doc, "id") else doc for doc in self.documents
                ]
        return self


class ScanWithDetails(ScanResponse):
    trivy_data: Dict[str, Any]


class ScanStatistics(BaseModel):
    total_scans: int
    critical_issues: int
    open_issues: int
    resolved_issues: int
    compliance_score: float
