"""Add cascade delete to quizsession.course_id

Revision ID: 98c65ba436bd
Revises: 2cde6f094a4e
Create Date: 2025-10-06 11:31:30.334302

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '98c65ba436bd'
down_revision = '2cde6f094a4e'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Check if flashcardset table exists before trying to drop it
    if 'flashcardset' in inspector.get_table_names():
        existing_indexes = [i['name'] for i in inspector.get_indexes('flashcardset')]
        
        # Drop indexes only if they exist
        if 'ix_flashcardset_created_at' in existing_indexes:
            op.drop_index(op.f('ix_flashcardset_created_at'), table_name='flashcardset')
        if 'ix_flashcardset_document_id' in existing_indexes:
            op.drop_index(op.f('ix_flashcardset_document_id'), table_name='flashcardset')
        if 'ix_flashcardset_status' in existing_indexes:
            op.drop_index(op.f('ix_flashcardset_status'), table_name='flashcardset')
        if 'ix_flashcardset_updated_at' in existing_indexes:
            op.drop_index(op.f('ix_flashcardset_updated_at'), table_name='flashcardset')
        
        # Drop the table
        op.drop_table('flashcardset')


def downgrade():
    # Only recreate if it doesn't exist
    conn = op.get_bind()
    inspector = inspect(conn)
    
    if 'flashcardset' not in inspector.get_table_names():
        op.create_table('flashcardset',
            sa.Column('content_json', postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True),
            sa.Column('document_id', sa.UUID(), autoincrement=False, nullable=False),
            sa.Column('status', sa.VARCHAR(), autoincrement=False, nullable=False),
            sa.Column('error_message', sa.VARCHAR(length=512), autoincrement=False, nullable=True),
            sa.Column('id', sa.UUID(), autoincrement=False, nullable=False),
            sa.Column('created_at', postgresql.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), autoincrement=False, nullable=False),
            sa.Column('updated_at', postgresql.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), autoincrement=False, nullable=False),
            sa.ForeignKeyConstraint(['document_id'], ['document.id'], name=op.f('flashcardset_document_id_fkey')),
            sa.PrimaryKeyConstraint('id', name=op.f('flashcardset_pkey'))
        )
        op.create_index(op.f('ix_flashcardset_updated_at'), 'flashcardset', ['updated_at'], unique=False)
        op.create_index(op.f('ix_flashcardset_status'), 'flashcardset', ['status'], unique=False)
        op.create_index(op.f('ix_flashcardset_document_id'), 'flashcardset', ['document_id'], unique=False)
        op.create_index(op.f('ix_flashcardset_created_at'), 'flashcardset', ['created_at'], unique=False)
        