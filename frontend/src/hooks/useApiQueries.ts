// src/hooks/useApiQueries.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { DashboardStats, AIRecommendation, ComplianceTrend, AIModel, DetailedAnalytics } from '@/types/types';
import { useAuth } from '@/providers/AuthProvider';

export const useAIRecommendations = () => {
    const { getToken, isAuthenticated } = useAuth();

    return useQuery<AIRecommendation[]>({
        queryKey: ['aiRecommendations'],
        queryFn: async () => {
            const token = await getToken();
            const response = await api.get('/api/ai/recommendations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        },
        enabled: isAuthenticated,
        retry: false
    });
};

export const useComplianceTrends = () => {
    const { getToken, isAuthenticated } = useAuth();

    return useQuery<ComplianceTrend[]>({
        queryKey: ['complianceTrends'],
        queryFn: async () => {
            const token = await getToken();
            const response = await api.get('/api/compliance/trends', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        },
        enabled: isAuthenticated,
        retry: false
    });
};

export const useAIModels = () => {
    const { getToken, isAuthenticated } = useAuth();

    return useQuery<AIModel[]>({
        queryKey: ['aiModels'],
        queryFn: async () => {
            const token = await getToken();
            const response = await api.get('/api/ai/models', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        },
        enabled: isAuthenticated,
        retry: false
    });
};

export const useDashboardStats = () => {
    const { getToken, isAuthenticated } = useAuth();

    return useQuery<DashboardStats>({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const token = await getToken();
            const response = await api.get('/api/statistics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        },
        enabled: isAuthenticated,
        retry: false
    });
};

export const useDetailedAnalytics = () => {
    const { getToken, isAuthenticated } = useAuth();
    return useQuery<DetailedAnalytics>({
        queryKey: ['detailedAnalytics'],
        queryFn: async () => {
            try {
                const token = await getToken();
                const response = await api.get('/api/analytics/detailed', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                return response.data;
            } catch (error) {
                // Provide a fallback default object when the endpoint is not available
                return {
                    totalProcessed: 0,
                    avgProcessingTime: 0,
                    errorRate: 0,
                    peakPerformance: 'N/A'
                };
            }
        },
        enabled: isAuthenticated,
        retry: 1, // Minimal retry in case of temporary network issues
        // Provide fallback data for when the query fails completely
        placeholderData: {
            totalProcessed: 0,
            avgProcessingTime: 0,
            errorRate: 0,
            peakPerformance: 'N/A'
        }
    });
};
