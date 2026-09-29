import re
from typing import Iterable

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    Comment,
    Follow,
    Hashtag,
    Like,
    Notification,
    Post,
    PostHashtag,
    User,
)

HASHTAG_PATTERN = re.compile(r"#(\w{1,50})", re.UNICODE)


# Notifications 

def create_notification(
    db: Session,
    *,
    user_id: int,
    sender: User,
    type: str,
    message: str,
    post_id: int | None = None,
) -> None:
    """Notify user_id about an action by sender (never notifies yourself)."""
    if user_id == sender.id:
        return

    db.add(
        Notification(
            user_id=user_id,
            sender_id=sender.id,
            type=type,
            message=message,
            post_id=post_id,
        )
    )


def remove_notification(
    db: Session,
    *,
    user_id: int,
    sender_id: int,
    type: str,
    post_id: int | None = None,
) -> None:
    query = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.sender_id == sender_id,
        Notification.type == type,
    )
    if post_id is not None:
        query = query.filter(Notification.post_id == post_id)
    query.delete(synchronize_session=False)


# Hashtags 

def extract_hashtags(content: str | None) -> list[str]:
    if not content:
        return []
    seen: list[str] = []
    for match in HASHTAG_PATTERN.findall(content):
        tag = match.lower()
        if tag not in seen:
            seen.append(tag)
    return seen


def attach_hashtags(db: Session, post: Post) -> None:
    for name in extract_hashtags(post.content):
        hashtag = db.query(Hashtag).filter(Hashtag.name == name).first()
        if not hashtag:
            hashtag = Hashtag(name=name)
            db.add(hashtag)
            db.flush()
        db.add(PostHashtag(post_id=post.id, hashtag_id=hashtag.id))


#  Serialization

def serialize_posts(
    db: Session,
    posts: Iterable[Post],
    current_user: User,
) -> list[dict]:
    posts = list(posts)
    if not posts:
        return []

    ids = [post.id for post in posts]

    likes = dict(
        db.query(Like.post_id, func.count(Like.id))
        .filter(Like.post_id.in_(ids))
        .group_by(Like.post_id)
        .all()
    )
    comments = dict(
        db.query(Comment.post_id, func.count(Comment.id))
        .filter(Comment.post_id.in_(ids))
        .group_by(Comment.post_id)
        .all()
    )
    liked = {
        row[0]
        for row in db.query(Like.post_id)
        .filter(Like.post_id.in_(ids), Like.user_id == current_user.id)
        .all()
    }

    tags: dict[int, list[str]] = {}
    for post_id, name in (
        db.query(PostHashtag.post_id, Hashtag.name)
        .join(Hashtag, Hashtag.id == PostHashtag.hashtag_id)
        .filter(PostHashtag.post_id.in_(ids))
        .all()
    ):
        tags.setdefault(post_id, []).append(name)

    return [
        {
            "id": post.id,
            "content": post.content,
            "media_url": post.media_url,
            "media_type": post.media_type,
            "author_id": post.author_id,
            "author_username": post.author.username,
            "author_image": post.author.profile_image,
            "created_at": post.created_at,
            "likes_count": likes.get(post.id, 0),
            "comments_count": comments.get(post.id, 0),
            "liked_by_me": post.id in liked,
            "hashtags": tags.get(post.id, []),
        }
        for post in posts
    ]


def serialize_users(
    db: Session,
    users: Iterable[User],
    current_user: User,
) -> list[dict]:
    users = list(users)
    if not users:
        return []

    followed = {
        row[0]
        for row in db.query(Follow.following_id)
        .filter(
            Follow.follower_id == current_user.id,
            Follow.following_id.in_([user.id for user in users]),
        )
        .all()
    }

    return [
        {
            "id": user.id,
            "username": user.username,
            "bio": user.bio,
            "profile_image": user.profile_image,
            "is_following": user.id in followed,
        }
        for user in users
    ]


def get_user_or_404(db: Session, username: str) -> User:
    from fastapi import HTTPException

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
