from unittest.mock import AsyncMock, patch

import pytest


class TestLlmFallback:
    def test_post_ticket_returns_201_even_when_llm_fails(
        self, reporter_client, active_category
    ):
        with patch("app.services.llm_service.call_gemini", new=AsyncMock(return_value=None)):
            resp = reporter_client.post(
                "/api/v1/tickets",
                json={"title": "LLM Fallback Test", "description": "My printer is on fire"},
            )
        assert resp.status_code == 201

    def test_suggested_fields_are_none_when_llm_returns_none(
        self, reporter_client, active_category
    ):
        with patch("app.services.llm_service.call_gemini", new=AsyncMock(return_value=None)):
            resp = reporter_client.post(
                "/api/v1/tickets",
                json={"title": "LLM Fallback", "description": "Something broke"},
            )
        assert resp.status_code == 201
        ticket_id = resp.json()["id"]

        detail = reporter_client.get(f"/api/v1/tickets/{ticket_id}")
        assert detail.status_code == 200
        data = detail.json()
        assert data["suggested_category_id"] is None
        assert data["suggested_priority"] is None

    def test_ticket_visible_to_reporter_immediately_even_during_processing(
        self, reporter_client, active_category
    ):
        with patch("app.services.llm_service.call_gemini", new=AsyncMock(return_value=None)):
            post_resp = reporter_client.post(
                "/api/v1/tickets",
                json={"title": "Immediate visibility", "description": "Test"},
            )
        assert post_resp.status_code == 201
        ticket_id = post_resp.json()["id"]

        list_resp = reporter_client.get("/api/v1/tickets")
        ids = [t["id"] for t in list_resp.json()["items"]]
        assert ticket_id in ids
