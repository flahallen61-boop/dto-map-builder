import { useState, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, ChevronRight, ChevronDown, Settings2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

interface SchemaProperty {
  id: string;
  name: string;
  type: 'string' | 'number' | 'integer' | 'short' | 'boolean' | 'object';
  required: boolean;
  properties?: SchemaProperty[];
  isOpen?: boolean;
}

interface SchemaBuilderProps {
  onSchemaGenerated: (schema: string) => void;
}

export interface SchemaBuilderRef {
  getCurrentSchema: () => string;
}

export const SchemaBuilder = forwardRef<SchemaBuilderRef, SchemaBuilderProps>(({ onSchemaGenerated }, ref) => {
  const [properties, setProperties] = useState<SchemaProperty[]>([]);

  useImperativeHandle(ref, () => ({
    getCurrentSchema: () => {
      const schema = generateJsonSchema(properties);
      return JSON.stringify(schema, null, 2);
    }
  }));

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addProperty = (parentId?: string) => {
    const newProperty: SchemaProperty = {
      id: generateId(),
      name: '',
      type: 'string',
      required: true,
      properties: [],
      isOpen: false
    };

    if (parentId) {
      setProperties(prev => updateNestedProperty(prev, parentId, (parent) => ({
        ...parent,
        properties: [...(parent.properties || []), newProperty]
      })));
    } else {
      setProperties(prev => [...prev, newProperty]);
    }
  };

  const updateNestedProperty = (
    props: SchemaProperty[], 
    targetId: string, 
    updater: (prop: SchemaProperty) => SchemaProperty
  ): SchemaProperty[] => {
    return props.map(prop => {
      if (prop.id === targetId) {
        return updater(prop);
      }
      if (prop.properties && prop.properties.length > 0) {
        return {
          ...prop,
          properties: updateNestedProperty(prop.properties, targetId, updater)
        };
      }
      return prop;
    });
  };

  const removeNestedProperty = (props: SchemaProperty[], targetId: string): SchemaProperty[] => {
    return props.filter(prop => prop.id !== targetId).map(prop => ({
      ...prop,
      properties: prop.properties ? removeNestedProperty(prop.properties, targetId) : undefined
    }));
  };

  const updateProperty = (id: string, field: keyof SchemaProperty, value: any) => {
    setProperties(prev => updateNestedProperty(prev, id, (prop) => ({
      ...prop,
      [field]: value,
      // Reset properties if type changes from object
      ...(field === 'type' && value !== 'object' ? { properties: [] } : {})
    })));
  };

  const removeProperty = (id: string) => {
    setProperties(prev => removeNestedProperty(prev, id));
  };

  const toggleProperty = (id: string) => {
    setProperties(prev => updateNestedProperty(prev, id, (prop) => ({
      ...prop,
      isOpen: !prop.isOpen
    })));
  };

  const generateJsonSchema = (props: SchemaProperty[]): any => {
    const schema: any = {
      type: 'object',
      properties: {}
    };

    props.forEach(prop => {
      if (!prop.name) return;

      switch (prop.type) {
        case 'object':
          schema.properties[prop.name] = {
            type: 'object',
            ...generateJsonSchema(prop.properties || [])
          };
          break;
        default:
          schema.properties[prop.name] = {
            type: prop.type
          };
      }
    });

    return schema;
  };

  const handleGenerateSchema = () => {
    const schema = generateJsonSchema(properties);
    const schemaString = JSON.stringify(schema, null, 2);
    onSchemaGenerated(schemaString);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      string: 'bg-blue-500/10 text-blue-600 border-blue-200',
      number: 'bg-green-500/10 text-green-600 border-green-200',
      integer: 'bg-green-500/10 text-green-600 border-green-200',
      short: 'bg-green-500/10 text-green-600 border-green-200',
      boolean: 'bg-orange-500/10 text-orange-600 border-orange-200',
      object: 'bg-purple-500/10 text-purple-600 border-purple-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/10 text-gray-600 border-gray-200';
  };

  const renderProperty = (property: SchemaProperty, level: number = 0) => {
    const indent = level * 20;

    return (
      <div key={property.id} className="mb-3">
        <div 
          className="bg-card rounded-lg border border-border p-4 hover:shadow-sm transition-shadow"
          style={{ marginLeft: `${indent}px` }}
        >
          <div className="flex items-center gap-3 mb-3">
            {property.type === 'object' && (
              <div className="mt-6">
                <Collapsible open={property.isOpen} onOpenChange={() => toggleProperty(property.id)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1 h-8 w-8 hover:bg-muted">
                      {property.isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              </div>
            )}
            
            <div className="flex-1">
              <Label htmlFor={`name-${property.id}`} className="text-sm font-medium text-foreground">
                Property Name
              </Label>
              <Input
                id={`name-${property.id}`}
                placeholder="Enter property name"
                value={property.name}
                onChange={(e) => updateProperty(property.id, 'name', e.target.value)}
                className="mt-1 h-9 bg-background border-input"
              />
            </div>
            
            <div className="w-32">
              <Label htmlFor={`type-${property.id}`} className="text-sm font-medium text-foreground">
                Type
              </Label>
              <Select
                value={property.type}
                onValueChange={(value) => updateProperty(property.id, 'type', value)}
              >
                <SelectTrigger className="mt-1 h-9 bg-background border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="integer">Integer</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="object">Object</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <Badge variant="outline" className={getTypeColor(property.type)}>
                {property.type}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeProperty(property.id)}
                className="p-1 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {property.type === 'object' && (
            <Collapsible open={property.isOpen}>
              <CollapsibleContent>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="space-y-3">
                    {property.properties?.map(subProp => renderProperty(subProp, level + 1))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addProperty(property.id)}
                      className="w-full h-9 border-dashed hover:bg-muted"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Nested Property
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-card gradient-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Settings2 className="h-5 w-5 text-primary" />
          Schema Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {properties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">No properties added yet</p>
              <p className="text-xs">Click "Add Property" to get started</p>
            </div>
          ) : (
            properties.map(property => renderProperty(property))
          )}
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => addProperty()}
            className="flex-1 h-10 bg-secondary border-border hover:bg-muted"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
          
          <Button
            onClick={handleGenerateSchema}
            disabled={properties.length === 0 || properties.some(p => !p.name)}
            className="flex-1 h-10 gradient-primary hover:shadow-glow transition-smooth"
          >
            Generate Schema
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});