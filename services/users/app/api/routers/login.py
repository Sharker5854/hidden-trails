from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "FastAPI готов к работе!"}

@router.get("/health")
async def health():
    return {"status": "healthy"}