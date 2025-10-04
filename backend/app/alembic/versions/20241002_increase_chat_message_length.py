"""merge heads and increase chat message length

Revision ID: increase_chat_message_length
Revises: fde4e8f23f5c, 177fc617fc0b
Create Date: 2025-10-03 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'increase_chat_message_length'
down_revision = ('fde4e8f23f5c', '177fc617fc0b')
branch_labels = None
depends_on = None


def upgrade():
    # Increase the message column length from 1024 to 8192 characters
    op.alter_column('chat', 'message',
                    existing_type=sa.VARCHAR(length=1024),
                    type_=sa.VARCHAR(length=8192),
                    existing_nullable=True)


def downgrade():
    # Revert back to original length
    op.alter_column('chat', 'message',
                    existing_type=sa.VARCHAR(length=8192),
                    type_=sa.VARCHAR(length=1024),
                    existing_nullable=True)