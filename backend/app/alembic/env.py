import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.models import SQLModel
from app.core.config import settings

# Alembic Config object, provides access to values in alembic.ini
config = context.config

# Interpret the config file for Python logging
fileConfig(config.config_file_name)  # type: ignore

# Use SQLModel metadata as Alembic target
target_metadata = SQLModel.metadata

# ✅ DEBUG: Print loaded tables (helpful to ensure imports worked)
print(f"Alembic target tables: {list(target_metadata.tables.keys())}")


def get_url():
    """Return the database URL from settings."""
    return str(settings.SQLALCHEMY_DATABASE_URI)


def run_migrations_offline():
    """Run migrations in 'offline' mode (generates SQL scripts)."""
    url = get_url()
    context.configure(
        url=url, target_metadata=target_metadata, literal_binds=True, compare_type=True
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode (applies directly to DB)."""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata, compare_type=True
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
