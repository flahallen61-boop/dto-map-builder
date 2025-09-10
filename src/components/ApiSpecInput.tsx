import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, Code, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiSpecInputProps {
  onSchemaSubmit: (schema: any, className: string) => void;
}

export const ApiSpecInput = ({ onSchemaSubmit }: ApiSpecInputProps) => {
  const [schema, setSchema] = useState('');
  const [className, setClassName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const { toast } = useToast();

  const validateJson = (jsonString: string) => {
    try {
      if (!jsonString.trim()) {
        setIsValid(null);
        return null;
      }
      const parsed = JSON.parse(jsonString);
      setIsValid(true);
      return parsed;
    } catch {
      setIsValid(false);
      return null;
    }
  };

  const handleSchemaChange = (value: string) => {
    setSchema(value);
    validateJson(value);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSchema(content);
        validateJson(content);
      };
      reader.readAsText(file);
    }
  };

  const beautifyJson = () => {
    try {
      if (!schema.trim()) return;
      const parsed = JSON.parse(schema);
      const beautified = JSON.stringify(parsed, null, 2);
      setSchema(beautified);
      setIsValid(true);
      toast({
        title: "JSON Beautified",
        description: "Your JSON has been formatted successfully!",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Cannot beautify invalid JSON. Please check your syntax.",
        variant: "destructive",
      });
    }
  };

  const generateDTOs = async () => {
    if (!schema || !className || !isValid) return;

    setIsLoading(true);
    try {
      const parsedSchema = JSON.parse(schema);
      
      const response = await fetch(`http://localhost:8083/api/dto/generate?className=${className}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedSchema),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "DTOs Generated",
          description: result.message || "DTO classes generated successfully!",
          variant: "default",
        });
        
        // Pass the schema to parent component for mapping
        onSchemaSubmit(parsedSchema, className);
      } else {
        throw new Error('Failed to generate DTOs');
      }
    } catch (error) {
      console.error('Error generating DTOs:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate DTOs. Using local schema for mapping.",
        variant: "destructive",
      });
      
      // Fallback: use local schema for mapping
      try {
        const parsedSchema = JSON.parse(schema);
        onSchemaSubmit(parsedSchema, className);
      } catch {
        toast({
          title: "Invalid Schema",
          description: "Please provide a valid JSON schema.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-card gradient-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Code className="h-5 w-5 text-primary" />
          API Schema Input
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Paste your JSON schema or upload a file to generate DTOs and start mapping
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="className" className="text-foreground">Class Name</Label>
          <Input
            id="className"
            placeholder="e.g., BdcRequest, GoogleMapsRequest"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="schema" className="text-foreground">JSON Schema</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={beautifyJson}
                disabled={!schema.trim()}
                className="bg-secondary border-border hover:bg-muted"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Beautify
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="bg-secondary border-border hover:bg-muted"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              {isValid === true && (
                <CheckCircle className="h-4 w-4 text-success" />
              )}
              {isValid === false && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
          <Textarea
            id="schema"
            placeholder={`{
  "type": "object",
  "properties": {
    "origin": {
      "type": "object",
      "properties": {
        "lat": { "type": "number" },
        "lng": { "type": "number" }
      }
    },
    "destination": {
      "type": "object", 
      "properties": {
        "address": { "type": "string" }
      }
    }
  }
}`}
            value={schema}
            onChange={(e) => handleSchemaChange(e.target.value)}
            className="min-h-[200px] font-mono text-sm bg-code-bg border-code-border"
          />
        </div>

        <Button
          onClick={generateDTOs}
          disabled={!schema || !className || !isValid || isLoading}
          className="w-full gradient-primary hover:shadow-glow transition-smooth"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating DTOs...
            </>
          ) : (
            <>
              <Code className="h-4 w-4 mr-2" />
              Generate DTOs & Start Mapping
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};