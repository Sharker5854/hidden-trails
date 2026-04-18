"""merge moderation and messages heads

Revision ID: d1a2b3c4e5f6
Revises: 844fa4931734, c8d4f1a7b2e9
Create Date: 2026-04-19 00:00:00.000000

"""
from typing import Sequence, Union


revision: str = "d1a2b3c4e5f6"
down_revision: Union[str, Sequence[str], None] = (
    "844fa4931734",
    "c8d4f1a7b2e9",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
