"""Merge multiple heads

Revision ID: 9edab5efe2e4
Revises: 39944de728d4, 6e308b39ff60
Create Date: 2025-09-23 08:31:28.498281

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '9edab5efe2e4'
down_revision = ('39944de728d4', '6e308b39ff60')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
