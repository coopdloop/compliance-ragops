import React, { useState, useMemo, useEffect } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import {
    Shield, AlertTriangle, CheckCircle, Clock,
    Brain, LineChart as LineChartIcon, Settings,
} from 'lucide-react';
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

// Core functionality imports
import {
    useAIModels,
    useAIRecommendations,
    useComplianceTrends,
    useDashboardStats,
    useDetailedAnalytics
} from '@/hooks/useApiQueries';
import { AIModel, AIRecommendation, DetailedAnalytics, Recommendation } from '@/types/types';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';

// Mock data for recommendations
const MOCK_RECOMMENDATIONS: Recommendation[] = [
    {
        type: 'Security',
        timestamp: '2 hours ago',
        title: 'IAM Policy Update Required',
        message: 'Detected overly permissive IAM roles in production environment. Consider implementing least-privilege access controls.',
        severity: 'high'
    },
    {
        type: 'Compliance',
        timestamp: '5 hours ago',
        title: 'GDPR Compliance Gap',
        message: 'Personal data retention policies need updating to meet GDPR requirements in EU regions.',
        severity: 'medium'
    },
    {
        type: 'Performance',
        timestamp: '1 day ago',
        title: 'Resource Optimization',
        message: 'Current resource utilization patterns suggest potential cost savings through right-sizing.',
        severity: 'low'
    }
];

const RecommendationCard: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
    const getSeverityColor = (severity: Recommendation['severity']): string => {
        switch (severity) {
            case 'high': return 'text-red-500';
            case 'medium': return 'text-yellow-500';
            case 'low': return 'text-green-500';
            default: return 'text-primary';
        }
    };

    return (
        <div className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent/50 transition-colors backdrop-blur-sm">
            <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="font-medium">{recommendation.title}</span>
                    <Badge variant="outline" className={cn("ml-2", getSeverityColor(recommendation.severity))}>
                        {recommendation.type}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                    {recommendation.message}
                </p>
                <p className="text-xs text-muted-foreground">
                    {recommendation.timestamp}
                </p>
            </div>
            <div className="flex gap-2 ml-4">
                <Button size="sm" className="bg-primary/90 hover:bg-primary">
                    Apply
                </Button>
                <Button size="sm" variant="outline">
                    Dismiss
                </Button>
            </div>
        </div>
    );
};

// In your Dashboard component, update the recommendations section:
const RecommendationsSection = () => (
    <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <CardHeader>
            <CardTitle>Recent AI Recommendations</CardTitle>
            <CardDescription>
                Actionable insights to improve your system
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {MOCK_RECOMMENDATIONS.map((rec, index) => (
                    <RecommendationCard key={index} recommendation={rec} />
                ))}
            </div>
        </CardContent>
    </Card>
);

