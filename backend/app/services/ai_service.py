"""
AI Service for security vulnerability analysis.
This module handles the integration with OpenAI and vulnerability assessment services.
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException
from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.security import create_service_token
from app.models.service_account import ServiceAccount
from app.models.user import User
from app.schemas.scan import ScanRequest

# Configure logging
logger = logging.getLogger(__name__)


class VulnerabilityEndpoint:
    """Configuration for external vulnerability assessment endpoints."""

    def __init__(
        self,
        name: str,
        url: str,
        method: str = "POST",
        headers: Optional[Dict[str, str]] = None,
    ):
        self.name = name
        self.url = url
        self.method = method
        self.headers = headers or {}


class APIConfig:
    """API configuration for vulnerability assessment services."""

    def __init__(self):
        self.endpoints: Dict[str, VulnerabilityEndpoint] = {
            "assess_vulnerability": VulnerabilityEndpoint(
                name="vulnerability_assessment",
                url="http://localhost:8000/api/scans/assess-vulnerability",
            ),
            "get_vulnerability_info": VulnerabilityEndpoint(
                name="nvd",
                url="https://services.nvd.nist.gov/rest/json/cves/2.0",
                method="GET",
            ),
            "dependency_analysis": VulnerabilityEndpoint(
                name="dependencies",
                url="http://localhost:8000/api/scans/analyze-dependencies",
            ),
            "patch_verification": VulnerabilityEndpoint(
                name="patch_verify",
                url="http://localhost:8000/api/scans/verify-patches",
            ),
            "impact_assessment": VulnerabilityEndpoint(
                name="impact",
                url="http://localhost:8000/api/scans/assess-impact",
            ),
        }


class AgenticAIAnalyzer:
    """Agentic AI-powered security vulnerability analyzer."""

    def __init__(self, openai_key: str):
        self.client = OpenAI(api_key=openai_key)
        self.api_config = APIConfig()
        self.analysis_state = {}
        self.conversation_history = []
        self.function_calls = []
        self.service_account = None  # Store service account for use in API calls

    def _get_functions_config(self) -> List[Dict[str, Any]]:
        """Get the expanded OpenAI functions configuration."""
        return [
            {
                "name": "assess_vulnerability",
                "description": "Get detailed assessment of a vulnerability",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "vulnerability_id": {"type": "string"},
                        "severity": {"type": "string"},
                        "package_name": {"type": "string"},
                        "description": {"type": "string"},
                    },
                    "required": ["vulnerability_id"],
                },
            },
            {
                "name": "get_vulnerability_info",
                "description": "Get vulnerability information from NVD database",
                "parameters": {
                    "type": "object",
                    "properties": {"cve_id": {"type": "string"}},
                    "required": ["cve_id"],
                },
            },
            {
                "name": "analyze_dependencies",
                "description": "Analyze dependency tree and identify vulnerable paths",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "package_name": {"type": "string"},
                        "version": {"type": "string"},
                    },
                    "required": ["package_name"],
                },
            },
            {
                "name": "verify_patch",
                "description": "Verify if a patch or fix is available and effective",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "vulnerability_id": {"type": "string"},
                        "package_name": {"type": "string"},
                        "current_version": {"type": "string"},
                        "fixed_version": {"type": "string"},
                    },
                    "required": ["vulnerability_id", "package_name"],
                },
            },
            {
                "name": "assess_impact",
                "description": "Assess potential business impact of vulnerability",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "vulnerability_id": {"type": "string"},
                        "severity": {"type": "string"},
                        "affected_components": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                    },
                    "required": ["vulnerability_id"],
                },
            },
        ]

    async def _execute_analysis_step(
        self, messages: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Execute a single step of analysis using the AI."""
        try:
            logger.info("🤖 Executing AI analysis step")
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                functions=self._get_functions_config(),
                function_call="auto",
            )

            result = response.choices[0].message
            content = result.content if result.content else ""

            # Handle function calls
            if result.function_call:
                function_name = result.function_call.name
                function_args = json.loads(result.function_call.arguments)

                logger.info(
                    f"""🛠️ AI requested function call:
                - Function: {function_name}
                - Args: {json.dumps(function_args, indent=2)}
                """
                )

                # Execute the function call
                endpoint = self.api_config.endpoints.get(function_name)
                if endpoint:
                    api_result = await self._call_external_api(endpoint, function_args)

                    logger.info(
                        f"""📡 API call result:
                    - Endpoint: {endpoint.name}
                    - Status: Success
                    - Response size: {len(str(api_result))} chars
                    """
                    )

                    # Track the function call with correct location
                    self._track_function_call(
                        function_name=function_name,
                        service_name=endpoint.name,
                        status="success" if "error" not in api_result else "failed",
                        location=endpoint.url,  # Explicitly use the endpoint URL
                    )

                    # Add results to conversation history
                    messages.append(
                        {
                            "role": "function",
                            "name": function_name,
                            "content": json.dumps(api_result),
                        }
                    )

                    # Allow AI to process the function result
                    return await self._execute_analysis_step(messages)

            if result.content:
                logger.info(
                    f"""💬 AI Response:
                {result.content}...
                """
                )

            return {
                "response": result.content,
                "messages": messages,
                "has_function_call": bool(result.function_call),
            }

        except Exception as e:
            logger.error(f"❌ Analysis step failed: {str(e)}")
            return {
                "response": f"Error during analysis: {str(e)}",
                "messages": messages,
                "has_function_call": False,
                "error": str(e),
            }

    async def _analyze_vulnerability(self, vuln: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a single vulnerability using recursive analysis."""
        logger.info(
            f"""🔍 Starting vulnerability analysis:
        - ID: {vuln.get('id')}
        - Severity: {vuln.get('severity')}
        - Package: {vuln.get('package')}
        """
        )

        messages = [
            {
                "role": "system",
                "content": """You are an expert security analyst AI.
                For EVERY vulnerability, you MUST:
                1. Check the NVD database for comprehensive vulnerability details
                2. Use the get_vulnerability_info function to retrieve NVD information
                3. Explain your reasoning for each vulnerability lookup

                Mandatory steps for each vulnerability:
                - If CVE ID is present, always call NVD database
                - Log reasoning for why NVD might or might not be relevant
                - Explicitly state if NVD lookup is skipped and why""",
            },
            {
                "role": "user",
                "content": f"""Analyze vulnerability and perform NVD lookup:
                Vulnerability Details: {json.dumps(vuln)}

                Specific instructions:
                - Check if CVE ID is available
                - Use get_vulnerability_info function if possible
                - Provide detailed reasoning""",
            },
        ]

        analysis_result = {
            "original_data": vuln,
            "analysis_steps": [],
            "findings": [],
            "high_priority": False,
        }
        max_steps = 5  # Prevent infinite loops
        step = 0

        try:
            while step < max_steps:
                logger.info(f"🤖 Executing analysis step {step + 1}/{max_steps}")
                step_result = await self._execute_analysis_step(messages)

                if step_result and isinstance(step_result, dict):
                    # Check for API call errors
                    if "error" in step_result:
                        logger.error(f"⚠️ Analysis step error: {step_result['error']}")
                        analysis_result["error"] = step_result["error"]
                        break

                    analysis_result["analysis_steps"].append(step_result)

                    response = step_result.get("response", "")
                    if response:
                        logger.info(
                            f"""💭 AI Reasoning Step {step + 1}:
                            {response}...
                            """
                        )
                        analysis_result["findings"].append(response)

                    if "ANALYSIS COMPLETE" in (response or ""):
                        logger.info("✅ Analysis complete signal received")
                        break

                    if step_result.get("has_function_call", False):
                        logger.info("🔄 Function call made, continuing analysis")
                        messages = step_result["messages"]

                        # Check for function call responses
                        for msg in step_result["messages"]:
                            if msg.get("role") == "function" and "error" in msg.get(
                                "content", ""
                            ):
                                logger.error(f"⚠️ Function call error: {msg['content']}")
                                analysis_result["error"] = (
                                    f"Function call failed: {msg['content']}"
                                )
                                break

                step += 1

            # Mark as high priority if any critical findings or based on severity
            is_high_priority = any(
                "CRITICAL" in finding for finding in analysis_result["findings"]
            ) or vuln.get("severity") in ["CRITICAL", "HIGH"]
            analysis_result["high_priority"] = is_high_priority

            logger.info(
                f"""📊 Vulnerability Analysis Summary:
                - Steps completed: {step}
                - Findings count: {len(analysis_result["findings"])}
                - High Priority: {is_high_priority}
                """
            )

            return analysis_result

        except Exception as e:
            logger.error(f"❌ Vulnerability analysis failed: {str(e)}")
            return {
                "original_data": vuln,
                "error": str(e),
                "analysis_steps": analysis_result["analysis_steps"],
                "findings": analysis_result["findings"],
            }

    async def analyze_scan(
        self,
        scan_request: ScanRequest,
        service_account: Optional[ServiceAccount],
    ) -> Dict[str, Any]:
        """Main analysis entry point with agentic decision making."""
        try:
            logger.info("🤖 Starting agentic security analysis...")
            analysis_start_time = datetime.utcnow().isoformat()

            # Reset function calls for new analysis
            self.function_calls = []  # Explicitly reset this list

            # Store service account for use in API calls
            self.service_account = service_account
            if service_account:
                logger.info(f"🔐 Using service account: {service_account.name}")
            else:
                logger.warning("⚠️ No service account provided")

            # Reset function calls for new analysis
            self.function_calls = []

            # Transform initial data
            initial_analysis = self._transform_trivy_data(scan_request.trivy_data)

            # Initialize analysis state
            self.analysis_state = {
                "vulnerabilities_analyzed": 0,
                "high_priority_findings": [],
                "pending_verifications": [],
                "completed_analyses": [],
            }

            # Let AI determine analysis strategy
            strategy_messages = [
                {
                    "role": "system",
                    "content": """You are an expert security analyst AI.
                Determine the optimal analysis strategy based on the vulnerability data.
                Consider severity distribution, types of vulnerabilities, and potential impacts.""",
                },
                {
                    "role": "user",
                    "content": f"Determine analysis strategy for: {json.dumps(initial_analysis['summary'])}",
                },
            ]
            strategy_result = await self._execute_analysis_step(strategy_messages)

            # Process vulnerabilities according to AI strategy
            enhanced_vulnerabilities = []
            for vuln in initial_analysis["vulnerabilities"]:
                analysis_result = await self._analyze_vulnerability(vuln)
                enhanced_vulnerabilities.append(analysis_result)

                # Update analysis state
                self.analysis_state["vulnerabilities_analyzed"] += 1
                if analysis_result.get("high_priority"):
                    self.analysis_state["high_priority_findings"].append(
                        analysis_result
                    )

            # Final analysis compilation
            analysis_complete_time = datetime.utcnow().isoformat()
            duration = (
                datetime.fromisoformat(analysis_complete_time)
                - datetime.fromisoformat(analysis_start_time)
            ).total_seconds()

            return {
                "summary": initial_analysis["summary"],
                "vulnerabilities": enhanced_vulnerabilities,
                "analysis_state": self.analysis_state,
                "metadata": {
                    "start_time": analysis_start_time,
                    "completion_time": analysis_complete_time,
                    "duration_seconds": duration,
                    "model": "gpt-4",
                    "function_calls": self.function_calls,
                },
            }

        except Exception as e:
            logger.error(f"❌ Analysis failed: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))

        finally:
            # Clear service account after analysis
            self.service_account = None

    def _log_analysis_step(self, step: str, details: Any = None):
        """Log analysis steps with details"""
        logger.info(f"🤖 AI Analysis - {step}")
        if details:
            logger.info(f"Details: {json.dumps(details, indent=2)}")

    def _track_function_call(
        self, function_name: str, service_name: str, status: str, location: str
    ):
        """Track function calls made during analysis"""

        logger.info(
            f"""🤖💬 {function_name}
        - svc: {service_name}
        - status: {status}
        - loc: {location}
        """
        )
        self.function_calls.append(
            {
                "timestamp": datetime.utcnow().isoformat(),
                "function": function_name,
                "service": service_name,
                "status": status,
                "location": location,
            }
        )

    def _clean_json_response(self, content: str) -> str:
        """Clean the response content to extract pure JSON."""
        # Remove markdown code block if present
        if "```json" in content:
            content = content.split("```json")[1]
            if "```" in content:
                content = content.split("```")[0]
        # Remove any other markdown artifacts or explanatory text
        try:
            # Try to find the first occurrence of a valid JSON object
            start_idx = content.find("{")
            end_idx = content.rstrip().rfind("}") + 1
            if start_idx != -1 and end_idx != -1:
                content = content[start_idx:end_idx]
        except Exception:
            pass
        return content.strip()

    def _transform_trivy_data(self, trivy_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform raw Trivy data into our expected format."""
        self._log_analysis_step("Transforming Trivy data")

        # Calculate severity counts
        severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        vulnerabilities = []

        for result in trivy_data.get("Results", []):
            for vuln in result.get("Vulnerabilities", []):
                severity = vuln.get("Severity", "UNKNOWN").upper()
                if severity in severity_counts:
                    severity_counts[severity] += 1

                # Transform vulnerability data
                vulnerabilities.append(
                    {
                        "id": vuln.get("VulnerabilityID"),
                        "package": vuln.get("PkgName"),
                        "installedVersion": vuln.get("InstalledVersion"),
                        "fixedVersion": vuln.get("FixedVersion"),
                        "severity": severity,
                        "description": vuln.get("Description"),
                        "title": vuln.get("Title"),
                        "cvssScore": vuln.get("CVSS", {})
                        .get("nvd", {})
                        .get("V3Score", 0.0),
                    }
                )

        # Get OS info from metadata
        os_info = trivy_data.get("Metadata", {}).get("OS", {})

        return {
            "summary": {
                "vulnerabilities": {
                    "total": sum(severity_counts.values()),
                    "critical": severity_counts["CRITICAL"],
                    "high": severity_counts["HIGH"],
                    "medium": severity_counts["MEDIUM"],
                    "low": severity_counts["LOW"],
                },
                "OS": {
                    "Family": os_info.get("Family", "Unknown"),
                    "Version": os_info.get("Name", "Unknown"),
                },
                "image": trivy_data.get("ArtifactName", "Unknown"),
            },
            "vulnerabilities": vulnerabilities,
        }

    async def _call_external_api(
        self,
        endpoint: VulnerabilityEndpoint,
        function_args: Dict[str, Any],
        headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Make calls to external vulnerability assessment APIs."""
        async with httpx.AsyncClient() as client:
            try:
                headers = headers or {}
                headers.update(endpoint.headers)

                # Add authentication for assess_vulnerability endpoint
                if endpoint.name == "vulnerability_assessment" and self.service_account:
                    logger.info(
                        f"🔐 Creating service token for {self.service_account.name}"
                    )
                    token, _ = create_service_token(
                        service_account_id=self.service_account.id,
                        service_name=self.service_account.name,
                    )
                    headers["Authorization"] = f"Bearer {token}"
                    logger.info(f"🔑 Added authentication token for {endpoint.name}")

                try:
                    if endpoint.method == "GET":
                        url = f"{endpoint.url}?cveId={function_args.get('cve_id')}"
                        logger.info(f"📡 Making GET request to {url}")
                        response = await client.get(url, headers=headers, timeout=10.0)
                    else:
                        logger.info(f"📡 Making POST request to {endpoint.url}")
                        response = await client.post(
                            endpoint.url,
                            json=function_args,
                            headers=headers,
                            timeout=10.0,
                        )
                    response_text = response.text
                    logger.info(f"📥 Response status: {response.status_code}")
                    logger.info(f"📥 Response body: {response_text}...")

                    if response.status_code == 403:
                        error_msg = "Authentication failed - check service account configuration"
                        logger.error(f"🔒 {error_msg}")
                        return {"error": error_msg}

                    if response.status_code != 200:
                        error_msg = f"API error: {response_text}"
                        logger.error(f"❌ {error_msg}")
                        return {
                            "error": f"Failed to fetch data from {endpoint.name}: {error_msg}"
                        }

                    try:
                        # Ensure we can parse the JSON response
                        json_response = response.json()
                        return json_response
                    except Exception as json_err:
                        logger.error(
                            f"❌ Failed to parse JSON response: {str(json_err)}"
                        )
                        return {"error": f"Invalid JSON response from {endpoint.name}"}

                    # return response.json()

                except Exception as e:
                    error_msg = f"API call failed: {str(e)}"
                    logger.error(error_msg)
                    return {"error": error_msg}

            except httpx.RequestError as e:
                error_msg = f"Request failed: {str(e)}"
                logger.error(f"🌐 {error_msg}")
                return {"error": error_msg}


async def analyze_scan_with_ai(
    scan_request: ScanRequest,
    current_user: User,
    db: Session,
) -> Dict[str, Any]:
    """Main entry point for AI-powered scan analysis."""
    service_account = (
        db.query(ServiceAccount)
        .filter(
            ServiceAccount.created_by == current_user.id,
            ServiceAccount.is_active,
        )
        .first()
    )

    analyzer = AgenticAIAnalyzer(openai_key=current_user.openai_key)
    return await analyzer.analyze_scan(scan_request, service_account)
