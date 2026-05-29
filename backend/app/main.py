from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.auth import router as auth_router
from app.predict import router as predict_router
from app.weather import router as weather_router
from app.alerts import router as alerts_router
from app.chatbot import router as chatbot_router
from app.admin import router as admin_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent flood warning & monitoring system combining open APIs, customized machine learning algorithms, and local disaster relief nodes.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable Cross-Origin Resource Sharing (CORS) for smooth frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits rapid dev server local loopbacks
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Bind system routes
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(predict_router, prefix=settings.API_V1_STR)
app.include_router(weather_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(chatbot_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "engine": "FastAPI Web Core",
        "api_docs": "/docs",
        "timestamp": "2026-05-29T12:00:00+05:30"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