// Enhanced Components with preserved functionality
const ComplianceScore: React.FC<{ score: number }> = ({ score }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(score), 500);
        return () => clearTimeout(timer);
    }, [score]);

    const getScoreColor = (score: number): string => {
        if (score >= 90) return 'text-green-500 shadow-green-500/50';
        if (score >= 70) return 'text-yellow-500 shadow-yellow-500/50';
        return 'text-red-500 shadow-red-500/50';
    };

    return (
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-background via-primary/5 to-background animate-pulse" />
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Compliance Score</span>
                    <Badge
                        variant="outline"
                        className={cn(
                            "px-3 py-1 text-sm font-semibold shadow-[0_0_15px]",
                            getScoreColor(score)
                        )}
                    >
                        {score}%
                    </Badge>
                </CardTitle>
                <CardDescription>Overall compliance rating across all systems</CardDescription>
            </CardHeader>
            <CardContent>
                <Progress value={progress} className="h-2.5 w-full" />
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Risk Level</p>
                        <p className={cn(
                            "font-semibold",
                            score >= 90 ? "text-green-500" : score >= 70 ? "text-yellow-500" : "text-red-500"
                        )}>
                            {score >= 90 ? 'Low' : score >= 70 ? 'Medium' : 'High'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Trend</p>
                        <p className={cn(
                            "font-semibold",
                            score >= 90 ? "text-green-500" : "text-red-500"
                        )}>
                            {score >= 90 ? '+5.2%' : '-3.1%'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Benchmark</p>
                        <p className="font-semibold">85%</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const ModelPerformanceCard: React.FC<{ models: AIModel[] }> = ({ models }) => {
    const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'speed' | 'reliability'>('accuracy');

    const sortedModels = useMemo(() =>
        [...models].sort((a, b) => b[selectedMetric] - a[selectedMetric]),
        [models, selectedMetric]
    );

    return (
        <Card className="h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
            <CardHeader>
                <div className="flex lg:flex-col lg:gap-4 pb-1 justify-between items-center">
                    <CardTitle>Model Performance</CardTitle>
                    <Select
                        value={selectedMetric}
                        onValueChange={(value: 'accuracy' | 'speed' | 'reliability') => setSelectedMetric(value)}
                    >
                        <SelectTrigger className="w-[180px] cursor-pointer">
                            <SelectValue className="w-full" placeholder="Select Metric" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="accuracy" className="cursor-pointer">Accuracy</SelectItem>
                            <SelectItem value="speed" className="cursor-pointer">Speed</SelectItem>
                            <SelectItem value="reliability" className="cursor-pointer">Reliability</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <CardDescription>
                    Comparative performance across AI models
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {sortedModels.map((model, index) => (
                        <div
                            key={model.id}
                            className="flex items-center space-x-3 p-2 rounded-lg transition-colors hover:bg-primary/5"
                        >
                            <Badge
                                variant="secondary"
                                className="w-8 h-8 flex items-center justify-center"
                            >
                                {index + 1}
                            </Badge>
                            <div className="flex-grow">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{model.name}</span>
                                    <span>{model[selectedMetric]}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${model[selectedMetric]}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const DetailedAnalyticsSection: React.FC<{ analytics: DetailedAnalytics }> = ({ analytics }) => {
    type TabValue = 'overview' | 'trends' | 'predictions';
    const [activeTab, setActiveTab] = useState<TabValue>('overview');

    const handleTabChange = (value: string) => {
        setActiveTab(value as TabValue);
    };

    return (
        <Card className="h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
            <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
                <CardDescription>
                    Comprehensive breakdown of system performance
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview" className="cursor-pointer">Overview</TabsTrigger>
                        <TabsTrigger value="trends" className="cursor-pointer">Trends</TabsTrigger>
                        <TabsTrigger value="predictions" className="cursor-pointer">Predictions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
                                <p className="text-sm text-muted-foreground">Total Processed</p>
                                <p className="text-2xl font-bold">{analytics.totalProcessed}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
                                <p className="text-sm text-muted-foreground">Average Processing Time</p>
                                <p className="text-2xl font-bold">{analytics.avgProcessingTime}ms</p>
                            </div>
                            <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
                                <p className="text-sm text-muted-foreground">Error Rate</p>
                                <p className="text-2xl font-bold text-red-500">
                                    {analytics.errorRate}%
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
                                <p className="text-sm text-muted-foreground">Peak Performance</p>
                                <p className="text-2xl font-bold text-green-500">
                                    {analytics.peakPerformance}
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="trends">
                        <div className="p-4 space-y-4">
                            {analytics.severityTrends.map((trend, index) => (
                                <div key={index} className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
                                    <h4 className="font-semibold mb-2">Month: {trend.month}</h4>
                                    <div className="grid grid-cols-4 gap-2">
                                        {Object.entries(trend.data).map(([severity, count]) => (
                                            <div key={severity} className="text-center">
                                                <p className="text-sm text-muted-foreground">{severity}</p>
                                                <p className="font-bold">{count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="predictions">
                        <div className="p-4 space-y-4">
                            <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
                                <h4 className="font-semibold mb-2">Resource Forecasting</h4>
                                <p className="text-sm text-muted-foreground">
                                    Predicted {analytics.predictions.monthlyProjectedScans}% increase in processing requirements.
                                    Recommended scaling compute resources by {analytics.predictions.resourceScaling}%.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
                                <h4 className="font-semibold mb-2">Risk Assessment</h4>
                                <p className="text-sm text-muted-foreground">
                                    {analytics.predictions.bottleneckRisk} probability of system bottlenecks.
                                    {analytics.predictions.uptime}% uptime predicted.
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

interface AIInsightsDialogProps {
    recommendations: AIRecommendation[] | undefined;
}

const AIInsightsDialog: React.FC<AIInsightsDialogProps> = ({ recommendations }) => {
    if (!recommendations) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-primary/5 hover:bg-primary/10">
                    <Brain className="w-4 h-4" /> AI Insights
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>AI Insights & Recommendations</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {recommendations.map((rec, index) => (
                            <div
                                key={index}
                                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <Badge variant="secondary">{rec.type}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {rec.timestamp}
                                    </span>
                                </div>
                                <h4 className="font-semibold mb-1">{rec.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {rec.message}
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <Button size="sm">Apply</Button>
                                    <Button size="sm" variant="outline">Dismiss</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

const Dashboard: React.FC = () => {
    const { user, loading: authLoading, login } = useAuth();

    // Preserve all API hooks
    const { data: stats, isLoading: statsLoading } = useDashboardStats();
    const { data: recommendations, isLoading: recsLoading } = useAIRecommendations();
    const { data: trends, isLoading: trendsLoading } = useComplianceTrends();
    const { data: aiModels, isLoading: modelsLoading } = useAIModels();
    const { data: detailedAnalytics = {
        totalProcessed: 0,
        avgProcessingTime: null,
        errorRate: 0,
        peakPerformance: null,
        severityBreakdown: {
            total: 0,
            critical: 0,
            details: {}
        },
        complianceAnalytics: {
            avgComplianceScore: null,
            scoreTrend: []
        },
        predictions: {
            monthlyProjectedScans: 0,
            resourceScaling: 0,
            uptime: 0,
            bottleneckRisk: 'low'
        },
        severityTrends: []
    } as DetailedAnalytics, isLoading: analyticsLoading } = useDetailedAnalytics();

    // Enhanced loading state
    if (authLoading || statsLoading || recsLoading || trendsLoading || modelsLoading || analyticsLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full bg-primary/20 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    // Login state
    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-b from-background to-background/80">
                <Card className="w-[400px] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse pointer-events-none" />
                    <CardHeader>
                        <CardTitle>Welcome Back</CardTitle>
                        <CardDescription>
                            Please log in to access your dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => login()}
                            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                        >
                            Log In
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Error state
    if (!stats || !trends || !aiModels || !detailedAnalytics) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Data Retrieval Error</AlertTitle>
                    <AlertDescription>
                        Unable to load dashboard data. Please refresh or contact support.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-gradient-to-b from-background to-background/80">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                        Compliance Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Welcome back, {user.name}. Here's your compliance overview.
                    </p>
                </div>
                <div className="flex gap-4">
                    <AIInsightsDialog recommendations={recommendations} />
                </div>
            </div>

            <Separator className="my-4" />

            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ComplianceScore score={stats.complianceScore} />

                <Card className="md:col-span-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                    <CardHeader>
                        <CardTitle>Key Performance Indicators</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm transition-all hover:bg-primary/5">
                                <div className="flex justify-center mb-2">
                                    <Shield className="w-6 h-6 text-blue-500" />
                                </div>
                                <p className="text-sm text-muted-foreground">Total Scans</p>
                                <p className="text-xl font-bold">{stats.totalScans}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm transition-all hover:bg-primary/5">
                                <div className="flex justify-center mb-2">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <p className="text-sm text-muted-foreground">Critical Issues</p>
                                <p className="text-xl font-bold text-red-500">{stats.criticalIssues}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm transition-all hover:bg-primary/5">
                                <div className="flex justify-center mb-2">
                                    <Clock className="w-6 h-6 text-yellow-500" />
                                </div>
                                <p className="text-sm text-muted-foreground">Open Issues</p>
                                <p className="text-xl font-bold text-yellow-500">{stats.openIssues}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm transition-all hover:bg-primary/5">
                                <div className="flex justify-center mb-2">
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                </div>
                                <p className="text-sm text-muted-foreground">Resolved Issues</p>
                                <p className="text-xl font-bold text-green-500">{stats.resolvedIssues}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts and Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
                <div className="lg:col-span-2">
                    <Card className="h-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>
                                    <div className="flex items-center gap-2">
                                        <LineChartIcon className="w-5 h-5" />
                                        Compliance Trends
                                    </div>
                                </CardTitle>
                                <Button variant="ghost" size="icon">
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/20" />
                                    <XAxis dataKey="month" className="text-muted-foreground" />
                                    <YAxis className="text-muted-foreground" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="compliance"
                                        stroke="hsl(var(--primary))"
                                        fill="url(#colorCompliance)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <ModelPerformanceCard models={aiModels} />
                </div>
                <div className="lg:col-span-1">
                    <DetailedAnalyticsSection analytics={detailedAnalytics as DetailedAnalytics} />
                </div>
            </div>

            {/* Recent Recommendations Section */}
            <RecommendationsSection />
        </div>
    );
}

export default Dashboard;
