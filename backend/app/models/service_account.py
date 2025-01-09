# models/service_account.py
from datetime import datetime
from typing import Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class ServiceAccount(Base):
    __tablename__ = "serviceaccount"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    token_hash = Column(String)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("user.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    last_used_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="service_accounts")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "last_used_at": (
                self.last_used_at.isoformat() if self.last_used_at else None
            ),
        }

    @property
    def is_expired(self) -> bool:
        """Check if the service account token has expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at

    def update_last_used(self):
        """Update the last used timestamp"""
        self.last_used_at = datetime.utcnow()
