# db/queries.py - Type-safe query builder
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime
from models.scan import ScanResult, AIRecommendation
from models.user import User, AIPreference


class Queries:
    def __init__(self, db_session):
        self.db = db_session

    async def get_recent_scans(self, user_id: int, limit: int = 10) -> List[ScanResult]:
        query = (
            select(ScanResult)
            .where(ScanResult.user_id == user_id)
            .order_by(ScanResult.scan_date.desc())
            .limit(limit)
        )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_compliance_trends(
        self, user_id: int, start_date: datetime, end_date: datetime
    ) -> List[ScanResult]:
        query = (
            select(ScanResult)
            .where(
                and_(
                    ScanResult.user_id == user_id,
                    ScanResult.scan_date.between(start_date, end_date),
                )
            )
            .order_by(ScanResult.scan_date)
        )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_user_preferences(self, user_id: int) -> Optional[AIPreference]:
        query = select(AIPreference).where(AIPreference.user_id == user_id)

        result = await self.db.execute(query)
        return result.scalar_one_or_none()
