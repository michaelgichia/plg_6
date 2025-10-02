"""merge_migration_heads-from-two-branches

Revision ID: fde4e8f23f5c
Revises: 13e27edf6e98, b93831eb9fa1
Create Date: 2025-09-26 08:12:57.856800

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'fde4e8f23f5c'
down_revision = ('13e27edf6e98', 'b93831eb9fa1')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
