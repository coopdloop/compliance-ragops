from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from app.api import deps
from app.models.scan import ScanResult
from app.models.user import User
from app.schemas.compliance import ComplianceTrend, AIRecommendation

router = APIRouter()


@router.get("/trends", response_model=List[ComplianceTrend])
async def get_compliance_trends(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Get compliance trends over time"""
    try:
        # Get scans from the last 6 months
        six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
        scans = (
            db.query(ScanResult)
            .filter(ScanResult.scan_date >= six_months_ago)
            .order_by(ScanResult.scan_date)
            .all()
        )

        # Group scans by month
        monthly_data = {}
        for scan in scans:
            month = scan.scan_date.strftime("%Y-%m")
            severity_counts = scan.severity_counts

            if month not in monthly_data:
                monthly_data[month] = {
                    "scans": 0,
                    "issues": 0,
                    "total_possible": 100,
                }

            monthly_data[month]["scans"] += 1
            monthly_data[month]["issues"] += sum(severity_counts.values())

        # Calculate compliance scores and format data
        trends = []
        for month, data in monthly_data.items():
            compliance_score = max(0, 100 - (data["issues"] / data["scans"] * 10))

            trends.append(
                ComplianceTrend(
                    month=datetime.strptime(month, "%Y-%m").strftime("%b"),
                    scans=data["scans"],
                    issues=data["issues"],
                    compliance=round(compliance_score, 2),
                )
            )

        return trends

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations", response_model=List[AIRecommendation])
async def get_ai_recommendations(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Get AI-generated recommendations based on recent scans"""
    try:
        # Get recent scan results
        recent_scans = (
            db.query(ScanResult).order_by(ScanResult.scan_date.desc()).limit(10).all()
        )

        recommendations = []

        # Analyze severity trends
        total_criticals = 0
        total_high = 0
        for scan in recent_scans:
            severity_counts = scan.severity_counts
            total_criticals += severity_counts.get("CRITICAL", 0)
            total_high += severity_counts.get("HIGH", 0)

        # Generate recommendations
        if total_criticals > 0:
            recommendations.append(
                AIRecommendation(
                    id="critical_alert",
                    message=f"Found {total_criticals} critical vulnerabilities",
                    severity="high",
                    category="security",
                    created_at=datetime.now(timezone.utc),
                )
            )

        if total_high > 5:
            recommendations.append(
                AIRecommendation(
                    id="high_alert",
                    message=f"High number of high-severity issues ({total_high})",
                    severity="medium",
                    category="security",
                    created_at=datetime.now(timezone.utc),
                )
            )

        if len(recent_scans) < 3:
            recommendations.append(
                AIRecommendation(
                    id="scan_frequency",
                    message="Low scan frequency detected",
                    severity="low",
                    category="process",
                    created_at=datetime.now(timezone.utc),
                )
            )

        return recommendations

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
