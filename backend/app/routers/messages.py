from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Message, User
from app.routers.auth import get_current_user
from app.schemas import (
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)
from app.services import get_user_or_404, serialize_users


router = APIRouter(
    prefix="/messages",
    tags=["Messages"],
)


def serialize_message(message: Message) -> dict:
    return {
        "id": message.id,
        "sender_id": message.sender_id,
        "receiver_id": message.receiver_id,
        "content": message.content,
        "is_read": bool(message.is_read),
        "created_at": message.created_at,
    }


@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    messages = (
        db.query(Message)
        .filter(
            or_(
                Message.sender_id == current_user.id,
                Message.receiver_id == current_user.id,
            )
        )
        .order_by(Message.created_at.desc(), Message.id.desc())
        .all()
    )

    latest: dict[int, Message] = {}
    unread: dict[int, int] = {}

    for message in messages:
        other_id = (
            message.receiver_id
            if message.sender_id == current_user.id
            else message.sender_id
        )
        latest.setdefault(other_id, message)

        if message.receiver_id == current_user.id and not message.is_read:
            unread[other_id] = unread.get(other_id, 0) + 1

    if not latest:
        return []

    users = db.query(User).filter(User.id.in_(latest.keys())).all()
    briefs = {
        brief["id"]: brief
        for brief in serialize_users(db, users, current_user)
    }

    return [
        {
            "user": briefs[other_id],
            "last_message": message.content,
            "last_message_at": message.created_at,
            "last_sender_id": message.sender_id,
            "unread_count": unread.get(other_id, 0),
        }
        for other_id, message in latest.items()
        if other_id in briefs
    ]


@router.get("/unread-count")
def unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = (
        db.query(Message)
        .filter(
            Message.receiver_id == current_user.id,
            Message.is_read.is_(False),
        )
        .count()
    )
    return {"count": count}


@router.get("/with/{username}", response_model=list[MessageResponse])
def get_conversation(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    other = get_user_or_404(db, username)

    messages = (
        db.query(Message)
        .filter(
            or_(
                and_(
                    Message.sender_id == current_user.id,
                    Message.receiver_id == other.id,
                ),
                and_(
                    Message.sender_id == other.id,
                    Message.receiver_id == current_user.id,
                ),
            )
        )
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )

    changed = False
    for message in messages:
        if message.receiver_id == current_user.id and not message.is_read:
            message.is_read = True
            changed = True
    if changed:
        db.commit()

    return [serialize_message(message) for message in messages]


@router.post("/with/{username}", response_model=MessageResponse)
def send_message(
    username: str,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    other = get_user_or_404(db, username)

    if other.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot message yourself",
        )

    message = Message(
        sender_id=current_user.id,
        receiver_id=other.id,
        content=data.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return serialize_message(message)
