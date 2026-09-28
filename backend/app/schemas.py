from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    bio: str | None = None
    profile_image: str | None = None
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class PostCreate(BaseModel):
    content: str | None = None


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str | None
    media_url: str | None
    media_type: str | None
    author_id: int
    created_at: datetime