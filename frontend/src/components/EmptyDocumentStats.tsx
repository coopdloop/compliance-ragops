import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Box, FileText, FileType, Shield, Upload } from "lucide-react";
import { Badge } from "./ui/badge";
import { useNavigate } from 'react-router-dom';

const EmptyDocumentStats = () => {
  const navigate = useNavigate();

  const exampleCategories = [
    { name: "Security Policies", count: 0, icon: Shield },
    { name: "Compliance Controls", count: 0, icon: FileText },
    { name: "Audit Reports", count: 0, icon: FileType },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Usage Statistics</CardTitle>
        <CardDescription>Track how documents are being used in scans</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="text-center max-w-md">
            <Box className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Documents Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start by adding compliance documents to track their usage across security scans.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full">
            {exampleCategories.map((category) => (
              <Card key={category.name} className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between opacity-50">
                    <div className="flex items-center space-x-2">
                      <category.icon className="h-4 w-4" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <Badge>{category.count} scans</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={() => navigate('/documents')}>
            <Upload className="mr-2 h-4 w-4" />
           Navigate to Documents
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


export default EmptyDocumentStats;
