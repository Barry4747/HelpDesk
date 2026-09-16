from fastapi import FastAPI

from app.routers import auth, categories, departments, stats, tickets, users

app = FastAPI(
    title="HelpDesk API",
    version="0.1.0",
    description="API serwisu zgłoszeń HelpDesk",
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
