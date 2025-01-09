from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from app.api import deps
from app.models.scan import ScanResult
from app.models.user import User
from app.schemas.ai import AIRecommendation, AIModel

router = APIRouter()


@router.get("/ai/recommendations")
async def get_ai_recommendations(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Get AI-generated recommendations"""
    try:
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

        if total_criticals > 0:
            recommendations.append(
                {
                    "id": "critical_alert",
                    "message": f"Detected {total_criticals} critical vulnerabilities in recent scans. Immediate attention recommended.",
                    "severity": "high",
                    "category": "security",
                    "created_at": datetime.now(timezone.utc),
                }
            )

        if total_high > 10:
            recommendations.append(
                {
                    "id": "high_alert",
                    "message": f"High number of high-severity issues ({total_high}) detected. Consider scheduling a security review.",
                    "severity": "medium",
                    "category": "security",
                    "created_at": datetime.now(timezone.utc),
                }
            )

        if len(recent_scans) < 5:
            recommendations.append(
                {
                    "id": "scan_frequency",
                    "message": "Scan frequency is below recommended levels. Consider increasing scan frequency for better security coverage.",
                    "severity": "low",
                    "category": "process",
                    "created_at": datetime.now(timezone.utc),
                }
            )

        return recommendations

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai/models")
async def get_ai_models(current_user: User = Depends(deps.get_current_user)):
    """Get available AI models and their status"""
    return [
        {
            "id": "gpt4",
            "name": "CompanyGPT",
            "description": "Advanced language model for complex analysis",
            "last_used": datetime.now(timezone.utc),
            "type": "GPT4",
        },
        {
            "id": "mistral",
            "name": "mistral-nemo",
            "description": "Fast and efficient for routine tasks",
            "last_used": datetime.now(timezone.utc),
            "type": "mistral",
        },
        {
            "id": "sonnet",
            "name": "Claude 3.5 Sonnet",
            "description": "Fast",
            "last_used": datetime.now(timezone.utc),
            "type": "Claude",
        },
    ]
