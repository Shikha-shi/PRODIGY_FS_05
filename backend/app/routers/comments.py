from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Comment, Post, User
from app.routers.auth import get_current_user
from app.schemas import CommentCreate, CommentResponse
from app.services import create_notification


router = APIRouter(
    prefix="/comments",
    tags=["Comments"],
)


def serialize_comment(comment: Comment) -> dict:
    return {
        "id": comment.id,
        "content": comment.content,
        "user_id": comment.user_id,
        "post_id": comment.post_id,
        "username": comment.user.username,
        "user_image": comment.user.profile_image,
        "created_at": comment.created_at,
    }


@router.get("/post/{post_id}", response_model=list[CommentResponse])
def get_comments(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.query(Post).filter(Post.id == post_id).first():
        raise HTTPException(status_code=404, detail="Post not found")

    comments = (
        db.query(Comment)
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    return [serialize_comment(comment) for comment in comments]


@router.post("/post/{post_id}", response_model=CommentResponse)
def add_comment(
    post_id: int,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = Comment(
        content=data.content,
        user_id=current_user.id,
        post_id=post_id,
    )
    db.add(comment)

    create_notification(
        db,
        user_id=post.author_id,
        sender=current_user,
        type="comment",
        message=f"{current_user.username} commented on your post",
        post_id=post_id,
    )

    db.commit()
    db.refresh(comment)
    return serialize_comment(comment)


@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own comments",
        )

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}
