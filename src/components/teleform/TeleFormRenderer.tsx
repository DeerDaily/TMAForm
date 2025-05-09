"use client";

import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen p-4 flex flex-col items-center bg-gradient-to-br from-background to-secondary/30">
      <Card className="w-full max-w-2xl shadow-xl rounded-xl border-border/60 backdrop-blur-md bg-card/80 mt-8 mb-8">
        <CardHeader className="text-center border-b border-border/30 pb-6">
          <CardTitle className="text-3xl font-bold text-primary">{title}</CardTitle>
          {description && <CardDescription className="text-base mt-2 text-muted-foreground px-4">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <Form {...formMethods}>
            <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-6">
              {fields.map((field) => (
                <FormField
                  key={field.key}
                  control={formMethods.control}
                  name={field.key}
                  render={({ field: rhfField }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-base font-medium text-foreground/90">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </FormLabel>
                      <FormControl>
                        {(() => {
                          switch (field.type) {
                            case 'string':
                              return <Input type="text" {...rhfField} value={rhfField.value ?? ''} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-background/70 focus:bg-background" />;
                            case 'number':
                              return <Input type="number" {...rhfField} value={rhfField.value ?? ''} onChange={e => rhfField.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-background/70 focus:bg-background" />;
                            case 'email':
                              return <Input type="email" {...rhfField} value={rhfField.value ?? ''} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-background/70 focus:bg-background" />;
                            case 'tel':
                              return <Input type="tel" {...rhfField} value={rhfField.value ?? ''} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-background/70 focus:bg-background" />;
                            case 'date':
                              return <Input type="date" {...rhfField} value={rhfField.value ?? ''} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-background/70 focus:bg-background" />;
                            case 'boolean':
                              // The FormControl's Slot will pass id to this Checkbox.
                              // FormItem handles spacing. Added a small top margin for better visual alignment with the label.
                              return (
                                <div className="h-10 flex items-center"> 
                                  <Checkbox
                                    {...rhfField}
                                    checked={rhfField.value ?? false}
                                    onCheckedChange={rhfField.onChange}
                                    // id will be passed by FormControl's Slot
                                  />
                                </div>
                              );
                            case 'select':
                              if (field.options) {
                                return (
                                  <Select
                                    onValueChange={rhfField.onChange}
                                    value={rhfField.value} // RHF controls the value
                                  >
                                    <SelectTrigger className="bg-background/70 focus:bg-background"> {/* id will be passed by FormControl's Slot */}
                                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover/90 backdrop-blur-sm">
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
                            default:
                              return <Input type="text" value={`Unsupported type: ${field.type}`} disabled className="bg-muted/50"/>;
                          }
                        })()}
                      </FormControl>
                      <FormMessage />
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
