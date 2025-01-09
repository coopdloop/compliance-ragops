# app/models/association.py
from sqlalchemy import Table, Column, Integer, ForeignKey
from app.db.base_class import Base

# Association table for scan-document relationship
scan_document = Table(
    "scan_document",
    Base.metadata,
    Column("scan_id", Integer, ForeignKey("scanresult.id")),
    Column("document_id", Integer, ForeignKey("compliancedocument.id")),
)
