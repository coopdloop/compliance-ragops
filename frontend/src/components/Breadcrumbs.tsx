import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/" className="hover:text-foreground transition-colors">
        Home
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="h-4 w-4" />
            <Link
              to={routeTo}
              className={cn(
                "capitalize",
                isLast ? "text-foreground font-medium" : "hover:text-foreground transition-colors"
              )}
            >
              {name}
            </Link>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
