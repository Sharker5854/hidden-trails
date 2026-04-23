"""add saved route publication fields

Revision ID: e7b8c9d0a1f2
Revises: d1a2b3c4e5f6
Create Date: 2026-04-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e7b8c9d0a1f2"
down_revision: Union[str, Sequence[str], None] = "d1a2b3c4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "routes",
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index(op.f("ix_routes_is_public"), "routes", ["is_public"], unique=False)
    op.add_column(
        "route_geotags",
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
    )
    op.alter_column("routes", "is_public", server_default=None)
    op.alter_column("route_geotags", "position", server_default=None)


def downgrade() -> None:
    op.drop_column("route_geotags", "position")
    op.drop_index(op.f("ix_routes_is_public"), table_name="routes")
    op.drop_column("routes", "is_public")
