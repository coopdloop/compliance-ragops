// src/components/DocumentUpload.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/axios';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DocumentUpload({ isOpen, onClose }: UploadModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const queryClient = useQueryClient();

    const uploadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await api.post('/api/documents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            onClose();
            setSelectedFile(null);
        },
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData();

        // Get all form data
        formData.append('name', (form.elements.namedItem('name') as HTMLInputElement).value);
        formData.append('category', (form.elements.namedItem('category') as HTMLSelectElement).value);
        formData.append('description', (form.elements.namedItem('description') as HTMLTextAreaElement).value);
        formData.append('version', (form.elements.namedItem('version') as HTMLInputElement).value);

        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        uploadMutation.mutate(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-dark-300 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                <h3 className="text-lg font-medium text-gray-100 mb-4">Upload Compliance Document</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="w-full px-3 py-2 bg-dark-200 border border-dark-100 rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">Category</label>
                        <select
                            name="category"
                            required
                            className="w-full px-3 py-2 bg-dark-200 border border-dark-100 rounded-md"
                        >
                            <option value="COMPLIANCE">Compliance</option>
                            <option value="STANDARD">Standard</option>
                            <option value="POLICY">Policy</option>
                            <option value="FRAMEWORK">Framework</option>
                            <option value="REGULATION">Regulation</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">Description</label>
                        <textarea
                            name="description"
                            required
                            className="w-full px-3 py-2 bg-dark-200 border border-dark-100 rounded-md"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">Version</label>
                        <input
                            type="text"
                            name="version"
                            defaultValue="1.0"
                            required
                            className="w-full px-3 py-2 bg-dark-200 border border-dark-100 rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">File</label>
                        <input
                            type="file"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            required
                            accept=".json,.txt,.md,.yaml,.yml,.xml,.pdf,.doc,.docx"
                            className="w-full"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-dark-200 text-gray-300 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploadMutation.isPending}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            {uploadMutation.isPending ? (
                                <div className="flex items-center">
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    Uploading...
                                </div>
                            ) : (
                                'Upload'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
