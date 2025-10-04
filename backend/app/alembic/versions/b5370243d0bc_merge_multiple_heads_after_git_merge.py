"""Merge multiple heads after git merge

Revision ID: b5370243d0bc
Revises: 10594e38957f, fde4e8f23f5c
Create Date: 2025-10-02 06:01:40.513433

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'b5370243d0bc'
down_revision = ('10594e38957f', 'fde4e8f23f5c')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
