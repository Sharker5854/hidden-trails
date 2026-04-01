from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .api.routers.login import router as login_router
from .api.routers.achievments import router as achievments_router
from .api.routers.themes import router as themes_router
from .api.routers.geotags import router as geotags_router
from .api.routers.users import router as users_router
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
app.include_router(users_router)
app.include_router(achievments_router)
app.include_router(themes_router)
app.include_router(geotags_router)

app.mount("/static", StaticFiles(directory="app/static"), name="static")