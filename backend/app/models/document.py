# models/document.py
from datetime import datetime
from enum import Enum
from typing import Any, Dict

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy import (
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base
from app.models.association import scan_document  # Import from new association module


class DocumentCategory(str, Enum):
    POLICY = "POLICY"
    PROCEDURE = "PROCEDURE"
    STANDARD = "STANDARD"
    COMPLIANCE = "COMPLIANCE"
    AUDIT = "AUDIT"
    REPORT = "REPORT"


class ComplianceDocument(Base):
    __tablename__ = "compliancedocument"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(SQLEnum(DocumentCategory), nullable=False)
    description = Column(Text)
    version = Column(String, default="1.0")
    content = Column(Text)
    file_type = Column(String)
    original_filename = Column(String)
    uploaded_by = Column(Integer, ForeignKey("user.id"))
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    last_modified = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    scans = relationship(
        "ScanResult", secondary="scan_document", back_populates="documents"
    )
    user = relationship("User", back_populates="documents")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category.value,
            "description": self.description,
            "version": self.version,
            "file_type": self.file_type,
            "original_filename": self.original_filename,
            "upload_date": self.upload_date.isoformat() if self.upload_date else None,
            "last_modified": (
                self.last_modified.isoformat() if self.last_modified else None
            ),
            "scan_count": len(self.scans),  # Optional: add number of associated scans
        }
