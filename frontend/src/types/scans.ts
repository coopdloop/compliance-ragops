// types/scan.ts

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SeverityCounts {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
}

export interface ScanRequest {
    project_name: string;
    trivy_data: Record<string, any>;
    documents?: string[];
    scan_type: string;
}

export interface ScanResult {
    id: number;
    project_name: string;
    scan_date: string;
    severity_counts: SeverityCounts;
    analysis_result: ScanAnalysisResult;
    documents: string[];
    total_vulnerabilities: number;
    critical_vulnerabilities: number;
    compliance_score: number | null;
    scan_type: 'container' | 'git' | 'code' | 'infra';
}

export interface AnalysisResult {
    summary: {
        critical_findings: string[];
        risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
        priority_score: number;
    };
    risk_assessment: {
        business_impact: string;
        attack_vectors: string[];
        affected_components: string[];
    };
    remediation: {
        immediate_actions: string[];
        long_term_actions: string[];
        recommended_timeline: string;
    };
    compliance_impact: {
        standards_affected: string[];
        compliance_status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
        required_controls: string[];
    };
}

export interface ScanHistoryItemProps {
    scan: ScanResult;
    onDelete: (id: number) => Promise<void>;
}

export const severityColors = {
    CRITICAL: 'text-red-500 bg-red-500/10',
    HIGH: 'text-orange-500 bg-orange-500/10',
    MEDIUM: 'text-yellow-500 bg-yellow-500/10',
    LOW: 'text-green-500 bg-green-500/10'
} as const;

export interface ScanType {
    id: string;
    name: string;
    icon: React.ElementType;
    description: string;
}

export interface DocumentUsage {
    id: string;
    name: string;
    usageCount: number;
}

export interface FunctionCall {
    timestamp: string;
    function: string;
    service: string;
    status: 'success' | 'failed';
    location: string;
}

// TODO
// interface VulnerabilityAssessment {
//     severity_rating: string;
//     mitigation_steps: string[];
//     estimated_effort: 'low' | 'medium' | 'high';
//     priority: 'low' | 'medium' | 'high';
// }
//
interface AnalysisStep {
    response: string;
    messages: Array<{
        role: string;
        content: string;
        name?: string;
    }>;
    has_function_call: boolean;
}

export interface VulnerabilityAnalysis {
    original_data: Vulnerability;
    analysis_steps: AnalysisStep[];
    findings: string[];
    high_priority: boolean;
    error?: string;
}

interface Vulnerability {
    id: string;
    title: string;
    package: string;
    installedVersion: string;
    fixedVersion: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    cvssScore: number;
    nvd_info?: {
        error?: string;
        [key: string]: any;
    };
    assessment?: {
        [key: string]: any;
    };
}

// export interface Vulnerability {
//     original_data: Vulnerability;
//     analysis_steps: AnalysisStep[];
//     findings: string[];
//     high_priority: boolean;
//     error?: string;
    // id: string;
    // package: string;
    // installedVersion: string;
    // fixedVersion: string;
    // severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    // description: string;
    // title: string;
    // cvssScore: number;
    // // assessment: VulnerabilityAssessment;
    // nvd_info?: { error: string };
// }

interface ScanSummary {
    vulnerabilities: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    OS: {
        Family: string;
        Version: string;
    };
    image: string;
}

interface ScanMetadata {
    start_time: string;
    completion_time: string;
    duration_seconds: number;
    model: string;
    function_calls: FunctionCall[];
}

export interface ScanAnalysisResult {
    summary: ScanSummary;
    vulnerabilities: VulnerabilityAnalysis[];
    metadata: ScanMetadata;
}


export type SortByType = 'date' | 'critical' | 'compliance';
export type SortOrderType = 'asc' | 'desc';
