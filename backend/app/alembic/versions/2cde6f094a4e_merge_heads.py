"""merge heads

Revision ID: 2cde6f094a4e
Revises: 10368f38610b, increase_chat_message_length
Create Date: 2025-10-04 15:52:25.767569

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '2cde6f094a4e'
down_revision = ('10368f38610b', 'increase_chat_message_length')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
