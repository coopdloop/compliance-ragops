from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.document import DocumentCategory


class DocumentBase(BaseModel):
    name: str
    category: DocumentCategory
    description: str
    version: str = "1.0"


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[DocumentCategory] = None
    description: Optional[str] = None
    version: Optional[str] = None


class DocumentInDB(DocumentBase):
    id: int
    name: str
    category: DocumentCategory
    description: Optional[str] = None
    version: str
    file_type: Optional[str] = None
    original_filename: Optional[str] = None
    upload_date: datetime
    last_modified: datetime
    scan_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class DocumentResponse(DocumentInDB):
    pass


class DocumentWithContent(DocumentResponse):
    content: str
