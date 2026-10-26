"""Common schemas, metadata, and API envelope definitions."""
from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field

T = TypeVar("T")


class ResearchMetadata(BaseModel):
    title: str = "Statistical Modeling of Smart Grid Energy Consumption Patterns Using Probability Distribution Metrics"
    dataset: str = "Synthetic Tamil Nadu Smart Grid Energy Dataset"
    target_variable: str = "energy_consumption_kwh"
    state: str = "Tamil Nadu"
    status: str = "FROZEN_RESEARCH_ARTIFACT"
    note: str = "Parameters are pre-computed and validated in Google Colab; no runtime re-fitting is performed."


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    metadata: ResearchMetadata = Field(default_factory=ResearchMetadata)
    data: T
    message: Optional[str] = None
