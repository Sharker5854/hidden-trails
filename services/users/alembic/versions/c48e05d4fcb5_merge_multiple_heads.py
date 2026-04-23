"""merge multiple heads

Revision ID: c48e05d4fcb5
Revises: 6ea17604dedf, a7b8c9d0e1f2
Create Date: 2026-04-23 14:45:33.241066

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c48e05d4fcb5'
down_revision: Union[str, Sequence[str], None] = ('6ea17604dedf', 'a7b8c9d0e1f2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
