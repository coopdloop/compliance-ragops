# services/agent_functions.py
from typing import Dict, Optional, Any
from pydantic import BaseModel
from datetime import datetime


class SecurityCheck(BaseModel):
    system_name: str
    check_type: str
    severity_threshold: Optional[str] = "MEDIUM"


class PatchRecommendation(BaseModel):
    vulnerability_id: str
    system: str
    priority: str


class ComplianceReport(BaseModel):
    framework: str
    start_date: str
    end_date: str


def run_security_check(check: SecurityCheck) -> Dict[str, Any]:
    """
    Run a security check on a specified system
    """
    # This is a demo implementation
    return {
        "status": "completed",
        "findings": [
            {
                "id": "VULN-001",
                "severity": "HIGH",
                "description": "Outdated SSL certificate",
                "system": check.system_name,
            },
            {
                "id": "VULN-002",
                "severity": "MEDIUM",
                "description": "Open ports detected",
                "system": check.system_name,
            },
        ],
        "timestamp": datetime.now().isoformat(),
    }


def generate_patch_recommendation(rec: PatchRecommendation) -> Dict[str, Any]:
    """
    Generate patch recommendations for a vulnerability
    """
    return {
        "vulnerability_id": rec.vulnerability_id,
        "system": rec.system,
        "recommendations": [
            {
                "step": 1,
                "action": "Update package to latest version",
                "command": "apt-get update && apt-get upgrade",
            },
            {
                "step": 2,
                "action": "Restart affected service",
                "command": "systemctl restart affected-service",
            },
        ],
        "priority": rec.priority,
        "estimated_time": "30 minutes",
    }


def generate_compliance_report(report: ComplianceReport) -> Dict[str, Any]:
    """
    Generate a compliance report for a specific framework
    """
    return {
        "framework": report.framework,
        "period": {"start": report.start_date, "end": report.end_date},
        "compliance_score": 85,
        "findings": [
            {
                "control_id": "AC-1",
                "status": "compliant",
                "evidence": "Access control policies are in place",
            },
            {
                "control_id": "AU-2",
                "status": "non-compliant",
                "evidence": "Audit logs not properly configured",
            },
        ],
    }


# Available functions for the AI to call
AVAILABLE_FUNCTIONS = {
    "run_security_check": {
        "name": "run_security_check",
        "description": "Run a security check on a specified system",
        "parameters": {
            "type": "object",
            "properties": {
                "system_name": {
                    "type": "string",
                    "description": "Name of the system to check",
                },
                "check_type": {
                    "type": "string",
                    "description": "Type of security check to perform",
                    "enum": ["vulnerability", "configuration", "compliance"],
                },
                "severity_threshold": {
                    "type": "string",
                    "description": "Minimum severity level to report",
                    "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                },
            },
            "required": ["system_name", "check_type"],
        },
    },
    "generate_patch_recommendation": {
        "name": "generate_patch_recommendation",
        "description": "Generate patch recommendations for a vulnerability",
        "parameters": {
            "type": "object",
            "properties": {
                "vulnerability_id": {
                    "type": "string",
                    "description": "ID of the vulnerability",
                },
                "system": {"type": "string", "description": "Affected system name"},
                "priority": {
                    "type": "string",
                    "description": "Priority level for the patch",
                    "enum": ["low", "medium", "high", "critical"],
                },
            },
            "required": ["vulnerability_id", "system", "priority"],
        },
    },
    "generate_compliance_report": {
        "name": "generate_compliance_report",
        "description": "Generate a compliance report for a specific framework",
        "parameters": {
            "type": "object",
            "properties": {
                "framework": {
                    "type": "string",
                    "description": "Compliance framework (e.g., SOC2, HIPAA, PCI-DSS)",
                },
                "start_date": {
                    "type": "string",
                    "description": "Start date for the report period (YYYY-MM-DD)",
                },
                "end_date": {
                    "type": "string",
                    "description": "End date for the report period (YYYY-MM-DD)",
                },
            },
            "required": ["framework", "start_date", "end_date"],
        },
    },
}
