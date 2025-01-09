// Types
export interface DashboardStats {
    totalScans: number;
    criticalIssues: number;
    openIssues: number;
    resolvedIssues: number;
    complianceScore: number;
}

export interface AIModel {
    id: string;
    name: string;
    description: string;
    lastUsed: string;
    type: 'GPT4' | 'GPT35' | 'CLAUDE';
    accuracy: number;
    speed: number;
    reliability: number;
    [key: string]: string | number; // Add index signature for dynamic access
}

export interface ComplianceTrend {
    month: string;
    scans: number;
    issues: number;
    compliance: number;
}

export interface AIRecommendation {
    id: string;
    title: string;
    message: string;
    type: 'performance' | 'security' | 'optimization' | 'alert';
    severity: 'low' | 'medium' | 'high';
    category: 'security' | 'compliance' | 'performance';
    timestamp: string;
}

export interface DetailedAnalytics {
    totalProcessed: number;
    avgProcessingTime: number | null;
    errorRate: number;
    peakPerformance: string | null;

    severityBreakdown: {
        total: number;
        critical: number;
        details: Record<string, number>;
    };

    complianceAnalytics: {
        avgComplianceScore: number | null;
        scoreTrend: Array<{ month: string, score: number }>;
    };

    predictions: {
        monthlyProjectedScans: number;
        resourceScaling: number;
        uptime: number;
        bottleneckRisk: string;
    };

    severityTrends: Array<{
        month: string;
        data: {
            CRITICAL: number;
            HIGH: number;
            MEDIUM: number;
            LOW: number;
        };
    }>;
}

export interface Recommendation {
    type: string;
    timestamp: string;
    title: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
}


export interface ScanStats {
    totalScans: number;
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
}
