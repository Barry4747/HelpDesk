import uuid
from collections.abc import Sequence

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, session: Session = Depends(get_db)):
        self.session = session

    def create(self, refresh_token: RefreshToken) -> RefreshToken:
        self.session.add(refresh_token)
        self.session.commit()
        self.session.refresh(refresh_token)
        return refresh_token

    def get_by_token_hash(self, token_hash: str) -> RefreshToken | None:
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        return self.session.scalars(stmt).first()

    def revoke(self, refresh_token: RefreshToken) -> RefreshToken:
        refresh_token.revoked = True
        self.session.commit()
        self.session.refresh(refresh_token)
        return refresh_token

    def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        stmt = select(RefreshToken).where(
            RefreshToken.user_id == user_id, RefreshToken.revoked == False
        )
        tokens: Sequence[RefreshToken] = self.session.scalars(stmt).all()
        for token in tokens:
            token.revoked = True
        self.session.commit()

    # TODO: Implement reuse detection logic (revoke all tokens for user if reused)
