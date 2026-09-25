import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.database import SessionLocal
from app.core.limiter import limiter
from app.models.ticket import Ticket
from app.routers import auth, categories, departments, stats, tickets, users

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        db = SessionLocal()
        zombie_tickets = db.query(Ticket).filter(Ticket.is_ai_processing == True).all()
        for t in zombie_tickets:
            t.is_ai_processing = False
        if zombie_tickets:
            db.commit()
            logger.info(f"Cleared {len(zombie_tickets)} zombie AI processing locks.")
    except Exception as e:
        logger.error(f"Failed to clear AI processing locks on startup: {e}")
    finally:
        db.close()
    yield


app = FastAPI(
    title="HelpDesk API",
    version="0.1.0",
    description="API serwisu zgłoszeń HelpDesk",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tickets.router)
app.include_router(categories.router)
app.include_router(departments.router)
app.include_router(stats.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
