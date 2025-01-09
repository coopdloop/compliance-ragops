import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Breadcrumbs } from './Breadcrumbs';
import { Toaster } from './ui/toaster';
import { useAuth } from '@/providers/AuthProvider';
import { setupApiInterceptors } from '@/lib/axios';
import { LoginPage } from '@/pages/LoginPage';

export const PageLayout = ({ children }: { children: React.ReactNode }) => {
    const { getToken, isAuthenticated } = useAuth();

    useEffect(() => {
        setupApiInterceptors(getToken);
    }, [getToken]);

    return (
        <div className="min-h-screen bg-background">
            {isAuthenticated ?
                <>
                    <Sidebar />
                    <div className="pl-64">
                        <Navbar />
                        <main className="pt-20 px-4 pb-8">
                            <Breadcrumbs />
                            <div >
                                {children}
                            </div>
                        </main>
                        <Toaster />
                    </div>
                </>
                :
                <LoginPage />
            }
        </div>
    );
};
