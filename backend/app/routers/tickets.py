import uuid

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import ValidationError

from app.dependencies.auth import get_current_user, require_role
from app.exceptions.ticket import (
    InvalidAssigneeError,
    TicketAccessDeniedError,
    TicketDeleteNotAllowedError,
    TicketNotFoundError,
)
from app.models.user import User
from app.schemas.ticket import (
    TicketCreate,
    TicketResponse,
    TicketStatusUpdate,
    TicketUpdateAdmin,
    TicketUpdateSupport,
    PaginatedTicketsResponse,
    TicketFilterParams,
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
        items=items,
        total=total,
        page=filters.page,
        page_size=filters.page_size,
    )


@router.get(
    "/{ticket_id}", response_model=TicketResponse, status_code=status.HTTP_200_OK
)
def get_ticket(
    ticket_id: uuid.UUID,
    service: TicketService = Depends(),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_ticket(ticket_id, current_user)
    except TicketNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Zgłoszenie nie istnieje"
        )
    except TicketAccessDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu do zgłoszenia"
        )


@router.patch(
    "/{ticket_id}", response_model=TicketResponse, status_code=status.HTTP_200_OK
)
def update_ticket(
    ticket_id: uuid.UUID,
    body: dict = Body(...),
    service: TicketService = Depends(),
    current_user: User = Depends(require_role("support", "admin")),
):
    try:
        if current_user.role == "admin":
            data = TicketUpdateAdmin.model_validate(body)
        else:
            data = TicketUpdateSupport.model_validate(body)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=e.errors()
        )

    try:
        return service.update_ticket(ticket_id, data, current_user)
    except TicketNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Zgłoszenie nie istnieje"
        )
    except TicketAccessDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu do zgłoszenia"
        )
    except InvalidAssigneeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Nieprawidłowy przypisany pracownik"
        )


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
    try:
        return service.update_status(ticket_id, data, current_user)
    except TicketNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Zgłoszenie nie istnieje"
        )
    except TicketAccessDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu do zgłoszenia"
        )


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: uuid.UUID,
    service: TicketService = Depends(),
    current_user: User = Depends(require_role("support", "admin")),
):
    try:
        service.delete_ticket(ticket_id, current_user)
    except TicketNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Zgłoszenie nie istnieje"
        )
    except TicketAccessDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu do zgłoszenia"
        )
    except TicketDeleteNotAllowedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do usunięcia tego zgłoszenia"
        )
