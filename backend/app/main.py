from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.limiter import limiter
from app.routers import auth, categories, departments, stats, tickets, users

app = FastAPI(
    title="HelpDesk API",
    version="0.1.0",
    description="API serwisu zgłoszeń HelpDesk",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler) # type: ignore[arg-type]

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
