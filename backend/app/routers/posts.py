import os
import shutil
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Follow,
    Hashtag,
    Like,
    Notification,
    Post,
    PostHashtag,
    User,
)
from app.routers.auth import get_current_user
from app.schemas import (
    LikeResponse,
    PostResponse,
    TrendingHashtag,
    UserBrief,
)
from app.services import (
    attach_hashtags,
    create_notification,
    get_user_or_404,
    remove_notification,
    serialize_posts,
    serialize_users,
)


router = APIRouter(
    prefix="/posts",
    tags=["Posts"],
)

IMAGE_DIR = "uploads/images"
VIDEO_DIR = "uploads/videos"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}

os.makedirs(IMAGE_DIR, exist_ok=True)
os.makedirs(VIDEO_DIR, exist_ok=True)


def get_post_or_404(db: Session, post_id: int) -> Post:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


# ---------- Create ----------

@router.post("", response_model=PostResponse)
def create_post(
    content: str = Form(""),
    media: UploadFile | None = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not content.strip() and not media:
        raise HTTPException(status_code=400, detail="Post cannot be empty")

    media_url = None
    media_type = None

    if media and media.filename:
        extension = os.path.splitext(media.filename)[1].lower()

        if extension in IMAGE_EXTENSIONS:
            media_type, directory = "image", IMAGE_DIR
        elif extension in VIDEO_EXTENSIONS:
            media_type, directory = "video", VIDEO_DIR
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported media format",
            )

        filename = f"{uuid4().hex}{extension}"
        with open(os.path.join(directory, filename), "wb") as buffer:
            shutil.copyfileobj(media.file, buffer)

        media_url = f"/{directory}/{filename}"

    post = Post(
        content=content.strip() or None,
        media_url=media_url,
        media_type=media_type,
        author_id=current_user.id,
        created_at=datetime.utcnow(),
    )
    db.add(post)
    db.flush()

    attach_hashtags(db, post)
    db.commit()
    db.refresh(post)

    return serialize_posts(db, [post], current_user)[0]


# ---------- Lists (static paths before /{post_id}) ----------

@router.get("", response_model=list[PostResponse])
def get_feed(
    scope: str = "all",
    skip: int = 0,
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """scope=all -> every post, scope=following -> me + people I follow."""
    query = db.query(Post)

    if scope == "following":
        followed = [
            row[0]
            for row in db.query(Follow.following_id)
            .filter(Follow.follower_id == current_user.id)
            .all()
        ]
        query = query.filter(Post.author_id.in_(followed + [current_user.id]))

    posts = (
        query.order_by(Post.created_at.desc())
        .offset(skip)
        .limit(min(limit, 100))
        .all()
    )
    return serialize_posts(db, posts, current_user)


@router.get("/mine", response_model=list[PostResponse])
def get_my_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    posts = (
        db.query(Post)
        .filter(Post.author_id == current_user.id)
        .order_by(Post.created_at.desc())
        .all()
    )
    return serialize_posts(db, posts, current_user)


@router.get("/user/{username}", response_model=list[PostResponse])
def get_user_posts(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = get_user_or_404(db, username)
    posts = (
        db.query(Post)
        .filter(Post.author_id == user.id)
        .order_by(Post.created_at.desc())
        .all()
    )
    return serialize_posts(db, posts, current_user)


@router.get("/trending", response_model=list[PostResponse])
def get_trending_posts(
    media: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Posts ranked by engagement; recent posts get a small boost."""
    query = db.query(Post)
    if media in ("image", "video"):
        query = query.filter(Post.media_type == media)

    posts = query.order_by(Post.created_at.desc()).limit(200).all()
    if not posts:
        return []

    serialized = serialize_posts(db, posts, current_user)
    now = datetime.utcnow()

    def score(item: dict) -> float:
        age_days = max((now - item["created_at"]).total_seconds() / 86400, 0)
        engagement = item["likes_count"] * 2 + item["comments_count"] * 3
        return engagement / (1 + age_days * 0.3)

    serialized.sort(key=lambda item: (score(item), item["created_at"]), reverse=True)
    return serialized[:40]


@router.get("/hashtags/trending", response_model=list[TrendingHashtag])
def get_trending_hashtags(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Hashtag.name, func.count(PostHashtag.id).label("total"))
        .join(PostHashtag, PostHashtag.hashtag_id == Hashtag.id)
        .group_by(Hashtag.name)
        .order_by(func.count(PostHashtag.id).desc(), Hashtag.name.asc())
        .limit(10)
        .all()
    )
    return [{"name": name, "posts_count": total} for name, total in rows]


@router.get("/hashtag/{name}", response_model=list[PostResponse])
def get_posts_by_hashtag(
    name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    posts = (
        db.query(Post)
        .join(PostHashtag, PostHashtag.post_id == Post.id)
        .join(Hashtag, Hashtag.id == PostHashtag.hashtag_id)
        .filter(Hashtag.name == name.lower().lstrip("#"))
        .order_by(Post.created_at.desc())
        .all()
    )
    return serialize_posts(db, posts, current_user)


# ---------- Single post ----------

@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = get_post_or_404(db, post_id)
    return serialize_posts(db, [post], current_user)[0]


@router.post("/{post_id}/like", response_model=LikeResponse)
def toggle_like(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = get_post_or_404(db, post_id)

    like = (
        db.query(Like)
        .filter(Like.user_id == current_user.id, Like.post_id == post_id)
        .first()
    )

    if like:
        db.delete(like)
        remove_notification(
            db,
            user_id=post.author_id,
            sender_id=current_user.id,
            type="like",
            post_id=post_id,
        )
        liked = False
    else:
        db.add(Like(user_id=current_user.id, post_id=post_id))
        create_notification(
            db,
            user_id=post.author_id,
            sender=current_user,
            type="like",
            message=f"{current_user.username} liked your post",
            post_id=post_id,
        )
        liked = True

    db.commit()

    return {
        "liked": liked,
        "likes_count": db.query(Like).filter(Like.post_id == post_id).count(),
    }


@router.get("/{post_id}/likes", response_model=list[UserBrief])
def get_post_likes(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_post_or_404(db, post_id)

    users = (
        db.query(User)
        .join(Like, Like.user_id == User.id)
        .filter(Like.post_id == post_id)
        .order_by(Like.created_at.desc())
        .all()
    )
    return serialize_users(db, users, current_user)


@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = get_post_or_404(db, post_id)

    if post.author_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own posts",
        )

    media_path = post.media_url.lstrip("/") if post.media_url else None

    db.query(Notification).filter(
        Notification.post_id == post_id
    ).delete(synchronize_session=False)

    db.delete(post)
    db.commit()

    if media_path and os.path.isfile(media_path):
        try:
            os.remove(media_path)
        except OSError:
            pass

    return {"message": "Post deleted successfully"}
