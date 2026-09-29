from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(BaseModel):
    id: int
    username: str
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    followers_count: int
    following_count: int
    posts_count: int

    model_config = ConfigDict(from_attributes=True)


class UpdateProfile(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class PostCreate(BaseModel):
    content: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None


class PostResponse(BaseModel):
    id: int
    content: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    author_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)