from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import Base, engine
from app.routers import auth,users


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Vibe API",
    description="Backend API for the Vibe social media platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {
        "message": "Vibe API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }