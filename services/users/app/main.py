from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routers.login import router as login_router
from .db.session import engine
from .models import *
from .models.base import Base



app = FastAPI(title="Hidden Trails | Users", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(login_router)