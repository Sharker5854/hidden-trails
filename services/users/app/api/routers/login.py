from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from ..deps import get_db


router = APIRouter()


@router.get("/")
async def root(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT 1"))
    return {"message": "Users service is running!", "db_check": result.scalar()}

@router.get("/health")
async def health():
    return {"status": "healthy"}