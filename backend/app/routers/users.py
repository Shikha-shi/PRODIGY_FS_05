from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Post, Follow
from app.schemas import (
    UserResponse,
    UserProfileResponse,
    UpdateProfile,
)
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    profile: UpdateProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if profile.username and profile.username != current_user.username:
        existing_user = (
            db.query(User)
            .filter(User.username == profile.username)
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Username already exists",
            )

        current_user.username = profile.username

    if profile.bio is not None:
        current_user.bio = profile.bio

    if profile.profile_image is not None:
        current_user.profile_image = profile.profile_image

    db.commit()
    db.refresh(current_user)

    return current_user


@router.get(
    "/{username}",
    response_model=UserProfileResponse,
)
def get_user_profile(
    username: str,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    followers_count = (
        db.query(Follow)
        .filter(Follow.following_id == user.id)
        .count()
    )

    following_count = (
        db.query(Follow)
        .filter(Follow.follower_id == user.id)
        .count()
    )

    posts_count = (
        db.query(Post)
        .filter(Post.author_id == user.id)
        .count()
    )

    return {
        "id": user.id,
        "username": user.username,
        "bio": user.bio,
        "profile_image": user.profile_image,
        "followers_count": followers_count,
        "following_count": following_count,
        "posts_count": posts_count,
    }