from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routers.login import router as login_router
from .db.session import engine, Base
from .models import *



app = FastAPI(title="Hidden Trails | Users", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.include_router(login_router)