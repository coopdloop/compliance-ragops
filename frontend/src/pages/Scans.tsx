// src/pages/Scans.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dispatch, SetStateAction, useState } from 'react';
import { Loader2, AlertTriangle, Scan, GitBranch, FileText, Search, SortAsc, Clock, FileWarning, SortDesc, Filter, Container, Code2, Box, Shield } from 'lucide-react';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/providers/AuthProvider';
import { ScanSkeleton } from '@/components/ScanSkeletonLoader';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { DocumentUsage, ScanRequest, ScanResult, ScanType, SortByType, SortOrderType } from '@/types/scans';
import { cn } from '@/lib/utils';
import EmptyDocumentStats from '@/components/EmptyDocumentStats';
import EnhancedScanDetails from '@/components/ScanResult';

interface DocumentItem {
    id: string;
    name: string;
    category: string;
    description: string;
}

const scanTypes: ScanType[] = [
    {
        id: 'container',
        name: 'Container Security',
        icon: Container,
        description: 'Scan container images for vulnerabilities and misconfigurations'
    },
    {
        id: 'infra',
        name: 'Infrastructure Security',
        icon: Box,
        description: 'Analyze infrastructure code and configurations'
    },
    {
        id: 'code',
        name: 'Code',
        icon: Code2,
        description: 'Analyze source code for security issues'
    },
    {
        id: 'git',
        name: 'Git Repository',
        icon: GitBranch,
        description: 'Scan git repositories for security issues'
    }
];

interface ScanTypeListProps {
    onSelect: (type: ScanType) => void;
    selectedScanType: ScanType | null;
}

const ScanTypeList: React.FC<ScanTypeListProps> = ({ onSelect, selectedScanType }) => (
    <div className="grid grid-cols-2 gap-4">
        {scanTypes.map((type) => {
            const Icon = type.icon;
            return (
                <Button
                    type="button"
                    key={type.id}
                    variant="outline"
                    className={cn(
                        "h-auto p-4 flex flex-col items-center text-center",
                        selectedScanType?.id === type.id && "border-primary bg-accent border-2"
                    )}
                    onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        onSelect(type);
                    }}
                >
                    <Icon className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-semibold">{type.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                </Button>
            );
        })}
    </div>
);

// Document Selection Modal Component
const DocumentSelectionModal = ({
    isOpen,
    onClose,
    onConfirm,
    selectedDocs,
    setSelectedDocs
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    selectedDocs: string[];
    setSelectedDocs: Dispatch<SetStateAction<string[]>>;
}) => {
    const { data: documents } = useQuery<DocumentItem[]>({
        queryKey: ['documents'],
        queryFn: () => api.get('/api/documents/').then((res) => res.data)
    });

    const handleToggleDocument = (docId: string) => {
        setSelectedDocs((prev: string[]) =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Select Context Documents</DialogTitle>
                    <DialogDescription>
                        Choose relevant compliance documents to use as context for the scan analysis
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Tabs defaultValue="ALL">
                        <TabsList>
                            <TabsTrigger value="ALL">All</TabsTrigger>
                            <TabsTrigger value="POLICY">Policies</TabsTrigger>
                            <TabsTrigger value="STANDARD">Standards</TabsTrigger>
                            <TabsTrigger value="COMPLIANCE">Compliance</TabsTrigger>
                        </TabsList>
                        <ScrollArea className="h-[400px] mt-4 pr-4">
                            <div className="space-y-4">
                                {documents?.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <Checkbox
                                            checked={selectedDocs.includes(doc.id)}
                                            onCheckedChange={() => handleToggleDocument(doc.id)}
                                        />
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-medium">{doc.name}</h4>
                                                <Badge variant="outline">{doc.category}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{doc.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </Tabs>
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onConfirm}>
                        Confirm Selection ({selectedDocs.length})
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Scan Type Selection Modal Component
const ScanTypeModal = ({
    isOpen,
    onClose,
    onSelectType,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelectType: (type: ScanType) => void;
}) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Select Scan Type</DialogTitle>
                <DialogDescription>
                    Choose the type of security scan you want to perform
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 h-[600px]">
                {scanTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                        <Button
                            key={type.id}
                            variant="outline"
                            className="mx-4 grid-cols-2 items-center text-left h-auto"
                            onClick={() => onSelectType(type)}
                        >
                            <Icon className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                            <div className="flex-col gap-6 w-1/2">
                                <h4 className="font-medium">{type.name}</h4>
                                <p className="text-sm text-muted-foreground text-wrap">{type.description}</p>
                            </div>
                        </Button>
                    );
                })}
            </div>
        </DialogContent>
    </Dialog>
);


