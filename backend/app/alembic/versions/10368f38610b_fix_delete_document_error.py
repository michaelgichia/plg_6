"""Fix delete document error.

Revision ID: 10368f38610b
Revises: b5370243d0bc
Create Date: 2025-10-02 07:06:36.831373

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '10368f38610b'
down_revision = 'b5370243d0bc'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Only create chat table if it doesn't exist
    if 'chat' not in inspector.get_table_names():
        op.create_table('chat',
            sa.Column('message', sqlmodel.sql.sqltypes.AutoString(length=1024), nullable=True),
            sa.Column('is_system', sa.Boolean(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('course_id', sa.Uuid(), nullable=False),
            sa.ForeignKeyConstraint(['course_id'], ['course.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
    
    # Foreign key constraint operations should run regardless of chat table
    # Check if the constraint exists before dropping
    existing_fkeys = [fk['name'] for fk in inspector.get_foreign_keys('quizattempt')]
    
    if 'quizattempt_quiz_id_fkey' in existing_fkeys:
        op.drop_constraint('quizattempt_quiz_id_fkey', 'quizattempt', type_='foreignkey')
    
    # Recreate with CASCADE delete
    # Check if the new constraint already exists
    existing_fkeys_after = [fk['name'] for fk in inspector.get_foreign_keys('quizattempt')]
    has_cascade = any(
        fk.get('options', {}).get('ondelete') == 'CASCADE' 
        for fk in inspector.get_foreign_keys('quizattempt')
        if fk['referred_table'] == 'quiz'
    )
    
    if not has_cascade:
        op.create_foreign_key(None, 'quizattempt', 'quiz', ['quiz_id'], ['id'], ondelete='CASCADE')


def downgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Drop the CASCADE constraint and recreate without it
    existing_fkeys = [fk['name'] for fk in inspector.get_foreign_keys('quizattempt')]
    
    # Find and drop the CASCADE constraint
    for fk in inspector.get_foreign_keys('quizattempt'):
        if fk['referred_table'] == 'quiz' and fk.get('options', {}).get('ondelete') == 'CASCADE':
            op.drop_constraint(fk['name'], 'quizattempt', type_='foreignkey')
            break
    
    # Recreate without CASCADE
    op.create_foreign_key('quizattempt_quiz_id_fkey', 'quizattempt', 'quiz', ['quiz_id'], ['id'])
    
    # Drop chat table only if it exists
    if 'chat' in inspector.get_table_names():
        op.drop_table('chat')