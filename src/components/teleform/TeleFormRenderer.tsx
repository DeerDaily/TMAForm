
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
  onSubmit: (data: any) => void; // This is the actual submission logic
}

const TeleFormRenderer: FC<TeleFormRendererProps> = ({ title, description, fields, formMethods, onSubmit }) => {
  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <Card className="w-full max-w-2xl shadow-xl rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{title}</CardTitle>
          {description && <CardDescription className="text-md mt-2">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <Form {...formMethods}>
            <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-6">
              {fields.map((field) => (
                <FormField
                  key={field.key}
                  control={formMethods.control}
                  name={field.key}
                  render={({ field: rhfField }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-lg">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </FormLabel>
                      <FormControl>
                        <div> {/* Replaced <> with <div> to accept props from FormControl */}
                          {field.type === 'string' && <Input type="text" {...rhfField} value={rhfField.value ?? ''} />}
                          {field.type === 'number' && <Input type="number" {...rhfField} value={rhfField.value ?? ''} onChange={e => rhfField.onChange(e.target.valueAsNumber)} />}
                          {field.type === 'email' && <Input type="email" {...rhfField} value={rhfField.value ?? ''} />}
                          {field.type === 'tel' && <Input type="tel" {...rhfField} value={rhfField.value ?? ''} />}
                          {field.type === 'date' && <Input type="date" {...rhfField} value={rhfField.value ?? ''} />}
                          {field.type === 'boolean' && (
                            <div className="flex items-center space-x-2 pt-2">
                              <Checkbox
                                id={`${field.key}-checkbox`}
                                checked={rhfField.value}
                                onCheckedChange={rhfField.onChange}
                              />
                              <label
                                htmlFor={`${field.key}-checkbox`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Yes {/* Consider making this customizable or removing if label is sufficient */}
                              </label>
                            </div>
                          )}
                          {field.type === 'select' && field.options && (
                            <Select onValueChange={rhfField.onChange} defaultValue={rhfField.value} value={rhfField.value}>
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
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
