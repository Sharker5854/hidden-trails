"""add geotag views count

Revision ID: f3b5d7e9a1c2
Revises: a045312cb35e
Create Date: 2026-04-18 08:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f3b5d7e9a1c2"
down_revision: Union[str, Sequence[str], None] = "a045312cb35e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "geotags",
        sa.Column(
            "views_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.alter_column("geotags", "views_count", server_default=None)


def downgrade() -> None:
    op.drop_column("geotags", "views_count")
