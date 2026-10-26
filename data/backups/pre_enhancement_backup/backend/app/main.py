"""
Main FastAPI Application Entry Point.
Research: Statistical Modeling of Smart Grid Energy Consumption Patterns Using Probability Distribution Metrics.
"""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.repositories.seed_loader import load_frozen_artifacts_into_db
from app.api.v1.api_router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smart_grid_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan:
    1. Ensures PostgreSQL schema tables are created.
    2. Seeds tables once from frozen Colab research artifacts if empty.
    3. Guarantees no refitting of probability models during API runtime.
    """
    logger.info("Initializing Smart Grid Energy Research API...")
    try:
        # Create database tables if connected
        Base.metadata.create_all(bind=engine)
        logger.info("PostgreSQL database tables verified/created successfully.")

        # Seed frozen statistical artifacts into database
        db = SessionLocal()
        try:
            seeded = load_frozen_artifacts_into_db(db)
            if seeded:
                logger.info("Frozen research artifacts successfully loaded into PostgreSQL.")
            else:
                logger.info("Database already populated or artifacts loaded previously.")
        finally:
            db.close()
    except Exception as exc:
        logger.warning(
            f"Database initialization deferred (database may still be starting up): {exc}. "
            "Application will continue in resilient mode."
        )

    yield

    logger.info("Shutting down Smart Grid Energy Research API.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-grade deployment and visualization API for validated statistical modeling "
        "of Tamil Nadu smart grid energy consumption patterns using probability distribution metrics."
    ),
    lifespan=lifespan,
)

# CORS Configuration
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# API Router Mount
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
