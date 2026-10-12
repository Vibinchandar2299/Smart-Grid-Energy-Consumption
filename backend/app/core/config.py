from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Statistical Modeling of Smart Grid Energy Consumption Patterns Using Probability Distribution Metrics"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # PostgreSQL Database Connection
    DATABASE_URL: str = "postgresql+psycopg2://postgres:root@localhost:5432/smart_grid_energy"

    # Server Host / Port
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return []

    # Artifacts path (points to data/staged_artifacts)
    ARTIFACTS_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "staged_artifacts"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
