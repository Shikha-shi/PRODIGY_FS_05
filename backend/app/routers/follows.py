from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Follow, User
from app.routers.auth import get_current_user
from app.schemas import FollowStatus, UserBrief
from app.services import (
    create_notification,
    get_user_or_404,
    remove_notification,
    serialize_users,
)


router = APIRouter(
    prefix="/follows",
    tags=["Follows"],
)


def build_status(db: Session, viewer: User, target: User) -> dict:
    return {
        "is_following": (
            db.query(Follow)
            .filter(
                Follow.follower_id == viewer.id,
                Follow.following_id == target.id,
            )
            .first()
            is not None
        ),
        "followers_count": db.query(Follow)
        .filter(Follow.following_id == target.id)
        .count(),
        "following_count": db.query(Follow)
        .filter(Follow.follower_id == target.id)
        .count(),
    }


# Static paths first so they are not swallowed by /{username}

@router.get("/status/{username}", response_model=FollowStatus)
def follow_status(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = get_user_or_404(db, username)
    return build_status(db, current_user, target)


@router.get("/followers/{username}", response_model=list[UserBrief])
def get_followers(
    username: str,
    q: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Users who follow `username` (Follow.following_id == user.id)."""
    target = get_user_or_404(db, username)

    query = (
        db.query(User)
        .join(Follow, Follow.follower_id == User.id)
        .filter(Follow.following_id == target.id)
    )
    if q.strip():
        query = query.filter(User.username.ilike(f"%{q.strip()}%"))

    users = query.order_by(Follow.created_at.desc()).all()
    return serialize_users(db, users, current_user)


@router.get("/following/{username}", response_model=list[UserBrief])
def get_following(
    username: str,
    q: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Users that `username` follows (Follow.follower_id == user.id)."""
    target = get_user_or_404(db, username)

    query = (
        db.query(User)
        .join(Follow, Follow.following_id == User.id)
        .filter(Follow.follower_id == target.id)
    )
    if q.strip():
        query = query.filter(User.username.ilike(f"%{q.strip()}%"))

    users = query.order_by(Follow.created_at.desc()).all()
    return serialize_users(db, users, current_user)


@router.post("/{username}", response_model=FollowStatus)
def follow_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = get_user_or_404(db, username)

    if target.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot follow yourself",
        )

    existing = (
        db.query(Follow)
        .filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == target.id,
        )
        .first()
    )

    if not existing:
        db.add(
            Follow(
                follower_id=current_user.id,
                following_id=target.id,
            )
        )
        create_notification(
            db,
            user_id=target.id,
            sender=current_user,
            type="follow",
            message=f"{current_user.username} started following you",
        )
        db.commit()

    return build_status(db, current_user, target)


@router.delete("/{username}", response_model=FollowStatus)
def unfollow_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = get_user_or_404(db, username)

    db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == target.id,
    ).delete(synchronize_session=False)

    remove_notification(
        db,
        user_id=target.id,
        sender_id=current_user.id,
        type="follow",
    )
    db.commit()

    return build_status(db, current_user, target)
