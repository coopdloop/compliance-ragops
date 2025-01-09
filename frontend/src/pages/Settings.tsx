// src/pages/Settings.tsx
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { TokenManagement } from '@/components/TokenManagement';
import { api } from '@/lib/axios';
import { OpenAIKeyManager } from '@/components/OpenAIKeyManager';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Shield,
  Key,
  Lock,
  ExternalLink,
  Save,
  X,
  Edit2,
  AlertCircle
} from 'lucide-react';

interface ProfileUpdateData {
  name: string;
  jobTitle: string;
  department: string;
}

export default function Settings() {
  const [editMode, setEditMode] = useState(false);
  const { user, loading } = useAuth();

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileUpdateData) =>
      api.patch('/api/user/profile', data).then((res) => res.data),
    onSuccess: () => {
      setEditMode(false);
    },
  });

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name') as string,
      jobTitle: formData.get('jobTitle') as string,
      department: formData.get('department') as string,
    };
    updateProfileMutation.mutate(data);
  };

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load user information. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        {user?.['https://your-namespace/role'] && (
          <Badge variant="secondary" className="text-blue-500 bg-blue-500/10">
            {user['https://your-namespace/role']}
          </Badge>
        )}
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </div>
            {!editMode ? (
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
                className="flex items-center"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="flex items-center gap-6">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt="Profile"
                  className="h-20 w-20 rounded-full ring-2 ring-muted"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center ring-2 ring-muted">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Profile photo managed through {user?.sub?.split('|')[0]}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={user?.name}
                  readOnly={!editMode}
                  className={!editMode ? "bg-muted" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email managed through {user?.sub?.split('|')[0]}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Job Title
                </Label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  defaultValue={user?.['https://your-namespace/jobTitle'] || 'Security Engineer'}
                  readOnly={!editMode}
                  className={!editMode ? "bg-muted" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Department
                </Label>
                <Input
                  id="department"
                  name="department"
                  defaultValue={user?.['https://your-namespace/department'] || 'Security Operations'}
                  readOnly={!editMode}
                  className={!editMode ? "bg-muted" : ""}
                />
              </div>
            </div>

            {editMode && (
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditMode(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updateProfileMutation.isPending ? (
                    <LoadingSpinner />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Manage your account security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  2FA is managed through {user?.sub?.split('|')[0]}
                </p>
              </div>
              <Button
                variant="outline"
                asChild
                className="flex items-center"
              >
                <a
                  href={`https://${import.meta.env.VITE_AUTH0_DOMAIN}/u/mfa-enrollment`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage 2FA
                </a>
              </Button>
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Password</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Password is managed through {user?.sub?.split('|')[0]}
              </p>
              <Button
                variant="outline"
                asChild
                className="flex items-center"
              >
                <a
                  href={`https://${import.meta.env.VITE_AUTH0_DOMAIN}/u/reset-password`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OpenAI API Settings */}
      <Card>
        <CardHeader>
          <CardTitle>API Settings</CardTitle>
          <CardDescription>
            Configure your API integrations and access keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OpenAIKeyManager />
        </CardContent>
      </Card>

      {/* Token Management */}
      <div id="token-management-section">
        <TokenManagement />
      </div>
    </div>
  );
}
