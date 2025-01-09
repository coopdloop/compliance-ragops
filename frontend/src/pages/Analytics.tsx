import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Shield, Activity } from 'lucide-react';

const mockData = {
    complianceOverTime: Array.from({ length: 12 }, (_, i) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        score: 65 + Math.random() * 20
    })),
    issuesByCategory: [
        { category: 'Security Controls', count: 45, delta: 12 },
        { category: 'Access Management', count: 32, delta: -8 },
        { category: 'Data Protection', count: 28, delta: 5 },
        { category: 'Network Security', count: 24, delta: -3 }
    ],
    riskDistribution: [
        { severity: 'Critical', count: 12 },
        { severity: 'High', count: 28 },
        { severity: 'Medium', count: 45 },
        { severity: 'Low', count: 67 }
    ]
};

export default function Analytics() {
    return (
        <div className="space-y-6 p-6">
            {/* Header Section */}
            <div className="flex flex-col space-y-4">
                <h1 className="text-2xl font-bold tracking-tight">Compliance Analytics</h1>
                <div className="flex space-x-4">
                    <Card className="flex-1">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Overall Compliance Score</CardTitle>
                            <Badge variant="default" className="bg-green-600">
                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                +4.3%
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">84.7%</div>
                            <Progress value={84.7} className="mt-2" />
                        </CardContent>
                    </Card>

                    <Card className="flex-1">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
                            <Badge variant="destructive">
                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                +12
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">152</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                across all systems
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex-1">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Assets Monitored</CardTitle>
                            <Shield className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1,284</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                98% coverage
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-2 gap-6">
                {/* Compliance Trend */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Compliance Score Trend</CardTitle>
                        <CardDescription>
                            Historical view of overall compliance performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockData.complianceOverTime}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#6B7280" />
                                <YAxis stroke="#6B7280" />
                                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151' }} />
                                <Area type="monotone" dataKey="score" stroke="#0EA5E9" fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Issues by Category */}
                <Card>
                    <CardHeader>
                        <CardTitle>Issues by Category</CardTitle>
                        <CardDescription>Distribution of compliance issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockData.issuesByCategory.map((category) => (
                                <div key={category.category} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">{category.category}</p>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            {category.delta > 0 ? (
                                                <ArrowUpRight className="h-4 w-4 text-red-500 mr-1" />
                                            ) : (
                                                <ArrowDownRight className="h-4 w-4 text-green-500 mr-1" />
                                            )}
                                            {Math.abs(category.delta)} since last month
                                        </div>
                                    </div>
                                    <div className="font-bold">{category.count}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Risk Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Risk Distribution</CardTitle>
                        <CardDescription>Severity breakdown of issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={mockData.riskDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="severity" stroke="#6B7280" />
                                <YAxis stroke="#6B7280" />
                                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151' }} />
                                <Bar dataKey="count" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Alerts */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Compliance Alerts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Critical Security Control Failure</AlertTitle>
                            <AlertDescription>
                                Firewall configuration drift detected in production environment.
                            </AlertDescription>
                        </Alert>
                        <Alert>
                            <Activity className="h-4 w-4" />
                            <AlertTitle>Access Policy Update Required</AlertTitle>
                            <AlertDescription>
                                New compliance requirement necessitates IAM policy review.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
