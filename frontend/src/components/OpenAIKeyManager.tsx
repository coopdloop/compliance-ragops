// src/components/OpenAIKeyManager.tsx
import { useState } from 'react';
import { Loader2, Eye, EyeOff, CheckIcon, XIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

interface OpenAIKeyStatus {
  has_key: boolean;
}

interface OpenAIKeyUpdateResponse {
  message: string;
}

export function OpenAIKeyManager() {
  const [isEditing, setIsEditing] = useState(false);
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const queryClient = useQueryClient();

  const { data: keyStatus, isLoading } = useQuery<OpenAIKeyStatus, Error>({
    queryKey: ['openai-key-status'],
    queryFn: async () => {
      const response = await api.get<OpenAIKeyStatus>('/api/user/has-openai-key');
      return response.data;
    },
  });

  const updateKeyMutation = useMutation<
    OpenAIKeyUpdateResponse,
    Error,
    string
  >({
    mutationFn: async (openai_key: string) => {
      const response = await api.post<OpenAIKeyUpdateResponse>('/api/user/openai-key', { openai_key });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openai-key-status'] });
      setIsEditing(false);
      setKey('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="pt-6 border-t border-dark-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">OpenAI API Key</h3>
          <p className="text-sm text-gray-400">
            Required for document processing and analysis
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {keyStatus?.has_key ? 'Update Key' : 'Add Key'}
          </button>
        )}
      </div>

      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateKeyMutation.mutate(key);
          }}
          className="space-y-4"
        >
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-dark-300 border border-dark-100 rounded-md pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showKey ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setKey('');
              }}
              className="px-4 py-2 bg-dark-200 text-gray-300 rounded-md hover:bg-dark-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateKeyMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {updateKeyMutation.isPending ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </div>
              ) : (
                'Save Key'
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-sm flex gap-2">
          {keyStatus?.has_key ?
            <div className="flex items-center">
              <CheckIcon className="text-green-200"/>
              <p className="text-green-400">OpenAI key is set</p>
            </div>
            :
            <div className="flex items-center">
              <XIcon className="text-red-200"/>
              <p className="text-red-400">OpenAI key not set</p>
            </div>

          }
        </div>
      )}
    </div>
  );
}
