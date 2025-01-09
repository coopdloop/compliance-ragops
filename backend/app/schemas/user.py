from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    auth0_id: str


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    jobTitle: Optional[str] = None
    department: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserBase):
    id: int
    auth0_id: str
    job_title: Optional[str] = None
    department: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfile(UserInDB):
    pass


class OpenAIKeyUpdate(BaseModel):
    openai_key: str


# Additional response models
class UserResponse(BaseModel):
    id: int
    email: Optional[str] = None
    name: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    auth0_id: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(BaseModel):
    id: int
    name: Optional[str] = None
    email: Optional[str] = None
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    auth0Id: str

    model_config = ConfigDict(from_attributes=True)
