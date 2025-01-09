// src/components/TokenManagement.tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Plus, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/axios';

interface Token {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    expires_at: string;
}

interface NewToken extends Token {
    token: string;
}

interface TokenFormData {
    name: string;
    description?: string;
    expires_in_days: number;
}

export function TokenManagement() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTokenDetails, setNewTokenDetails] = useState<NewToken | null>(null);
    const queryClient = useQueryClient();

    const { data: tokens, isLoading } = useQuery<Token[]>({
        queryKey: ['api-tokens'],
        queryFn: () => api.get('/api/service-account').then((res) => res.data),
    });

    const createTokenMutation = useMutation({
        mutationFn: (data: TokenFormData) =>
            api.post('/api/service-account', data).then((res) => res.data),
        onSuccess: (newToken) => {
            queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
            setNewTokenDetails(newToken);
            setIsCreateModalOpen(false);
        },
    });

    const deleteTokenMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/api/service-account/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            expires_in_days: parseInt(formData.get('expires_in_days') as string),
        };
        createTokenMutation.mutate(data);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // Could add a toast notification here
            console.log('Copied to clipboard');
        });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to revoke this token?')) {
            deleteTokenMutation.mutate(id);
        }
    };

    return (
        <div className="rounded-lg border border-dark-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold">API Tokens</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage your service account API tokens</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                    <Plus className="h-4 w-4" />
                    <span>Create Token</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : tokens?.length === 0 ? (
                <div className="text-center py-6">
                    <p className="text-gray-400">No API tokens created yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tokens?.map((token) => (
                        <div key={token.id} className="bg-dark-300 p-4 rounded-lg border border-dark-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-gray-300">{token.name}</h3>
                                    {token.description && (
                                        <p className="text-sm text-gray-400">{token.description}</p>
                                    )}
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs text-gray-500">
                                            Created: {new Date(token.created_at).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Expires: {new Date(token.expires_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(token.id)}
                                    className="text-red-500 hover:text-red-400"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Token Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-dark-300 p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4">Create API Token</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="w-full px-3 py-2 bg-dark-200 border border-dark-100 rounded-md"
                                    placeholder="My Service Token"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    className="w-full px-3 py-2 bg-dark-200 border border-dark-100 rounded-md"
                                    placeholder="Used for automated security scans"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Expires In (Days)
                                </label>
                                <input
                                    type="number"
                                    name="expires_in_days"
                                    defaultValue={30}
                                    className="w-full px-3 py-2 bg-dark-200 border border-dark-100 rounded-md"
                                    min={1}
                                    max={365}
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 bg-dark-200 text-gray-300 rounded-md hover:bg-dark-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createTokenMutation.isPending}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                    {createTokenMutation.isPending ? (
                                        <div className="flex items-center">
                                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                            Creating...
                                        </div>
                                    ) : (
                                        'Create Token'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Show New Token Modal */}
            {newTokenDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-dark-300 p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4">Save Your API Token</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Make sure to copy your token now. You won't be able to see it again!
                        </p>
                        <div className="bg-dark-200 p-3 rounded-md mb-4 relative group">
                            <p className="font-mono text-sm break-all pr-8">{newTokenDetails.token}</p>
                            <button
                                onClick={() => copyToClipboard(newTokenDetails.token)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                            >
                                <Copy className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="text-sm text-gray-400">
                            Expires: {new Date(newTokenDetails.expires_at).toLocaleString()}
                        </div>
                        <div className="mt-6">
                            <button
                                onClick={() => setNewTokenDetails(null)}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                I've Saved My Token
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TokenManagement;
