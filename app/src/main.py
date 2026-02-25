from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Hidden Trails", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "FastAPI готов к работе! Добавьте микросервисы в docker-compose.yml"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/v1/example")
async def example():
    return {"service": "main", "data": "Пример эндпоинта"}