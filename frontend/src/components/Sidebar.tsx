import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FileText,
    Scan,
    Settings,
    Menu,
    Home,
    CloudCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeSwitcher } from './ThemeSwitcher';

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { title: 'Dashboard', href: '/', icon: Home },
    { title: 'Documents', href: '/documents', icon: FileText },
    { title: 'Scans', href: '/scans', icon: Scan },
    { title: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    return (
        <div className={cn(
            "flex flex-col fixed left-0 top-0 h-full bg-background border-r transition-all duration-300",
            isCollapsed ? "w-16" : "w-64"
        )}>
            <div className="p-4 flex items-center justify-between">
                <div className={cn("flex items-center gap-2", isCollapsed && "hidden")}>
                    <CloudCog className="h-6 w-6 text-primary" />
                    <span className="font-bold text-xl">HypeComply</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <Menu className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1 py-4">
                <nav className="space-y-2 px-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors",
                                location.pathname === item.href && "bg-muted text-primary font-medium"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.title}</span>}
                        </Link>
                    ))}
                </nav>
            </ScrollArea>

            <div className="p-4 border-t">
                <ThemeSwitcher isCollapsed={isCollapsed} />
            </div>
        </div>
    );
};

