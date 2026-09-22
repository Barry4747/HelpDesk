import logging
import uuid
from sqlalchemy.exc import IntegrityError

from app.core.database import SessionLocal
from app.core.llm_client import call_gemini
from app.models.category import Category
from app.models.ticket import Ticket, TicketPriority

logger = logging.getLogger(__name__)


async def generate_ticket_suggestion(ticket_id: uuid.UUID) -> None:
    db = SessionLocal()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            return

        active_categories = db.query(Category).filter(Category.is_active == True).all()
        if not active_categories:
            return

        category_map = {c.name: c.id for c in active_categories}
        category_names = list(category_map.keys())

        suggestion = await call_gemini(ticket.description, category_names)
        if not suggestion:
            return

        suggested_category_name = suggestion.get("category")
        suggested_priority_str = suggestion.get("priority")

        if suggested_category_name not in category_map:
            return

        try:
            priority_enum = TicketPriority(suggested_priority_str)
        except ValueError:
            return

        ticket.suggested_category_id = category_map[suggested_category_name]
        ticket.suggested_priority = priority_enum
        db.commit()

    except Exception as e:
        logger.error(f"Error in generate_ticket_suggestion: {e}")
        db.rollback()
    finally:
        if "ticket" in locals() and ticket:
            ticket.is_ai_processing = False
            db.commit()
        db.close()
