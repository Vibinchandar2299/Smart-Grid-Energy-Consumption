"""Repository for retrieving extreme value analysis results and return levels."""
from typing import List
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.extreme_value import ExtremeValueResult


class ExtremeValueRepository(BaseRepository[ExtremeValueResult]):
    def __init__(self, db: Session):
        super().__init__(ExtremeValueResult, db)

    def get_by_block_type(self, block_type: str = "monthly_maxima") -> List[ExtremeValueResult]:
        return (
            self.db.query(ExtremeValueResult)
            .filter(ExtremeValueResult.block_type == block_type)
            .order_by(ExtremeValueResult.return_period_years.asc())
            .all()
        )
