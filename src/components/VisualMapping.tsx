import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MapPin, Type, X, Settings } from 'lucide-react';

interface FieldMapping {
  [baseField: string]: string;
}

interface DefaultValues {
  [baseField: string]: any;
}

interface VisualMappingProps {
  schema: any;
  className: string;
  onMappingChange: (fieldMapping: FieldMapping, defaults: DefaultValues) => void;
}

// Sample BaseRequest fields - in real app this would come from your backend
const BASE_REQUEST_FIELDS = [
  {
    name: 'sourceLocation.lat',
    type: 'number',
    description: 'Source latitude coordinate'
  },
  {
    name: 'sourceLocation.lng', 
    type: 'number',
    description: 'Source longitude coordinate'
  },
  {
    name: 'sourceLocation.name',
    type: 'string',
    description: 'Source location name'
  },
  {
    name: 'sourceLocation.postcode',
    type: 'string',
    description: 'Source postal code'
  },
  {
    name: 'currentLocation.lat',
    type: 'number',
    description: 'Current latitude coordinate'
  },
  {
    name: 'currentLocation.lng',
    type: 'number', 
    description: 'Current longitude coordinate'
  },
  {
    name: 'destinationLocation.address',
    type: 'string',
    description: 'Destination full address'
  },
  {
    name: 'userType',
    type: 'string',
    description: 'Type of user making request'
  }
];

export const VisualMapping = ({ schema, className, onMappingChange }: VisualMappingProps) => {
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [defaults, setDefaults] = useState<DefaultValues>({});
  const [schemaFields, setSchemaFields] = useState<string[]>([]);

  // Extract fields from schema in dot notation
  useEffect(() => {
    const extractFields = (obj: any, prefix = ''): string[] => {
      const fields: string[] = [];
      
      if (obj && typeof obj === 'object') {
        if (obj.type === 'object' && obj.properties) {
          Object.keys(obj.properties).forEach(key => {
            const currentPath = prefix ? `${prefix}.${key}` : key;
            const property = obj.properties[key];
            
            if (property.type === 'object' && property.properties) {
              fields.push(...extractFields(property, currentPath));
            } else {
              fields.push(currentPath);
            }
          });
        }
      }
      
      return fields;
    };

    const fields = extractFields(schema);
    setSchemaFields(fields);
  }, [schema]);

  // Notify parent of changes
  useEffect(() => {
    onMappingChange(fieldMapping, defaults);
  }, [fieldMapping, defaults, onMappingChange]);

  const handleFieldMapping = (baseField: string, apiField: string) => {
    if (apiField === 'USE_DEFAULT') {
      // Switch to default value mode
      setFieldMapping(prev => {
        const newMapping = { ...prev };
        delete newMapping[baseField];
        return newMapping;
      });
    } else {
      // Map to API field
      setFieldMapping(prev => ({
        ...prev,
        [baseField]: apiField
      }));
      // Remove any default value
      setDefaults(prev => {
        const newDefaults = { ...prev };
        delete newDefaults[baseField];
        return newDefaults;
      });
    }
  };

  const handleDefaultValue = (baseField: string, value: string) => {
    setDefaults(prev => ({
      ...prev,
      [baseField]: value
    }));
  };

  const clearMapping = (baseField: string) => {
    setFieldMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[baseField];
      return newMapping;
    });
    setDefaults(prev => {
      const newDefaults = { ...prev };
      delete newDefaults[baseField];
      return newDefaults;
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'bg-syntax-string/20 text-syntax-string border-syntax-string/30';
      case 'number': return 'bg-syntax-number/20 text-syntax-number border-syntax-number/30';
      case 'boolean': return 'bg-primary/20 text-primary border-primary/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  return (
    <Card className="shadow-card gradient-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPin className="h-5 w-5 text-primary" />
          Visual Field Mapping
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Map your API schema fields to BaseRequest fields or set default values
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {BASE_REQUEST_FIELDS.map((field, index) => (
            <div key={field.name}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-sm font-medium text-foreground">
                      {field.name}
                    </div>
                    <Badge variant="outline" className={getTypeColor(field.type)}>
                      <Type className="h-3 w-3 mr-1" />
                      {field.type}
                    </Badge>
                  </div>
                  {(fieldMapping[field.name] || defaults[field.name]) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearMapping(field.name)}
                      className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {field.description}
                </p>

                <div className="space-y-2">
                  <Select
                    value={fieldMapping[field.name] || (defaults[field.name] ? 'USE_DEFAULT' : '')}
                    onValueChange={(value) => handleFieldMapping(field.name, value)}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select API field or use default..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="USE_DEFAULT" className="hover:bg-muted">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-warning" />
                          Use Default Value
                        </div>
                      </SelectItem>
                      {schemaFields.map(apiField => (
                        <SelectItem key={apiField} value={apiField} className="hover:bg-muted">
                          <span className="font-mono text-sm">{apiField}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Show default value input when USE_DEFAULT is selected */}
                  {defaults.hasOwnProperty(field.name) && (
                    <div className="space-y-1">
                      <Label htmlFor={`default-${field.name}`} className="text-xs text-muted-foreground">
                        Default Value
                      </Label>
                      <Input
                        id={`default-${field.name}`}
                        placeholder={`Enter default ${field.type} value...`}
                        value={defaults[field.name] || ''}
                        onChange={(e) => handleDefaultValue(field.name, e.target.value)}
                        className="bg-warning/10 border-warning/30 text-sm"
                      />
                    </div>
                  )}

                  {/* Show current mapping */}
                  {fieldMapping[field.name] && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Mapped to:</span>
                      <code className="bg-success/20 text-success px-2 py-1 rounded font-mono">
                        {fieldMapping[field.name]}
                      </code>
                    </div>
                  )}
                </div>
              </div>
              
              {index < BASE_REQUEST_FIELDS.length - 1 && (
                <Separator className="mt-4 bg-border" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};