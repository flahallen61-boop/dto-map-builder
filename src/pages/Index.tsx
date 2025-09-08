import { useState } from 'react';
import { ApiSpecInput } from '@/components/ApiSpecInput';
import { VisualMapping } from '@/components/VisualMapping';
import { GeneratedOutput } from '@/components/GeneratedOutput';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Workflow } from 'lucide-react';

interface FieldMapping {
  [baseField: string]: string;
}

interface DefaultValues {
  [baseField: string]: any;
}

const Index = () => {
  const [schema, setSchema] = useState<any>(null);
  const [className, setClassName] = useState<string>('');
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [defaults, setDefaults] = useState<DefaultValues>({});

  const handleSchemaSubmit = (submittedSchema: any, submittedClassName: string) => {
    setSchema(submittedSchema);
    setClassName(submittedClassName);
  };

  const handleMappingChange = (newFieldMapping: FieldMapping, newDefaults: DefaultValues) => {
    setFieldMapping(newFieldMapping);
    setDefaults(newDefaults);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Workflow className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">API Schema Mapper</h1>
                <p className="text-sm text-muted-foreground">
                  Map external APIs to BaseRequest DTOs
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              Development Tool
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column - Input and Mapping */}
          <div className="space-y-6">
            {/* Step 1: Schema Input */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground font-bold text-sm">
                  1
                </div>
                <h2 className="text-lg font-semibold text-foreground">Import Schema</h2>
              </div>
              <ApiSpecInput onSchemaSubmit={handleSchemaSubmit} />
            </div>

            {/* Step Arrow */}
            {schema && (
              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-primary animate-pulse" />
              </div>
            )}

            {/* Step 2: Visual Mapping */}
            {schema && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Configure Mapping</h2>
                </div>
                <VisualMapping
                  schema={schema}
                  className={className}
                  onMappingChange={handleMappingChange}
                />
              </div>
            )}
          </div>

          {/* Right Column - Output and Actions */}
          {schema && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground font-bold text-sm">
                  3
                </div>
                <h2 className="text-lg font-semibold text-foreground">Generate & Deploy</h2>
              </div>
              <GeneratedOutput
                fieldMapping={fieldMapping}
                defaults={defaults}
                className={className}
              />
            </div>
          )}
        </div>

        {/* Flow Guide */}
        {!schema && (
          <div className="mt-16 text-center space-y-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h3 className="font-semibold text-foreground">Import Schema</h3>
                  <p className="text-muted-foreground">
                    Paste your JSON schema or upload a file to generate DTOs
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h3 className="font-semibold text-foreground">Map Fields</h3>
                  <p className="text-muted-foreground">
                    Visually map API fields to BaseRequest or set defaults
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h3 className="font-semibold text-foreground">Deploy</h3>
                  <p className="text-muted-foreground">
                    Preview, register, and generate your B2B integration class
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;