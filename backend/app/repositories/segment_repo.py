"""Repository for querying segment statistics (sector, peak, season, hourly, temporal)."""
from typing import List
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.segment import SegmentStatistic


class SegmentRepository(BaseRepository[SegmentStatistic]):
    def __init__(self, db: Session):
        super().__init__(SegmentStatistic, db)

    def get_by_segment_type(self, segment_type: str) -> List[SegmentStatistic]:
        return (
            self.db.query(SegmentStatistic)
            .filter(SegmentStatistic.segment_type == segment_type)
            .all()
        )

    def get_by_type_and_value(self, segment_type: str, segment_value: str) -> SegmentStatistic | None:
        return (
            self.db.query(SegmentStatistic)
            .filter(
                SegmentStatistic.segment_type == segment_type,
                SegmentStatistic.segment_value == segment_value,
            )
            .first()
        )
