from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import os

from sqlalchemy import text

from app.database import Base, engine
from app import models 
from app.routers import (
    auth,
    comments,
    follows,
    messages,
    notifications,
    posts,
    users,
)


Base.metadata.create_all(bind=engine)

with engine.begin() as connection:
    connection.execute(
        text(
            "ALTER TABLE notifications "
            "ADD COLUMN IF NOT EXISTS post_id INTEGER"
        )
    )

os.makedirs("uploads/images", exist_ok=True)
os.makedirs("uploads/videos", exist_ok=True)
os.makedirs("uploads/avatars", exist_ok=True)


app = FastAPI(
    title="Vibe API",
    description="Social media platform backend",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(follows.router)
app.include_router(notifications.router)
app.include_router(messages.router)


@app.get("/")
def root():
    return {
        "message": "Vibe API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }