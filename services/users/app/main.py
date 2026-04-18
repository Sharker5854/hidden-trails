from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .api.routers.login import router as login_router
from .api.routers.achievments import router as achievments_router
from .api.routers.themes import router as themes_router
from .api.routers.geotags import router as geotags_router
from .api.routers.users import router as users_router
from .api.routers.comments import router as comments_router
from .api.routers.routes import router as routes_router
from .api.routers.moderation import router as moderation_router
from .api.routers.messages import router as messages_router
from .db.session import engine
from .models import *
from .models.base import Base



app = FastAPI(title="Hidden Trails | Users", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "healthy"}


app.include_router(login_router)
app.include_router(users_router)
app.include_router(achievments_router)
app.include_router(themes_router)
app.include_router(geotags_router)
app.include_router(comments_router)
app.include_router(routes_router)
app.include_router(moderation_router)
app.include_router(messages_router)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
