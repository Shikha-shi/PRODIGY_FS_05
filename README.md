# 💜 Vibe

**Connect. Share. Vibe.** — a full-stack social media platform built for the Prodigy Infotech Full Stack Internship (Task 05).

**Stack:** React · TypeScript · Vite · FastAPI · SQLAlchemy · PostgreSQL · JWT · Argon2

## Features

- Register, log in and log out (JWT auth, Argon2 password hashing)
- Profiles with editable bio and profile photo
- Text, image and video posts with `#hashtags`
- Likes (see who liked a post) and comments
- Follow/unfollow, with searchable followers and following lists
- User search, Explore page with trending posts and hashtags
- Notifications for likes, comments and follows
- Direct messages with unread badges
- Pink and purple responsive UI; each browser tab can use a different account

## Getting Started

**Prerequisites:** Python 3.12+, Node.js 20+, PostgreSQL

```bash
git clone https://github.com/Shikha-shi/PRODIGY_FS_05.git
cd PRODIGY_FS_05
```

**Database**
```sql
CREATE DATABASE vibe_db;
```

**Backend** (http://localhost:8000, docs at `/docs`)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
Create `backend/.env`:
```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@localhost:5432/vibe_db
SECRET_KEY=your-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```
```bash
fastapi dev app/main.py
```

**Frontend** (http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```

Open two browser tabs and sign up a different user in each to try following, liking, commenting and messaging.

## Project Structure

```
backend/app/   main.py, models.py, schemas.py, services.py, routers/
frontend/src/  components/, context/, pages/, services/, types/
```

## Notes

- The JWT is stored in `sessionStorage`, so separate tabs keep separate sessions.
- Messages refresh by polling, not WebSockets.
- Never commit `backend/.env`.

## Author

**Shikha Yadav** — [@Shikha-shi](https://github.com/Shikha-shi)
