import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TicketStatus(enum.StrEnum):
    nowe = "nowe"
    przyjete = "przyjete"
    zamkniete = "zamkniete"


class TicketPriority(enum.StrEnum):
    niski = "niski"
    sredni = "sredni"
    wysoki = "wysoki"
    krytyczny = "krytyczny"


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, name="ticket_status_enum", native_enum=True),
        default=TicketStatus.nowe,
        nullable=False,
        index=True,
    )
    reporter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    assigned_to_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("categories.id"), nullable=True, index=True)
    priority: Mapped[TicketPriority | None] = mapped_column(
        Enum(TicketPriority, name="ticket_priority_enum", native_enum=True),
        nullable=True,
        index=True,
    )
    suggested_category_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    suggested_priority: Mapped[TicketPriority | None] = mapped_column(
        Enum(TicketPriority, name="ticket_priority_enum", native_enum=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    reporter = relationship("User", foreign_keys=[reporter_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    category = relationship("Category", foreign_keys=[category_id])
    suggested_category = relationship("Category", foreign_keys=[suggested_category_id])
