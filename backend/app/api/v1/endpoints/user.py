from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from openai import OpenAI

from app.api import deps
from app.models.user import User
from app.schemas.user import (
    OpenAIKeyUpdate,
    UserProfileUpdate,
    UserProfileResponse,
)

router = APIRouter()


# Note: Moved from /users/profile to /user/profile to match frontend
@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(deps.get_current_user),
) -> UserProfileResponse:
    """Get current user profile"""
    return UserProfileResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        jobTitle=current_user.job_title,
        department=current_user.department,
        auth0Id=current_user.auth0_id,
    )


@router.patch("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile: UserProfileUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> UserProfileResponse:
    """Update user profile"""
    if profile.name is not None:
        current_user.name = profile.name
    if profile.jobTitle is not None:
        current_user.job_title = profile.jobTitle
    if profile.department is not None:
        current_user.department = profile.department

    db.commit()
    db.refresh(current_user)

    return UserProfileResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        jobTitle=current_user.job_title,
        department=current_user.department,
        auth0Id=current_user.auth0_id,
    )


@router.post("/openai-key")
async def update_openai_key(
    key_update: OpenAIKeyUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Update user's OpenAI API key"""
    try:
        client = OpenAI(api_key=key_update.openai_key)
        client.models.list()  # Test the key

        current_user.openai_key = key_update.openai_key
        db.commit()

        return {"message": "OpenAI API key updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid OpenAI API key: {str(e)}")


@router.get("/has-openai-key")
async def check_openai_key(
    current_user: User = Depends(deps.get_current_user),
) -> dict:
    """Check if user has stored an OpenAI API key"""
    return {"has_key": current_user.openai_key is not None}
