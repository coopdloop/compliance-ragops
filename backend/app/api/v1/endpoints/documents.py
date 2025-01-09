from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import json

from app.api import deps
from app.models.document import ComplianceDocument, DocumentCategory
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentCreate
from app.utils.texts import extract_text_from_binary

router = APIRouter()


@router.post("/", response_model=DocumentResponse)
async def upload_document(
    name: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    version: str = Form("1.0"),
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Upload a new compliance document"""
    allowed_extensions = {
        ".json",
        ".txt",
        ".md",
        ".yaml",
        ".yml",
        ".xml",
        ".pdf",
        ".doc",
        ".docx",
    }
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Must be one of: {', '.join(allowed_extensions)}",
        )

    try:
        content = await file.read()

        # Process different file types
        if file_ext in {".pdf", ".doc", ".docx", ".yaml", ".yml", ".xml"}:
            processed_content = extract_text_from_binary(content, file_ext)
            if isinstance(processed_content, (dict, list)):
                processed_content = json.dumps(processed_content)
        else:
            processed_content = content.decode()

        # Create document record
        doc = ComplianceDocument(
            name=name,
            category=DocumentCategory[category.upper()],
            description=description,
            version=version,
            content=processed_content,
            file_type=file_ext,
            original_filename=file.filename,
            uploaded_by=current_user.id,
        )

        db.add(doc)
        db.commit()
        db.refresh(doc)

        return doc

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error uploading document: {str(e)}"
        )


@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Get all documents"""
    return db.query(ComplianceDocument).all()


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Get a specific document"""
    doc = db.query(ComplianceDocument).filter(ComplianceDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Delete a document"""
    doc = db.query(ComplianceDocument).filter(ComplianceDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        db.delete(doc)
        db.commit()
        return {"message": f"Document {doc_id} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error deleting document: {str(e)}"
        )
