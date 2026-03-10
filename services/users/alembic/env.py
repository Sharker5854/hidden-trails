from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os


try:
    from app.models import Base
except ImportError as e:
    print(f"❌ Импорт моделей: {e}")
    Base = None

config = context.config
connectable = config.get_main_option("sqlalchemy.url")

if os.getenv("DATABASE_URL"):
    conn_string = str(os.getenv("DATABASE_URL")).replace("asyncpg", "psycopg")
    config.set_main_option("sqlalchemy.url", conn_string)

target_metadata = Base.metadata if Base else None

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=connectable,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section)
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
