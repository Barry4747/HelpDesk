
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.ticket import TicketPriority, TicketStatus


def _ticket() -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid.uuid4(),
        title="Test",
        description="My mouse is broken",
        status=TicketStatus.nowe,
        reporter_id=uuid.uuid4(),
        assigned_to_id=None,
        category_id=None,
        priority=None,
        suggested_category_id=None,
        suggested_priority=None,
        is_ai_processing=True,
    )


def _category(name: str = "Sprzęt") -> SimpleNamespace:
    return SimpleNamespace(id=uuid.uuid4(), name=name, is_active=True)


def _build_fake_db(ticket: SimpleNamespace, categories: list) -> MagicMock:
    db = MagicMock()

    def query_side_effect(model):
        from app.models.category import Category
        from app.models.ticket import Ticket

        q = MagicMock()
        if model is Ticket:
            q.filter.return_value.first.return_value = ticket
        elif model is Category:
            filter_mock = MagicMock()
            filter_mock.all.return_value = categories
            q.filter.return_value = filter_mock
        return q

    db.query.side_effect = query_side_effect
    return db


def _run(coro):
    import asyncio

    return asyncio.get_event_loop().run_until_complete(coro)


class TestGenerateTicketSuggestion:
    def test_call_gemini_returns_none_leaves_suggested_fields_none(self):
        ticket = _ticket()
        cat = _category()
        db = _build_fake_db(ticket, [cat])

        with patch("app.services.llm_service.SessionLocal", return_value=db):
            with patch("app.services.llm_service.call_gemini", new=AsyncMock(return_value=None)):
                from app.services.llm_service import generate_ticket_suggestion

                _run(generate_ticket_suggestion(ticket.id))

        assert ticket.suggested_category_id is None
        assert ticket.suggested_priority is None
        assert ticket.is_ai_processing is False

    def test_hallucinated_category_not_in_active_list_leaves_none(self):
        ticket = _ticket()
        cat = _category("Sprzęt")
        db = _build_fake_db(ticket, [cat])

        fake_response = {"category": "NieistniejącaKategoria", "priority": "niski"}

        with patch("app.services.llm_service.SessionLocal", return_value=db):
            with patch("app.services.llm_service.call_gemini", new=AsyncMock(return_value=fake_response)):
                from app.services.llm_service import generate_ticket_suggestion

                _run(generate_ticket_suggestion(ticket.id))

        assert ticket.suggested_category_id is None
        assert ticket.suggested_priority is None
        assert ticket.is_ai_processing is False

    def test_valid_response_saves_suggestion(self):
        ticket = _ticket()
        cat = _category("Sprzęt")
        db = _build_fake_db(ticket, [cat])

        fake_response = {"category": "Sprzęt", "priority": "sredni"}

        with patch("app.services.llm_service.SessionLocal", return_value=db):
            with patch("app.services.llm_service.call_gemini", new=AsyncMock(return_value=fake_response)):
                from app.services.llm_service import generate_ticket_suggestion

                _run(generate_ticket_suggestion(ticket.id))

        assert ticket.suggested_category_id == cat.id
        assert ticket.suggested_priority == TicketPriority.sredni
        assert ticket.is_ai_processing is False

    def test_empty_category_list_does_not_call_gemini(self):
        ticket = _ticket()
        db = _build_fake_db(ticket, [])

        mock_gemini = AsyncMock()

        with patch("app.services.llm_service.SessionLocal", return_value=db):
            with patch("app.services.llm_service.call_gemini", new=mock_gemini):
                from app.services.llm_service import generate_ticket_suggestion

                _run(generate_ticket_suggestion(ticket.id))

        mock_gemini.assert_not_called()
        assert ticket.is_ai_processing is False
