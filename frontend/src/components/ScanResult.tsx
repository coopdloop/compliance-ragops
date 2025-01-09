import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertTriangle,
    Clock,
    Activity,
    Server,
    Package,
    ExternalLink,
    X,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { FunctionCall, ScanHistoryItemProps, VulnerabilityAnalysis } from '@/types/scans';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';


interface FunctionCallsSummaryProps {
    functionCalls: FunctionCall[];
}

const FunctionCallsSummary: React.FC<FunctionCallsSummaryProps> = ({ functionCalls }) => {
    // Group function calls by service and count them
    const serviceStats = functionCalls.reduce((acc, call) => {
        acc[call.service] = acc[call.service] || {
            total: 0,
            success: 0,
            failed: 0,
            latestTimestamp: null,
            avgLatency: 0,
            locations: new Set(),
            calls: []
        };

        acc[call.service].total += 1;
        acc[call.service].calls.push(call);
        acc[call.service].locations.add(call.location);

        // Safely handle timestamp tracking
        if (call.timestamp) {
            const currentTimestamp = new Date(call.timestamp);
            const existingTimestamp = acc[call.service].latestTimestamp
                ? new Date(acc[call.service].latestTimestamp!)
                : null;

            if (!existingTimestamp || currentTimestamp > existingTimestamp) {
                acc[call.service].latestTimestamp = call.timestamp;
            }
        }

        if (call.status === 'success') {
            acc[call.service].success += 1;
        } else {
            acc[call.service].failed += 1;
        }

        return acc;
    }, {} as Record<string, {
        total: number;
        success: number;
        failed: number;
        latestTimestamp: string | null;
        avgLatency: number;
        locations: Set<string>;
        calls: Array<any>;
    }>);

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">API Call Statistics</CardTitle>
                    <CardDescription>
                        Total API calls: {functionCalls.length} across {Object.keys(serviceStats).length} services
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Per Service Stats */}
            <div className="grid gap-4">
                {Object.entries(serviceStats).map(([service, stats]) => (
                    <Card key={service}>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {/* Service Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Server className="h-4 w-4 text-blue-500" />
                                        <div>
                                            <div className="font-medium">{service}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {Array.from(stats.locations)[0]}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                            {stats.success} successful
                                        </Badge>
                                        {stats.failed > 0 && (
                                            <Badge variant="outline" className="bg-red-500/10 text-red-500">
                                                {stats.failed} failed
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Additional Stats */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-muted-foreground">Success Rate</div>
                                        <div className="font-medium">
                                            {((stats.success / stats.total) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Last Call</div>
                                        <div className="font-medium">
                                            {stats.latestTimestamp ?
                                                new Date(stats.latestTimestamp).toLocaleTimeString() :
                                                'N/A'
                                            }
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <Progress
                                        value={(stats.success / stats.total) * 100}
                                        className="h-2"
                                    />
                                    <div className="text-xs text-muted-foreground text-right">
                                        {stats.total} total calls
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const VulnerabilityDetails: React.FC<{ vulnerability: VulnerabilityAnalysis }> = ({ vulnerability }) => {
    const { original_data, analysis_steps, findings, high_priority, error } = vulnerability;
    const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);

    const getNVDLink = (cveId: string) => `https://nvd.nist.gov/vuln/detail/${cveId}`;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <CardTitle className="text-lg">{original_data.title || 'Unknown Title'}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={
                                original_data.severity === 'CRITICAL'
                                    ? 'bg-red-500/10 text-red-500'
                                    : original_data.severity === 'HIGH'
                                        ? 'bg-orange-500/10 text-orange-500'
                                        : 'bg-yellow-500/10 text-yellow-500'
                            }
                        >
                            {original_data.severity} (CVSS: {original_data.cvssScore})
                        </Badge>
                        {high_priority && (
                            <Badge variant="outline" className="bg-red-500/10 text-red-500">
                                High Priority
                            </Badge>
                        )}
                    </div>
                </div>
                <CardDescription className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <span>Package: {original_data.package}</span>
                        <a
                            href={getNVDLink(original_data.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                        >
                            {original_data.id}
                            <ExternalLink className="h-3 w-3" />
                        </a>

                        <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">{original_data.description}</p>
                        </div>

                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium">Current Version</h4>
                            <code className="text-sm bg-muted p-2 rounded block">
                                {original_data.installedVersion}
                            </code>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">Fixed Version</h4>
                            <code className="text-sm bg-muted p-2 rounded block">
                                {original_data.fixedVersion}
                            </code>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Separator />
                        <div className="flex flex-col items-center justify-center mt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                                className="flex items-center gap-2"
                            >
                                {isAnalysisExpanded ? (
                                    <>
                                        <ChevronUp className="h-4 w-4" />
                                        Collapse findings
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4" />
                                        Expand findings
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                </CardDescription>
            </CardHeader>
            <CardContent className={`p-0 pt-6 space-y-4 transition-all duration-300 ease-in-out ${isAnalysisExpanded ? 'max-h-[800px] overflow-y-auto' : 'max-h-0 overflow-hidden'
                }`}>
                {/* Analysis Status / Error */}
                {error ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Analysis failed: {error}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <>
                        {/* Analysis Findings - only show if there are findings */}
                        {findings && findings.length > 0 && (
                            <div className="space-y-2">
                                {findings.map((finding, idx) => (
                                    <Card key={idx} className="p-4">
                                        <p className="text-sm">{finding}</p>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Analysis Steps - only show if there are steps with responses */}
                        {analysis_steps && analysis_steps.some(step => step.response) && (
                            <div className="space-y-2">
                                <h4 className="font-medium">Analysis Steps</h4>
                                <div className="space-y-2">
                                    {analysis_steps
                                        .filter(step => step.response)
                                        .map((step, idx) => (
                                            <Card key={idx} className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline">Step {idx + 1}</Badge>
                                                    {step.has_function_call && (
                                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                                                            Function Call
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">{step.response}</p>
                                            </Card>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Show message if no analysis data */}
                        {(!findings?.length && !analysis_steps?.some(step => step.response)) && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    No detailed analysis available for this vulnerability
                                </AlertDescription>
                            </Alert>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

const EnhancedScanDetails: React.FC<ScanHistoryItemProps> = ({ scan, onDelete }) => {
    const totalFunctionCalls = scan.analysis_result.metadata.function_calls.length;
    const successfulCalls = scan.analysis_result.metadata.function_calls.filter(
        call => call.status === 'success'
    ).length;

    return (
        <Card className="relative">
            {/* X button added in top right corner */}
            <Button
                onClick={() => onDelete(scan.id)}
                className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors"
                aria-label="Delete scan"
                variant={"outline"}
            >
                <X className="h-5 w-5" />
            </Button>

            <CardHeader>
                <div className="flex items-center">
                    <div>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                {scan.project_name}
                            </CardTitle>
                            <Badge variant="outline" className="text-blue-500">
                                {scan.scan_type.toUpperCase()}
                            </Badge>
                        </div>
                        <CardDescription>
                            Scan performed on {new Date(scan.scan_date).toLocaleString()}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="functions">Function Calls</TabsTrigger>
                        <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Server className="h-4 w-4 text-blue-500" />
                                            Infrastructure
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {scan.analysis_result.summary.OS.Family == "Unknown" ? "Unknown OS" : scan.analysis_result.summary.OS.Family} {scan.analysis_result.summary.OS.Version == "Unknown" ? "" : scan.analysis_result.summary.OS.Version}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {scan.analysis_result.summary.image}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-green-500" />
                                            Analysis Duration
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {Math.round(scan.analysis_result.metadata.duration_seconds)}s
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Completed at {new Date(scan.analysis_result.metadata.completion_time).toLocaleTimeString()}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-purple-500" />
                                            Function Calls
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-purple-500">
                                            {successfulCalls}/{totalFunctionCalls}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Successful function calls
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="bg-yellow-500/10 border-yellow-500/20">
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                        Security Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-sm">
                                        This scan identified {scan.total_vulnerabilities} vulnerabilities,
                                        including {scan.critical_vulnerabilities} critical issues that require immediate attention.
                                    </p>
                                    <div className="flex gap-2">
                                        {Object.entries(scan.severity_counts).map(([severity, count]) => count > 0 && (
                                            <Badge
                                                key={severity}
                                                variant="outline"
                                                className={
                                                    severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
                                                        severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500' :
                                                            severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                'bg-green-500/10 text-green-500'
                                                }
                                            >
                                                {severity}: {count}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="functions" className="space-y-4">
                        <FunctionCallsSummary functionCalls={scan.analysis_result.metadata.function_calls} />
                    </TabsContent>

                    <TabsContent value="vulnerabilities" className="space-y-4">
                        {scan.analysis_result.vulnerabilities.map((vuln, idx) => (
                            <VulnerabilityDetails key={idx} vulnerability={vuln} />
                        ))}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default EnhancedScanDetails;
