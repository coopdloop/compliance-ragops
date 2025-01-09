# models/user.py
from datetime import datetime
from typing import Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship

from app.db.base_class import Base
from app.core.security import encrypt_sensitive_data, decrypt_sensitive_data


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    auth0_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    job_title = Column(String, nullable=True)
    department = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    _openai_key = Column("openai_key", String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scans = relationship("ScanResult", back_populates="user")
    documents = relationship("ComplianceDocument", back_populates="user")
    service_accounts = relationship(
        "ServiceAccount",
        back_populates="user",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    @property
    def openai_key(self) -> str:
        """Get decrypted OpenAI key"""
        if self._openai_key:
            return decrypt_sensitive_data(self._openai_key)
        return None

    @openai_key.setter
    def openai_key(self, value: str):
        """Set encrypted OpenAI key"""
        if value:
            self._openai_key = encrypt_sensitive_data(value)
        else:
            self._openai_key = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "auth0_id": self.auth0_id,
            "email": self.email,
            "name": self.name,
            "job_title": self.job_title,
            "department": self.department,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
