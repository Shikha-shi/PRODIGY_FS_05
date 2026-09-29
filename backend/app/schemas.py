import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_.]{3,30}$")


# ---------- Auth / users ----------

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        value = value.strip()
        if not USERNAME_PATTERN.match(value):
            raise ValueError(
                "Username must be 3-30 characters: letters, numbers, . or _"
            )
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 6:
            raise ValueError("Password must be at least 6 characters")
        return value


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


class UserBrief(BaseModel):
    id: int
    username: str
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    is_following: bool = False


class UpdateProfile(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not USERNAME_PATTERN.match(value):
            raise ValueError(
                "Username must be 3-30 characters: letters, numbers, . or _"
            )
        return value


class Token(BaseModel):
    access_token: str
    token_type: str


# Follows 

class FollowStatus(BaseModel):
    is_following: bool
    followers_count: int
    following_count: int


#Posts / comments 

class PostResponse(BaseModel):
    id: int
    content: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    author_id: int
    author_username: str
    author_image: Optional[str] = None
    created_at: datetime
    likes_count: int = 0
    comments_count: int = 0
    liked_by_me: bool = False
    hashtags: list[str] = []


class LikeResponse(BaseModel):
    liked: bool
    likes_count: int


class TrendingHashtag(BaseModel):
    name: str
    posts_count: int


class CommentCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Comment cannot be empty")
        return value[:1000]


class CommentResponse(BaseModel):
    id: int
    content: str
    user_id: int
    post_id: int
    username: str
    user_image: Optional[str] = None
    created_at: datetime


# Notifications 

class NotificationResponse(BaseModel):
    id: int
    type: str
    message: str
    is_read: bool
    created_at: datetime
    post_id: Optional[int] = None
    sender_username: Optional[str] = None
    sender_image: Optional[str] = None


# Messages 

class MessageCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty")
        return value[:2000]


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: datetime


class ConversationResponse(BaseModel):
    user: UserBrief
    last_message: str
    last_message_at: datetime
    last_sender_id: int
    unread_count: int
