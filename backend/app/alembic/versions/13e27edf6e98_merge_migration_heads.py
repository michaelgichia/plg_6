"""merge_migration_heads

Revision ID: 13e27edf6e98
Revises: 39944de728d4, 6e308b39ff60
Create Date: 2025-09-23 08:05:11.662876

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '13e27edf6e98'
down_revision = ('39944de728d4', '6e308b39ff60')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
