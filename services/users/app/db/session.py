from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from ..core.config import settings


engine = create_async_engine(
    settings.database_url, 
    echo=settings.debug, 
    future=True
)


AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)