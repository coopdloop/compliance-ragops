# routers/service_account.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from app.api import deps
from app.core.security import create_service_token
from app.models.service_account import ServiceAccount
from app.models.user import User
from app.schemas.service_account import ServiceAccountCreate, ServiceAccountResponse

router = APIRouter()


@router.post("", response_model=ServiceAccountResponse)
async def create_service_account(
    account: ServiceAccountCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> ServiceAccountResponse:
    """Create a new service account"""
    expires_at = (
        datetime.utcnow() + timedelta(days=account.expires_in_days)
        if account.expires_in_days
        else None
    )

    token, token_hash = create_service_token(
        service_account_id=0,  # Temporary ID until we create the record
        service_name=account.name,
        expires_delta=(
            timedelta(days=account.expires_in_days) if account.expires_in_days else None
        ),
    )

    service_account = ServiceAccount(
        name=account.name,
        description=account.description,
        token_hash=token_hash,
        created_by=current_user.id,
        expires_at=expires_at,
    )

    db.add(service_account)
    db.commit()
    db.refresh(service_account)

    return ServiceAccountResponse(
        id=service_account.id,
        name=service_account.name,
        description=service_account.description,
        token=token,  # Only returned once during creation
        created_at=service_account.created_at,
        expires_at=service_account.expires_at,
        is_active=service_account.is_active,
    )


@router.get("", response_model=List[ServiceAccountResponse])
async def list_service_accounts(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> List[ServiceAccountResponse]:
    """List all service accounts for current user"""
    accounts = (
        db.query(ServiceAccount)
        .filter(ServiceAccount.created_by == current_user.id)
        .all()
    )

    return [
        ServiceAccountResponse(
            id=account.id,
            name=account.name,
            description=account.description,
            token="",  # Don't return token after creation
            created_at=account.created_at,
            expires_at=account.expires_at,
            is_active=account.is_active,
        )
        for account in accounts
    ]


@router.delete("/{account_id}")
async def delete_service_account(
    account_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Delete a service account"""
    account = (
        db.query(ServiceAccount)
        .filter(
            ServiceAccount.id == account_id,
            ServiceAccount.created_by == current_user.id,
        )
        .first()
    )

    if not account:
        raise HTTPException(status_code=404, detail="Service account not found")

    db.delete(account)
    db.commit()
    return {"message": "Service account deleted"}
