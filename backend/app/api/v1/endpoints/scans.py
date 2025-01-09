import logging
from typing import List, Optional

from app.api import deps
from app.models.document import ComplianceDocument
from app.models.scan import ScanResult
from app.models.user import User
from app.schemas.scan import ScanRequest, ScanResponse, ScanWithDetails
from app.services.ai_service import analyze_scan_with_ai
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyze", response_model=ScanResponse)
async def analyze_scan(
    scan_request: ScanRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> ScanResponse:
    """Analyze scan results using OpenAI"""
    try:
        if not current_user.openai_key:
            raise HTTPException(
                status_code=401,
                detail="OpenAI API key not found. Please add your API key in settings.",
            )

        # Analyze scan with AI
        analysis_result = await analyze_scan_with_ai(scan_request, current_user, db)

        # Calculate severity counts
        severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for result in scan_request.trivy_data.get("Results", []):
            for vuln in result.get("Vulnerabilities", []):
                severity = vuln.get("Severity", "UNKNOWN")
                if severity in severity_counts:
                    severity_counts[severity] += 1

        # Create scan result
        scan_result = ScanResult(
            project_name=scan_request.project_name,
            trivy_data=scan_request.trivy_data,
            analysis_result=analysis_result,
            severity_counts=severity_counts,
            scan_type=scan_request.scan_type,
            created_by=current_user.id,
        )

        # Add document associations
        if scan_request.documents:
            documents = (
                db.query(ComplianceDocument)
                .filter(ComplianceDocument.id.in_(scan_request.documents))
                .all()
            )
            scan_result.documents.extend(documents)

        # document_ids = [doc.id for doc in documents]
        # scan_result.documents = document_ids

        db.add(scan_result)
        db.commit()
        db.refresh(scan_result)
        # Prepare response manually
        return {
            "id": scan_result.id,
            "project_name": scan_result.project_name,
            "scan_date": scan_result.scan_date,
            "severity_counts": severity_counts,
            "analysis_result": analysis_result,
            "documents": [doc.id for doc in scan_result.documents],
            "total_vulnerabilities": sum(severity_counts.values()),
            "critical_vulnerabilities": severity_counts.get("CRITICAL", 0),
            "compliance_score": scan_result.compliance_score,
            "scan_type": scan_result.scan_type,
        }

        # return scan_result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing scan: {str(e)}")


@router.get("/", response_model=List[ScanResponse])
def get_scans(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    sort: str = Query("date", enum=["date", "critical", "compliance"]),
    order: str = Query("desc", enum=["asc", "desc"]),
    search: Optional[str] = None,
    docs: Optional[List[str]] = Query(None),
) -> List[ScanResponse]:
    """Get all scans with filtering and sorting"""
    query = db.query(ScanResult)

    if search:
        query = query.filter(ScanResult.project_name.ilike(f"%{search}%"))

    if docs:
        query = query.filter(ScanResult.documents.any(ComplianceDocument.id.in_(docs)))

    if sort == "date":
        query = query.order_by(
            desc(ScanResult.scan_date) if order == "desc" else asc(ScanResult.scan_date)
        )
    elif sort == "critical":
        # Note: This might need adjustment based on how severity_counts is stored
        query = query.order_by(
            desc(ScanResult.severity_counts["CRITICAL"])
            if order == "desc"
            else asc(ScanResult.severity_counts["CRITICAL"])
        )
    elif sort == "compliance":
        query = query.order_by(
            desc(ScanResult.compliance_score)
            if order == "desc"
            else asc(ScanResult.compliance_score)
        )
    results = query.all()

    # Prepare response manually
    return [
        {
            "id": scan.id,
            "project_name": scan.project_name,
            "scan_date": scan.scan_date,
            "severity_counts": scan.severity_counts,
            "analysis_result": scan.analysis_result,
            "documents": [doc.id for doc in scan.documents],
            "total_vulnerabilities": sum(
                scan.severity_counts.values()
                if isinstance(scan.severity_counts, dict)
                else {}
            ),
            "critical_vulnerabilities": (
                scan.severity_counts.get("CRITICAL", 0)
                if isinstance(scan.severity_counts, dict)
                else 0
            ),
            "compliance_score": scan.compliance_score,
            "scan_type": scan.scan_type,
        }
        for scan in results
    ]
    # return query.all()


@router.get("/{scan_id}", response_model=ScanWithDetails)
def get_scan(
    scan_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> ScanWithDetails:
    """Get a specific scan by ID"""
    scan = db.query(ScanResult).filter(ScanResult.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.delete("/{scan_id}")
def delete_scan(
    scan_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Delete a scan"""
    scan = db.query(ScanResult).filter(ScanResult.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    try:
        db.delete(scan)
        db.commit()
        return {"message": f"Scan {scan_id} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting scan: {str(e)}")


@router.post("/assess-vulnerability")
async def assess_vulnerability(
    vulnerability_data: dict,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> dict:
    """Assess specific vulnerability details"""
    logger.info(f"Assessing vulnerability: {vulnerability_data}")

    # Dummy assessment logic
    assessment = {
        "severity_rating": vulnerability_data.get("severity", "UNKNOWN"),
        "mitigation_steps": [
            "Update affected packages",
            "Apply security patches",
            "Monitor for suspicious activity",
        ],
        "estimated_effort": "medium",
        "priority": (
            "high" if vulnerability_data.get("severity") == "CRITICAL" else "medium"
        ),
    }

    logger.info(f"Assessment complete: {assessment}")
    return assessment
