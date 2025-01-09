# models/scan.py
from datetime import datetime
from typing import Any, Dict, Optional
import json
from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.association import scan_document  # Import from new association module


class ScanResult(Base):
    __tablename__ = "scanresult"

    id: int = Column(Integer, primary_key=True, index=True)
    project_name: str = Column(String)
    trivy_data: Dict[str, Any] = Column(JSON)
    analysis_result: Dict[str, Any] = Column(JSON)
    severity_counts: Dict[str, int] = Column(JSON)
    scan_type: str = Column(String)
    created_by: int = Column(Integer, ForeignKey("user.id"))
    scan_date: datetime = Column(DateTime, default=datetime.utcnow)

    # These can be computed properties or stored fields
    total_vulnerabilities: Optional[int] = Column(Integer, nullable=True)
    critical_vulnerabilities: Optional[int] = Column(Integer, nullable=True)
    compliance_score: Optional[float] = Column(Float, nullable=True)

    # Add the back-reference relationship to User
    user = relationship("User", back_populates="scans")

    # Relationship for documents
    documents = relationship(
        "ComplianceDocument", secondary="scan_document", back_populates="scans"
    )

    @hybrid_property
    def computed_total_vulnerabilities(self) -> int:
        """Compute total vulnerabilities from severity_counts"""
        if isinstance(self.severity_counts, dict):
            return sum(self.severity_counts.values())
        elif isinstance(self.severity_counts, str):
            counts = json.loads(self.severity_counts)
            return sum(counts.values())
        return 0

    @hybrid_property
    def computed_critical_vulnerabilities(self) -> int:
        """Compute critical vulnerabilities from severity_counts"""
        if isinstance(self.severity_counts, dict):
            return self.severity_counts.get("CRITICAL", 0)
        elif isinstance(self.severity_counts, str):
            counts = json.loads(self.severity_counts)
            return counts.get("CRITICAL", 0)
        return 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "project_name": self.project_name,
            "scan_date": self.scan_date.isoformat() if self.scan_date else None,
            "severity_counts": self.severity_counts,
            "analysis_result": self.analysis_result,
            "compliance_score": self.compliance_score,
            "total_vulnerabilities": self.computed_total_vulnerabilities,
            "critical_vulnerabilities": self.computed_critical_vulnerabilities,
            "documents": [doc.id for doc in self.documents],
            "created_by": self.created_by,
        }
