"""add moderation status and actions

Revision ID: f9a1b2c3d4e5
Revises: e7b8c9d0a1f2
Create Date: 2026-04-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f9a1b2c3d4e5"
down_revision: Union[str, Sequence[str], None] = "e7b8c9d0a1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "geotags",
        sa.Column(
            "moderation_status",
            sa.String(length=32),
            nullable=False,
            server_default="pending",
        ),
    )
    op.add_column(
        "geotags",
        sa.Column("last_moderated_by_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        op.f("ix_geotags_moderation_status"),
        "geotags",
        ["moderation_status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_geotags_last_moderated_by_id"),
        "geotags",
        ["last_moderated_by_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_geotags_last_moderated_by_id_users",
        "geotags",
        "users",
        ["last_moderated_by_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.execute(
        "UPDATE geotags SET moderation_status = CASE "
        "WHEN is_moderated = true THEN 'approved' "
        "WHEN COALESCE(moderator_comment, '') <> '' THEN 'revision' "
        "ELSE 'pending' END"
    )
    op.alter_column("geotags", "moderation_status", server_default=None)

    op.create_table(
        "moderation_actions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("geotag_id", sa.Integer(), nullable=False),
        sa.Column("moderator_id", sa.Integer(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["geotag_id"], ["geotags.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["moderator_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_moderation_actions_id"), "moderation_actions", ["id"], unique=False)
    op.create_index(
        op.f("ix_moderation_actions_geotag_id"),
        "moderation_actions",
        ["geotag_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_moderation_actions_moderator_id"),
        "moderation_actions",
        ["moderator_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_moderation_actions_author_id"),
        "moderation_actions",
        ["author_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_moderation_actions_action"),
        "moderation_actions",
        ["action"],
        unique=False,
    )
    op.create_index(
        op.f("ix_moderation_actions_created_at"),
        "moderation_actions",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_moderation_actions_created_at"), table_name="moderation_actions")
    op.drop_index(op.f("ix_moderation_actions_action"), table_name="moderation_actions")
    op.drop_index(op.f("ix_moderation_actions_author_id"), table_name="moderation_actions")
    op.drop_index(op.f("ix_moderation_actions_moderator_id"), table_name="moderation_actions")
    op.drop_index(op.f("ix_moderation_actions_geotag_id"), table_name="moderation_actions")
    op.drop_index(op.f("ix_moderation_actions_id"), table_name="moderation_actions")
    op.drop_table("moderation_actions")

    op.drop_constraint("fk_geotags_last_moderated_by_id_users", "geotags", type_="foreignkey")
    op.drop_index(op.f("ix_geotags_last_moderated_by_id"), table_name="geotags")
    op.drop_index(op.f("ix_geotags_moderation_status"), table_name="geotags")
    op.drop_column("geotags", "last_moderated_by_id")
    op.drop_column("geotags", "moderation_status")
