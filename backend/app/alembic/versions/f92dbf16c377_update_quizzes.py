"""Update quizzes

Revision ID: f92dbf16c377
Revises: 89c6ad1d0dc9
Create Date: 2025-09-26 20:27:04.575283

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f92dbf16c377'
down_revision = '89c6ad1d0dc9'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Create the ENUM type first
    difficulty_enum = sa.Enum('EASY', 'MEDIUM', 'HARD', 'EXPERT', 'ALL', name='difficulty_level_enum')
    difficulty_enum.create(op.get_bind())

    # 2. Add the column referencing the enum
    op.add_column(
        'quiz',
        sa.Column('difficulty_level', difficulty_enum, nullable=True)
    )


def downgrade():
    # Drop column first
    op.drop_column('quiz', 'difficulty_level')

    # Then drop the enum type
    difficulty_enum = sa.Enum(name='difficulty_level_enum')
    difficulty_enum.drop(op.get_bind())
