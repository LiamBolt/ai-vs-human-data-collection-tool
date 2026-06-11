"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-11

Builds the full baseline schema (all B1 tables, native enums, constraints, indexes)
directly from the SQLAlchemy model metadata so the migration cannot drift from the models.
"""
from typing import Sequence, Union

from alembic import op

from app.database import Base
import app.models  # noqa: F401 — registers every table on Base.metadata

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
