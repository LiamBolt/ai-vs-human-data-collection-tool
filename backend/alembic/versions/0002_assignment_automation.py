"""assignment automation: form 0 completion time + auto-assign flag

Revision ID: 0002_assignment_automation
Revises: 0001_initial
Create Date: 2026-06-18

Additive, non-destructive columns supporting automatic group assignment with a
proctor grace window:
  - participants.form0_completed_at  → when the grace window starts
  - participants.auto_assigned       → True when the server assigned the group
                                       (no proctor action), for clear audit.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_assignment_automation"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "participants",
        sa.Column("form0_completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "participants",
        sa.Column("auto_assigned", sa.Boolean(), server_default=sa.false(), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("participants", "auto_assigned")
    op.drop_column("participants", "form0_completed_at")
