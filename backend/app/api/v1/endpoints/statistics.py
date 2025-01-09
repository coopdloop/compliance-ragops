import logging
from collections import defaultdict
from datetime import datetime, timedelta

from app.api import deps
from app.models.scan import ScanResult
from app.models.user import User
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/statistics")
async def get_statistics(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Get overall statistics for the dashboard"""
    try:
        total_scans = db.query(ScanResult).count()
        total_criticals = 0
        total_open = 0
        total_resolved = 0
        compliance_score = 100

        scans = db.query(ScanResult).all()
        for scan in scans:
            severity_counts = scan.severity_counts
            total_criticals += severity_counts.get("CRITICAL", 0)
            total_open += sum(severity_counts.values())

            compliance_deduction = (
                (severity_counts.get("CRITICAL", 0) * 5)
                + (severity_counts.get("HIGH", 0) * 3)
                + (severity_counts.get("MEDIUM", 0) * 2)
                + (severity_counts.get("LOW", 0) * 1)
            )
            compliance_score = max(0, compliance_score - (compliance_deduction * 0.1))

        if scans:
            compliance_score = max(0, min(100, compliance_score / len(scans)))

        return {
            "totalScans": total_scans,
            "criticalIssues": total_criticals,
            "openIssues": total_open,
            "resolvedIssues": total_resolved,
            "complianceScore": round(compliance_score, 2),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/detailed")
async def get_detailed_analytics(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Get comprehensive detailed analytics"""
    try:
        # Recent scans for trends (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_scans = (
            db.query(ScanResult)
            .filter(ScanResult.scan_date >= thirty_days_ago)
            .order_by(ScanResult.scan_date.desc())
            .limit(50)  # Reasonable number of recent scans
            .all()
        )

        # Aggregate analytics
        total_processed = len(recent_scans)
        total_vulnerabilities = sum(
            scan.computed_total_vulnerabilities for scan in recent_scans
        )
        critical_vulnerabilities = sum(
            scan.computed_critical_vulnerabilities for scan in recent_scans
        )

        # Severity trend calculation
        severity_trends = defaultdict(
            lambda: {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        )
        for scan in recent_scans:
            month_key = scan.scan_date.strftime("%Y-%m")
            for severity, count in scan.severity_counts.items():
                severity_trends[month_key][severity] += count

        # Performance and processing metrics
        avg_processing_time = (
            None  # You might want to add processing time to your model
        )
        error_rate = (
            (critical_vulnerabilities / total_processed * 100)
            if total_processed > 0
            else 0
        )

        # Compliance score trends
        compliance_scores = [
            scan.compliance_score
            for scan in recent_scans
            if scan.compliance_score is not None
        ]
        avg_compliance_score = (
            sum(compliance_scores) / len(compliance_scores)
            if compliance_scores
            else None
        )

        # Predictive insights
        last_week_scans = [
            scan
            for scan in recent_scans
            if scan.scan_date >= datetime.utcnow() - timedelta(days=7)
        ]
        projected_increase = (
            len(last_week_scans) / 7 * 30  # Projected monthly scan volume
        )

        return {
            "totalProcessed": total_processed,
            "avgProcessingTime": avg_processing_time,
            "errorRate": round(error_rate, 2),
            "peakPerformance": (
                max(
                    recent_scans, key=lambda x: x.computed_total_vulnerabilities
                ).project_name
                if recent_scans
                else None
            ),
            # Expanded analytics section
            "severityBreakdown": {
                "total": total_vulnerabilities,
                "critical": critical_vulnerabilities,
                "details": {
                    severity: sum(
                        scan.severity_counts.get(severity, 0) for scan in recent_scans
                    )
                    for severity in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
                },
            },
            "complianceAnalytics": {
                "avgComplianceScore": (
                    round(avg_compliance_score, 2)
                    if avg_compliance_score is not None
                    else None
                ),
                "scoreTrend": [
                    {"month": key, "score": score}
                    for key, score in sorted(compliance_scores)
                ],
            },
            "predictions": {
                "monthlyProjectedScans": round(projected_increase),
                "resourceScaling": 20,  # Placeholder - adjust based on your infrastructure
                "uptime": 98,  # Placeholder - implement actual uptime tracking
                "bottleneckRisk": "low",
            },
            "severityTrends": [
                {"month": month, "data": trend}
                for month, trend in sorted(severity_trends.items())
            ],
        }
    except Exception as e:
        logger.error(f"Error in detailed analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
