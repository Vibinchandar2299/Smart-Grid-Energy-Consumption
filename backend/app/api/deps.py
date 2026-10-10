"""FastAPI dependencies for injecting database sessions and domain services."""
from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.distribution_service import DistributionService
from app.services.segment_service import SegmentService
from app.services.extreme_value_service import ExtremeValueService


def get_distribution_service(db: Session = Depends(get_db)) -> DistributionService:
    return DistributionService(db)


def get_segment_service(db: Session = Depends(get_db)) -> SegmentService:
    return SegmentService(db)


def get_extreme_value_service(db: Session = Depends(get_db)) -> ExtremeValueService:
    return ExtremeValueService(db)
