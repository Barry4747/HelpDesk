import uuid

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import ValidationError

from app.dependencies.auth import get_current_user, require_role
from app.models.user import User
from app.schemas.ticket import (
    PaginatedTicketsResponse,
    TicketCreate,
    TicketFilterParams,
    TicketResponse,
    TicketStatusUpdate,
    TicketUpdateAdmin,
    TicketUpdateSupport,
)
from app.services.ticket import TicketService

router = APIRouter(prefix="/api/v1/tickets", tags=["tickets"])


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    data: TicketCreate,
    service: TicketService = Depends(),
    current_user: User = Depends(require_role("reporter")),
):
    return service.create_ticket(data, reporter_id=current_user.id)


@router.get("", response_model=PaginatedTicketsResponse, status_code=status.HTTP_200_OK)
def list_tickets(
    filters: TicketFilterParams = Depends(),
    service: TicketService = Depends(),
    current_user: User = Depends(get_current_user),
):
    items, total = service.list_tickets(filters, current_user)
    return PaginatedTicketsResponse(
        items=items,  # type: ignore[arg-type]
        total=total,
        page=filters.page,
        page_size=filters.page_size,
    )


@router.get("/{ticket_id}", response_model=TicketResponse, status_code=status.HTTP_200_OK)
def get_ticket(
    ticket_id: uuid.UUID,
    service: TicketService = Depends(),
    current_user: User = Depends(get_current_user),
):
    return service.get_ticket(ticket_id, current_user)


@router.patch("/{ticket_id}", response_model=TicketResponse, status_code=status.HTTP_200_OK)
def update_ticket(
    ticket_id: uuid.UUID,
    body: dict = Body(...),
    service: TicketService = Depends(),
    current_user: User = Depends(require_role("support", "admin")),
):
    try:
        if current_user.role == "admin":
            data = TicketUpdateAdmin.model_validate(body)  # type: ignore[assignment]
        else:
            data = TicketUpdateSupport.model_validate(body)  # type: ignore[assignment]
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=e.errors()) from e

    return service.update_ticket(ticket_id, data, current_user)


@router.patch(
    "/{ticket_id}/status",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK,
)
def change_ticket_status(
    ticket_id: uuid.UUID,
    data: TicketStatusUpdate,
    service: TicketService = Depends(),
    current_user: User = Depends(require_role("support", "admin")),
):
    return service.update_status(ticket_id, data, current_user)


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: uuid.UUID,
    service: TicketService = Depends(),
    current_user: User = Depends(require_role("support", "admin")),
):
    service.delete_ticket(ticket_id, current_user)
