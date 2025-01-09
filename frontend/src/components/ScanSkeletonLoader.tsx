import { Card, CardContent } from '@/components/ui/card';

const ScanSkeleton = () => (
    <Card className="bg-muted/50 animate-pulse">
        <CardContent className="p-4">
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-5 w-48 bg-muted-foreground/20 rounded" />
                        <div className="h-4 w-36 bg-muted-foreground/20 rounded" />
                    </div>
                    <div className="h-8 w-8 bg-muted-foreground/20 rounded" />
                </div>
                <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-6 w-24 bg-muted-foreground/20 rounded" />
                    ))}
                </div>
                <div className="h-32 bg-muted-foreground/20 rounded" />
            </div>
        </CardContent>
    </Card>
);

export { ScanSkeleton };
