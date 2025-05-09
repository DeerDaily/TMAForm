
"use client";

import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription as ShadcnCardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Renamed to avoid conflict
import type { FormFieldDefinition } from '@/lib/types';

interface TeleFormRendererProps {
  title: string;
  description?: string;
  fields: FormFieldDefinition[];
  formMethods: UseFormReturn<any>;
  onSubmit: (data: any) => void;
}

const TeleFormRenderer: FC<TeleFormRendererProps> = ({ title, description, fields, formMethods, onSubmit }) => {
  return (
    <div className="min-h-screen p-4 flex flex-col items-center bg-background">
      <Card className="w-full max-w-2xl shadow-xl rounded-xl border-border/60 bg-card mt-8 mb-8">
        <CardHeader className="text-center border-b border-border/30 pb-6">
          <CardTitle className="text-3xl font-bold text-primary">{title}</CardTitle>
          {description && <ShadcnCardDescription className="text-base mt-2 text-muted-foreground px-4">{description}</ShadcnCardDescription>}
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <Form {...formMethods}>
            <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8">
              {fields.map((field) => (
                <FormField
                  key={field.key}
                  control={formMethods.control}
                  name={field.key}
                  render={({ field: rhfField }) => (
                    <FormItem className="space-y-2 p-1 rounded-md">
                      <FormLabel className="text-lg font-semibold text-foreground">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </FormLabel>
                      <FormControl>
                        {(() => {
                          switch (field.type) {
                            case 'string':
                              return <Input type="text" {...rhfField} value={rhfField.value ?? ''} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-input focus:bg-background text-base" />;
                            case 'number':
                              return <Input type="number" {...rhfField} value={rhfField.value ?? ''} onChange={e => rhfField.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-input focus:bg-background text-base" />;
                            case 'email':
                              return <Input type="email" {...rhfField} value={rhfField.value ?? ''} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-input focus:bg-background text-base" />;
                            case 'tel':
                              return <Input type="tel" {...rhfField} value={rhfField.value ?? ''} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-input focus:bg-background text-base" />;
                            case 'date':
                              return <Input type="date" {...rhfField} value={rhfField.value ?? ''} placeholder={`Select ${field.label.toLowerCase()}`} className="bg-input focus:bg-background text-base appearance-none" />;
                            case 'boolean':
                              return (
                                <div className="h-10 flex items-center space-x-2 pt-1">
                                  <Checkbox
                                    {...rhfField}
                                    checked={rhfField.value ?? false}
                                    onCheckedChange={rhfField.onChange}
                                    id={rhfField.name} // Explicitly pass id for label association
                                  />
                                  {/* Label is already provided by FormLabel above, no need to repeat here unless specific for checkbox text */}
                                </div>
                              );
                            case 'select':
                              if (field.options) {
                                return (
                                  <Select
                                    onValueChange={rhfField.onChange}
                                    value={rhfField.value}
                                    defaultValue={field.default as string ?? undefined}
                                  >
                                    <SelectTrigger className="bg-input focus:bg-background text-base">
                                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover/95 backdrop-blur-sm">
                                      {field.options.map((option) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                );
                              }
                              return <Input type="text" value="Select (no options provided)" disabled className="bg-muted/50"/>;
                            case 'multiselect':
                              if (field.options) {
                                return (
                                  <div className="space-y-3 pt-1">
                                    {field.options.map((option) => (
                                      <FormItem key={option} className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md border border-input bg-input/50 hover:bg-input/70 transition-colors">
                                        <FormControl>
                                          <Checkbox
                                            checked={(Array.isArray(rhfField.value) ? rhfField.value : []).includes(option)}
                                            onCheckedChange={(checked) => {
                                              const currentValues = Array.isArray(rhfField.value) ? rhfField.value : [];
                                              if (checked) {
                                                rhfField.onChange([...currentValues, option]);
                                              } else {
                                                rhfField.onChange(currentValues.filter((value) => value !== option));
                                              }
                                            }}
                                            id={`${rhfField.name}-${option}`}
                                          />
                                        </FormControl>
                                        <FormLabel htmlFor={`${rhfField.name}-${option}`} className="text-base font-normal text-foreground/90 cursor-pointer flex-grow">
                                          {option}
                                        </FormLabel>
                                      </FormItem>
                                    ))}
                                  </div>
                                );
                              }
                              return <Input type="text" value="Multiselect (no options provided)" disabled className="bg-muted/50"/>;
                            default:
                              return <Input type="text" value={`Unsupported type: ${field.type}`} disabled className="bg-muted/50"/>;
                          }
                        })()}
                      </FormControl>
                      <FormMessage className="text-destructive text-sm" />
                    </FormItem>
                  )}
                />
              ))}
              {/* Submit button is handled by Telegram MainButton, no actual button here */}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeleFormRenderer;
