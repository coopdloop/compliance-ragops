// src/pages/LoginPage.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";

export function LoginPage() {
    const { login } = useAuth()
    return (

        <div className="flex items-center justify-center h-screen bg-gradient-to-b from-background to-background/80">
            <Card className="w-[400px] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse pointer-events-none" />
                <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>
                        Please OAuth2 flow to access your dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={() => login()}
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                    >
                        Log In
                    </Button>
                </CardContent>
            </Card>
        </div>

    );
}
