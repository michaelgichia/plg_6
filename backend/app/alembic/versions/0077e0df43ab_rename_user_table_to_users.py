from alembic import op

revision = "0077e0df43ab"
down_revision = "1a31ce608336"
branch_labels = None
depends_on = None

def upgrade():
    op.rename_table("user", "users")

    op.drop_constraint("item_owner_id_fkey", "item", type_="foreignkey")
    op.create_foreign_key(
        "item_owner_id_fkey", "item", "users", ["owner_id"], ["id"], ondelete="CASCADE"
    )

    op.drop_constraint("course_owner_id_fkey", "course", type_="foreignkey")
    op.create_foreign_key(
        "course_owner_id_fkey", "course", "users", ["owner_id"], ["id"], ondelete="CASCADE"
    )


def downgrade():
    op.rename_table("users", "user")

    op.drop_constraint("item_owner_id_fkey", "item", type_="foreignkey")
    op.create_foreign_key(
        "item_owner_id_fkey", "item", "user", ["owner_id"], ["id"], ondelete="CASCADE"
    )

    op.drop_constraint("course_owner_id_fkey", "course", type_="foreignkey")
    op.create_foreign_key(
        "course_owner_id_fkey", "course", "user", ["owner_id"], ["id"], ondelete="CASCADE"
    )