export default function Scans() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [projectName, setProjectName] = useState('');
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [selectedScanType, setSelectedScanType] = useState<ScanType | null>(null);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [isScanTypeModalOpen, setIsScanTypeModalOpen] = useState(false);
    const { isAuthenticated } = useAuth();

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'critical' | 'compliance'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    // const [activeTab, setActiveTab] = useState('new-scan');
    const [selectedDocFilter, setSelectedDocFilter] = useState<string[]>([]);
    // const [currentScanRequest, setCurrentScanRequest] = useState<ScanRequest | null>(null);

    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: scans, isLoading } = useQuery<ScanResult[]>({
        queryKey: ['scans', sortBy, sortOrder, searchQuery, selectedDocFilter],
        queryFn: () => api.get('/api/scans', {
            params: { sort: sortBy, order: sortOrder, search: searchQuery, docs: selectedDocFilter }
        }).then((res) => res.data),
        refetchOnWindowFocus: false,
        staleTime: 30000,
    });


    const { data: documents } = useQuery<DocumentItem[]>({
        queryKey: ['documents'],
        queryFn: () => api.get('/api/documents/').then((res) => res.data)
    });

    const { data: keyData } = useQuery({
        queryKey: ['openai-key-check'],
        queryFn: () => api.get('/api/user/has-openai-key').then((res) => res.data),
        retry: false,
        enabled: isAuthenticated
    });

    // Upload and analyze scan
    const uploadMutation = useMutation({
        mutationFn: async (scanRequest: ScanRequest) => {
            const response = await api.post('/api/scans/analyze', scanRequest);
            return response.data;
        },
        onSuccess: (_) => {
            // Clear form
            setProjectName('');
            setSelectedFile(null);
            setSelectedDocs([]);
            setSelectedScanType(null);

            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['scans'] });

            // Show success message
            toast({
                title: "Scan Analyzed",
                description: "The scan has been successfully analyzed.",
            });
        },
        onError: (error: any) => {
            let errorMessage = "Failed to analyze scan";

            if (error.response?.status === 401) {
                errorMessage = "Invalid API key. Please check your settings.";
            } else if (error.response?.status === 400) {
                errorMessage = "Please configure your OpenAI API key in settings first.";
            } else if (error.response?.status === 429) {
                errorMessage = "API rate limit reached. Please try again later.";
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number): Promise<void> => {
            await api.delete(`/api/scans/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scans'] });
            toast({
                title: "Scan Deleted",
                description: "The scan has been successfully deleted.",
            });
        },
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!keyData?.has_key) {
            toast({
                title: "Error",
                description: "Please configure your OpenAI API key in settings first.",
                variant: "destructive",
            });
            return;
        }

        if (!selectedFile || !selectedScanType) {
            toast({
                title: "Error",
                description: "Please select a file and scan type",
                variant: "destructive",
            });
            return;
        }

        try {
            const fileContent = await selectedFile.text();
            const trivyData = JSON.parse(fileContent);

            uploadMutation.mutate({
                project_name: projectName,
                trivy_data: trivyData,
                // openai_key: '', // The backend will use the stored key
                documents: selectedDocs,
                scan_type: selectedScanType.id
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Invalid JSON file format",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this scan?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const getTotalIssues = (severityCounts: ScanResult['severity_counts']) => {
        return Object.values(severityCounts).reduce((acc, count) => acc + count, 0);
    };


    const SearchInput: React.FC<{
        value: string;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        placeholder?: string;
        className?: string;
    }> = ({ value, onChange, placeholder, className }) => (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={cn("pl-9", className)} // Add left padding for the icon
            />
        </div>
    );

    const FilterBar: React.FC = () => {
        const { data: documents } = useQuery<DocumentItem[]>({
            queryKey: ['documents'],
            queryFn: () => api.get('/api/documents/').then((res) => res.data)
        });

        return (
            <div className="flex flex-col md:flex-row gap-4 mb-6">

                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <SortAsc className="h-4 w-4 mr-2" />
                                Sort By
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {[
                                { value: 'date', label: 'Date', icon: Clock },
                                { value: 'critical', label: 'Critical Issues', icon: AlertTriangle },
                                { value: 'compliance', label: 'Compliance Score', icon: FileWarning },
                            ].map((item) => (
                                <DropdownMenuItem
                                    key={item.value}
                                    onClick={() => setSortBy(item.value as SortByType)}
                                >
                                    <item.icon className="h-4 w-4 mr-2" />
                                    {item.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        onClick={() => setSortOrder((order: SortOrderType) =>
                            order === 'asc' ? 'desc' : 'asc'
                        )}
                    >
                        {sortOrder === 'asc' ?
                            <SortAsc className="h-4 w-4" /> :
                            <SortDesc className="h-4 w-4" />
                        }
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter Documents
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {documents?.map((doc: DocumentItem) => (
                                <DropdownMenuItem
                                    key={doc.id}
                                    onClick={() => setSelectedDocFilter(prev =>
                                        prev.includes(doc.id)
                                            ? prev.filter(id => id !== doc.id)
                                            : [...prev, doc.id]
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedDocFilter.includes(doc.id)}
                                        className="mr-2"
                                        readOnly
                                    />
                                    {doc.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        );
    };

    const DocumentUsageStats: React.FC = () => {

        const documentUsageStats: DocumentUsage[] = documents?.map((doc: DocumentItem) => ({
            id: doc.id,
            name: doc.name,
            usageCount: scans?.filter((scan: ScanResult) =>
                scan.documents?.includes(doc.id)
            ).length || 0
        })) ?? [];

        return (
            <Card className="my-6">
                <CardHeader>
                    <CardTitle>Document Usage Statistics</CardTitle>
                    <CardDescription>Overview of document usage in scans</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documentUsageStats.map((stat: DocumentUsage) => (
                            <Card key={stat.id} className="bg-muted/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <FileText className="h-4 w-4" />
                                            <span className="font-medium">{stat.name}</span>
                                        </div>
                                        <Badge>{stat.usageCount} scans</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                        <Scan className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{scans?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Across all projects</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            {scans?.reduce((acc: number, scan: ScanResult) =>
                                acc + scan.severity_counts.CRITICAL, 0
                            ) || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Across all scans</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {scans?.reduce((acc: number, scan: ScanResult) =>
                                acc + getTotalIssues(scan.severity_counts), 0
                            ) || 0}
                        </div>
                        <Progress
                            value={70}
                            className="mt-2"
                        />
                    </CardContent>
                </Card>
            </div>


            {/* New Scan Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        New Security Scan
                    </CardTitle>
                    <CardDescription>Analyze your project for security vulnerabilities</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label>Scan Type</Label>
                                <ScanTypeList selectedScanType={selectedScanType} onSelect={setSelectedScanType} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Project Name</Label>
                                    <Input
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        placeholder="e.g. frontend-app"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label>Documents</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setIsDocModalOpen(true)}
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        {selectedDocs.length ? `${selectedDocs.length} selected` : 'Select documents'}
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label>Scan Result</Label>
                                <div className="mt-2 flex items-center gap-4">
                                    <Input
                                        type="file"
                                        accept=".json"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        required
                                        className="flex-1"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={uploadMutation.isPending || !selectedScanType}
                                        className="min-w-[150px]"
                                    >
                                        {uploadMutation.isPending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Scan className="mr-2 h-4 w-4" />
                                        )}
                                        {uploadMutation.isPending ? 'Analyzing...' : 'Start Scan'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {documents?.length === 0 ? (
                <EmptyDocumentStats />
            ) : (
                <DocumentUsageStats />  // Your existing component
            )}


            <div className="flex-1">
                <SearchInput
                    placeholder="Search scans..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="w-full"
                />
            </div>

            <FilterBar />

            {/* Scan History */}
            <Card>
                <CardHeader>
                    <CardTitle>Scan History</CardTitle>
                    <CardDescription>View and manage previous scans</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <ScanSkeleton />
                            <ScanSkeleton />
                        </div>
                    ) : uploadMutation.isPending ? (
                        <div className="space-y-4">
                            <ScanSkeleton />
                            {scans?.map((scan) => (
                                <EnhancedScanDetails
                                    key={scan.id}
                                    scan={scan}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    ) : !scans?.length ? (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                No scans found. Start by uploading a Trivy scan result.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="grid gap-4">
                            {scans?.map((scan) => (
                                <EnhancedScanDetails
                                    key={scan.id}
                                    scan={scan}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <DocumentSelectionModal
                isOpen={isDocModalOpen}
                onClose={() => setIsDocModalOpen(false)}
                onConfirm={() => setIsDocModalOpen(false)}
                selectedDocs={selectedDocs}
                setSelectedDocs={setSelectedDocs}
            />

            <ScanTypeModal
                isOpen={isScanTypeModalOpen}
                onClose={() => setIsScanTypeModalOpen(false)}
                onSelectType={(type) => {
                    setSelectedScanType(type);
                    setIsScanTypeModalOpen(false);
                }}
            />

        </div>
    );
}
