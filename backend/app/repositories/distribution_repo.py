"""Repository for accessing fitted probability distributions and descriptive statistics."""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.distribution import DistributionFit, DescriptiveStatistic


class DistributionRepository(BaseRepository[DistributionFit]):
    def __init__(self, db: Session):
        super().__init__(DistributionFit, db)

    def get_ranked_fits(self) -> List[DistributionFit]:
        return self.db.query(DistributionFit).order_by(DistributionFit.rank.asc()).all()

    def get_by_name(self, name: str) -> Optional[DistributionFit]:
        return self.db.query(DistributionFit).filter(DistributionFit.distribution.ilike(name)).first()

    def get_descriptive_statistics(self, scope: str = "overall") -> Optional[DescriptiveStatistic]:
        return self.db.query(DescriptiveStatistic).filter(DescriptiveStatistic.scope == scope).first()
