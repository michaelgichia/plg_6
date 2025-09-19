"""Create course table

Revision ID: 3f2a7c0d3e21
Revises: 1a31ce608336
Create Date: 2025-09-19 00:00:00

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes

# revision identifiers, used by Alembic.
revision = "3f2a7c0d3e21"
down_revision = "1a31ce608336"
branch_labels = None
depends_on = None


def upgrade():
    # Create the course table referencing the pre-rename user table
    op.create_table(
        "course",
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column("description", sqlmodel.sql.sqltypes.AutoString(length=1020), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("course")


