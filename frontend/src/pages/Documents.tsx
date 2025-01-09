// src/pages/Documents.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FileText, Trash2, Eye, Upload, UploadCloud, Filter, Box, PlusCircle, FileType } from 'lucide-react';
import { api } from '@/lib/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

interface DocumentItem {
  id: string;
  name: string;
  category: 'COMPLIANCE' | 'STANDARD' | 'POLICY' | 'FRAMEWORK' | 'REGULATION';
  description: string;
  version: string;
  file_type: string;
  created_at: string;
}

interface CategorySection {
  id: string;
  title: string;
  category: DocumentItem['category'];
}

const categories: CategorySection[] = [
  { id: 'compliance', title: 'Compliance', category: 'COMPLIANCE' },
  { id: 'standard', title: 'Standards', category: 'STANDARD' },
  { id: 'policy', title: 'Policies', category: 'POLICY' },
  { id: 'framework', title: 'Frameworks', category: 'FRAMEWORK' },
  { id: 'regulation', title: 'Regulations', category: 'REGULATION' },
];

interface DocumentCardProps {
  doc: DocumentItem;
  onView: (doc: DocumentItem) => void;
  onDelete: (id: string) => void;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

const EmptyState = ({ onUpload }: { onUpload: () => void }) => (
  <Card className="w-full py-12">
    <CardContent className="flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Box className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        Get started by uploading your first document. We support various file formats including PDF, DOC, and more.
      </p>
      <Button onClick={onUpload}>
        <PlusCircle className="w-4 h-4 mr-2" />
        Upload Your First Document
      </Button>
    </CardContent>
  </Card>
);

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, onView, onDelete }) => (
  <Card className="group transition-all hover:shadow-lg border-primary/10">
    <CardHeader className="space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg mt-1">
            <FileType className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{doc.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">v{doc.version}</Badge>
              <Badge
                variant="secondary"
                className={cn(
                  doc.category === 'COMPLIANCE' && 'bg-blue-100 text-blue-800',
                  doc.category === 'STANDARD' && 'bg-green-100 text-green-800',
                  doc.category === 'POLICY' && 'bg-purple-100 text-purple-800',
                  doc.category === 'FRAMEWORK' && 'bg-orange-100 text-orange-800',
                  doc.category === 'REGULATION' && 'bg-red-100 text-red-800'
                )}
              >
                {doc.category}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
        {doc.description}
      </p>
    </CardContent>
    <CardFooter className="flex items-center justify-between bg-muted/5 pt-4">
      <div className="text-sm text-muted-foreground">
        Added {new Date(doc.created_at).toLocaleDateString()}
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(doc)}
          className="hover:bg-primary/10"
        >
          <Eye className="h-4 w-4 mr-2" /> View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(doc.id)}
          className="hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
      </div>
    </CardFooter>
  </Card>
);

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  onFileSelect,
  selectedFile
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Upload Document</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              name="name"
              required
              className="w-full"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <Select name="category" required disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.category}>
                    {cat.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              name="description"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Version</label>
            <Input
              name="version"
              defaultValue="1.0"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label className="text-sm font-medium">File</label>
            <div
              className={cn(
                "mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed",
                "px-6 py-8 transition-colors",
                selectedFile
                  ? "border-primary/50 bg-primary/5"
                  : "border-muted-foreground/25",
                isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="text-center">
                {selectedFile ? (
                  <>
                    <FileText className="mx-auto h-12 w-12 text-primary" />
                    <p className="mt-2 text-sm font-medium text-primary">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4 flex flex-col items-center text-sm">
                      <label className="relative cursor-pointer rounded-md font-semibold text-primary hover:text-primary/80">
                        <span>Click to upload</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".json,.txt,.md,.yaml,.yml,.xml,.pdf,.doc,.docx"
                          required
                          disabled={isPending}
                          onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supported formats: JSON, TXT, MD, YAML, XML, PDF, DOC
                      </p>
                    </div>
                  </>
                )}
                {selectedFile && !isPending && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => onFileSelect(null)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove file
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || !selectedFile}
          >
            {isPending ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);

export default function Documents() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery<DocumentItem[]>({
    queryKey: ['documents'],
    queryFn: () => api.get('/api/documents').then((res) => res.data),
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/api/documents', formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsUploadModalOpen(false);
      setSelectedFile(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();

    formData.append('name', (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value);
    formData.append('category', (e.currentTarget.elements.namedItem('category') as HTMLSelectElement).value);
    formData.append('description', (e.currentTarget.elements.namedItem('description') as HTMLTextAreaElement).value);
    formData.append('version', (e.currentTarget.elements.namedItem('version') as HTMLInputElement).value || '1.0');
    // FastAPI expects 'file' as the field name for UploadFile
    formData.append('file', selectedFile);

    // Add proper error handling
    try {
      await uploadMutation.mutateAsync(formData);
      setIsUploadModalOpen(false)
    } catch (error) {
      console.error('Upload error:', error);
      // You might want to show an error toast here
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = async (document: DocumentItem) => {
    try {
      const response = await api.get(`/api/documents/${document.id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a'); // Now explicitly using window.document
      link.href = url;
      link.setAttribute('download', document.name);
      window.document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  // Handle file selection separately
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  const filteredDocuments = documents?.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Manage and organize your compliance documents
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search documents..."
              className="w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Upload Document
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="all" className="rounded-md">All Documents</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id} className="rounded-md">
              {cat.title}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-6">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-4" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !filteredDocuments?.length ? (
            <EmptyState onUpload={() => setIsUploadModalOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onView={handleView}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Category tabs */}
        {categories.map(cat => (
          <TabsContent key={cat.id} value={cat.id} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {!filteredDocuments?.filter(doc => doc.category === cat.category).length ? (
                <EmptyState onUpload={() => setIsUploadModalOpen(true)} />
              ) : (
                filteredDocuments
                  ?.filter(doc => doc.category === cat.category)
                  .map(doc => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onView={handleView}
                      onDelete={handleDelete}
                    />
                  ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
        }}
        onSubmit={handleSubmit}
        onFileSelect={handleFileSelect}
        isPending={uploadMutation.isPending}
        selectedFile={selectedFile}
      />
    </div>
  );
}
