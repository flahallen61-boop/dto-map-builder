import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SchemaProperty {
  id: string;
  name: string;
  type: 'string' | 'number' | 'integer' | 'short' | 'boolean' | 'object' | 'array';
  required: boolean;
  properties?: SchemaProperty[];
  isOpen?: boolean;
}

interface SchemaBuilderProps {
  onSchemaGenerated: (schema: string) => void;
}

export const SchemaBuilder = ({ onSchemaGenerated }: SchemaBuilderProps) => {
  const [properties, setProperties] = useState<SchemaProperty[]>([]);

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
      properties: {},
      required: []
    };

    props.forEach(prop => {
      if (!prop.name) return;

      if (prop.required) {
        schema.required.push(prop.name);
      }

      switch (prop.type) {
        case 'object':
          schema.properties[prop.name] = {
            type: 'object',
            ...generateJsonSchema(prop.properties || [])
          };
          break;
        case 'array':
          schema.properties[prop.name] = {
            type: 'array',
            items: { type: 'string' } // Default to string array
          };
          break;
        case 'integer':
        case 'short':
          schema.properties[prop.name] = {
            type: 'number',
            format: prop.type
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

  const renderProperty = (property: SchemaProperty, level: number = 0) => {
    const indent = level * 24;

    return (
      <div key={property.id} style={{ marginLeft: `${indent}px` }} className="border-l border-border pl-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          {property.type === 'object' && (
            <Collapsible open={property.isOpen} onOpenChange={() => toggleProperty(property.id)}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                  {property.isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
          
          <Input
            placeholder="Property name"
            value={property.name}
            onChange={(e) => updateProperty(property.id, 'name', e.target.value)}
            className="flex-1 h-8"
          />
          
          <Select
            value={property.type}
            onValueChange={(value) => updateProperty(property.id, 'type', value)}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="integer">Integer</SelectItem>
              <SelectItem value="short">Short</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="object">Object</SelectItem>
              <SelectItem value="array">Array</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeProperty(property.id)}
            className="p-1 h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {property.type === 'object' && (
          <Collapsible open={property.isOpen}>
            <CollapsibleContent>
              <div className="ml-4 space-y-2">
                {property.properties?.map(subProp => renderProperty(subProp, level + 1))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addProperty(property.id)}
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Property
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  };

  return (
    <Card className="shadow-card gradient-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Schema Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {properties.map(property => renderProperty(property))}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => addProperty()}
            className="bg-secondary border-border hover:bg-muted"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
          
          <Button
            onClick={handleGenerateSchema}
            disabled={properties.length === 0 || properties.some(p => !p.name)}
            className="gradient-primary hover:shadow-glow transition-smooth"
          >
            Generate Schema
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};