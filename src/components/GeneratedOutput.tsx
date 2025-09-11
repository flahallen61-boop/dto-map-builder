import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Save, 
  Play, 
  Copy, 
  Loader2, 
  CheckCircle, 
  Code2,
  Database 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FieldMapping {
  [baseField: string]: string;
}

interface DefaultValues {
  [baseField: string]: any;
}

interface GeneratedOutputProps {
  fieldMapping: FieldMapping;
  defaults: DefaultValues;
  className: string;
}

export const GeneratedOutput = ({ fieldMapping, defaults, className }: GeneratedOutputProps) => {
  const [preview, setPreview] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);
  const [isLoadingGenerate, setIsLoadingGenerate] = useState(false);
  const { toast } = useToast();

  // Helper function to parse string values to their proper types
  const parseValue = (value: any) => {
    if (typeof value !== 'string') return value;
    
    // Parse boolean values
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Parse null
    if (value === 'null') return null;
    
    // Parse arrays (basic JSON array parsing)
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        return JSON.parse(value);
      } catch {
        return value; // Return as string if parsing fails
      }
    }
    
    // Parse objects (basic JSON object parsing)
    if (value.startsWith('{') && value.endsWith('}')) {
      try {
        return JSON.parse(value);
      } catch {
        return value; // Return as string if parsing fails
      }
    }
    
    // Parse numbers
    if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
      return Number(value);
    }
    
    return value; // Return as string for everything else
  };

  // Generate the config JSON
  const configJson = {
    b2bName: className.toLowerCase().replace(/request$/, ''),
    requestClass: `com.example.demoVersion.dto.${className}`,
    fieldMapping: {
      ...fieldMapping,
      // Always include currentLocation coordinates in fieldMapping
      ...(defaults['currentLocation.lat'] !== undefined && { 'currentLocation.lat': parseValue(defaults['currentLocation.lat']) }),
      ...(defaults['currentLocation.lng'] !== undefined && { 'currentLocation.lng': parseValue(defaults['currentLocation.lng']) })
    },
    defaults: {
      // Remove currentLocation coordinates from defaults as they should be in fieldMapping
      ...Object.fromEntries(
        Object.entries(defaults)
          .filter(([key]) => key !== 'currentLocation.lat' && key !== 'currentLocation.lng')
          .map(([key, value]) => [key, parseValue(value)])
      )
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(configJson, null, 2));
    toast({
      title: "Copied!",
      description: "Configuration copied to clipboard",
      variant: "default",
    });
  };

  const previewMapping = async () => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch('http://localhost:8083/b2b/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configJson),
      });

      if (response.ok) {
        const previewLines = await response.json();
        setPreview(previewLines);
        toast({
          title: "Preview Generated",
          description: "Constructor mapping preview generated successfully",
          variant: "default",
        });
      } else {
        throw new Error('Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Preview Failed",
        description: "Failed to generate mapping preview",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const registerMapping = async () => {
    setIsLoadingRegister(true);
    try {
      const response = await fetch('http://localhost:8083/b2b/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configJson),
      });

      if (response.ok) {
        toast({
          title: "Mapping Registered",
          description: "Field mapping registered successfully!",
          variant: "default",
        });
      } else {
        throw new Error('Failed to register mapping');
      }
    } catch (error) {
      console.error('Error registering mapping:', error);
      toast({
        title: "Registration Failed",
        description: "Failed to register mapping configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRegister(false);
    }
  };

  const generateB2BClass = async () => {
    setIsLoadingGenerate(true);
    try {
      const b2bName = configJson.b2bName;
      const response = await fetch(`http://localhost:8083/b2b/generate/${b2bName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "B2B Class Generated",
          description: result.message || "B2B class generated successfully!",
          variant: "default",
        });
      } else {
        throw new Error('Failed to generate B2B class');
      }
    } catch (error) {
      console.error('Error generating B2B class:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate B2B class",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGenerate(false);
    }
  };

  const hasMapping = Object.keys(fieldMapping).length > 0 || Object.keys(defaults).length > 0;

  return (
    <div className="space-y-6">
      {/* Configuration JSON */}
      <Card className="shadow-card gradient-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Configuration JSON</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="bg-secondary border-border hover:bg-muted"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <CardDescription className="text-muted-foreground">
            Live preview of your mapping configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="code-block overflow-auto max-h-64">
            <pre className="text-xs">
              <code>
                {JSON.stringify(configJson, null, 2)}
              </code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Constructor Preview */}
      {preview.length > 0 && (
        <Card className="shadow-card gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Code2 className="h-5 w-5 text-success" />
              Constructor Preview
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Generated constructor mapping code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="code-block overflow-auto max-h-64">
              <pre className="text-xs">
                <code>
                  {preview.map((line, index) => (
                    <div key={index} className="text-foreground">
                      {line}
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card className="shadow-card gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">API Actions</CardTitle>
          <CardDescription className="text-muted-foreground">
            Execute mapping operations on your backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={previewMapping}
              disabled={!hasMapping || isLoadingPreview}
              variant="outline"
              className="bg-secondary border-border hover:bg-muted"
            >
              {isLoadingPreview ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Preview Mapping
            </Button>

            <Button
              onClick={registerMapping}
              disabled={!hasMapping || isLoadingRegister}
              className="gradient-primary hover:shadow-glow transition-smooth"
            >
              {isLoadingRegister ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Register Mapping
            </Button>

            <Button
              onClick={generateB2BClass}
              disabled={!hasMapping || isLoadingGenerate}
              className="bg-success hover:bg-success/80 transition-smooth"
            >
              {isLoadingGenerate ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Generate B2B Class
            </Button>
          </div>

          {!hasMapping && (
            <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                No Mapping
              </Badge>
              <span className="text-sm text-muted-foreground">
                Configure field mappings or default values to enable API actions
              </span>
            </div>
          )}

          <Separator className="bg-border" />
          
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <div className="font-medium text-foreground mb-1">Mapped Fields</div>
              <div>{Object.keys(fieldMapping).length}</div>
            </div>
            <div>
              <div className="font-medium text-foreground mb-1">Default Values</div>
              <div>{Object.keys(defaults).length}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};