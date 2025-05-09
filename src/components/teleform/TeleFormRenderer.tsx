
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
          {description && <CardDescription className="text-base mt-2">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <Form {...formMethods}>
            <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8"> {/* Increased spacing from space-y-6 */}
              {fields.map((field) => {
                let controlElement: React.ReactNode;

                switch (field.type) {
                  case 'string':
                    controlElement = <Input type="text" {...formMethods.register(field.key)} defaultValue={field.default as string ?? ''} />;
                    break;
                  case 'number':
                    controlElement = <Input type="number" {...formMethods.register(field.key, { valueAsNumber: true })} defaultValue={field.default as number ?? undefined} />;
                    break;
                  case 'email':
                    controlElement = <Input type="email" {...formMethods.register(field.key)} defaultValue={field.default as string ?? ''} />;
                    break;
                  case 'tel':
                    controlElement = <Input type="tel" {...formMethods.register(field.key)} defaultValue={field.default as string ?? ''} />;
                    break;
                  case 'date':
                    controlElement = <Input type="date" {...formMethods.register(field.key)} defaultValue={field.default as string ?? ''} />;
                    break;
                  case 'boolean':
                    controlElement = (
                      <Checkbox
                        checked={formMethods.watch(field.key)}
                        onCheckedChange={(checked) => formMethods.setValue(field.key, checked, { shouldValidate: true, shouldDirty: true })}
                        defaultChecked={field.default as boolean ?? false}
                        className="mt-3" // Align checkbox vertically considering standard input height (h-10 vs h-4 for checkbox)
                      />
                    );
                    break;
                  case 'select':
                    if (field.options) {
                      controlElement = (
                        <Select 
                          onValueChange={(value) => formMethods.setValue(field.key, value, { shouldValidate: true, shouldDirty: true })} 
                          defaultValue={field.default as string ?? undefined}
                          value={formMethods.watch(field.key)}
                        >
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
                      );
                    } else {
                      controlElement = <Input type="text" {...formMethods.register(field.key)} defaultValue={field.default as string ?? ''} placeholder="Select (no options provided)" disabled />;
                    }
                    break;
                  default:
                    // Fallback for unsupported types, or could throw an error
                    controlElement = <Input type="text" {...formMethods.register(field.key)} defaultValue={field.default as string ?? ''} placeholder={`Unsupported field type: ${field.type}`} disabled />;
                }

                return (
                  <FormField
                    key={field.key}
                    control={formMethods.control}
                    name={field.key}
                    render={({ field: rhfField }) => ( // rhfField is used here for RHF context, actual value/onChange is managed above for clarity
                      <FormItem className="space-y-1">
                        <FormLabel className="text-lg">
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </FormLabel>
                        <FormControl>
                          {/*
                            The actual input element (controlElement) is passed here.
                            For RHF integration with setValue/watch, the {...rhfField} spread isn't fully used
                            on the controlElement itself if we manage state with watch/setValue.
                            However, FormField and FormControl setup RHF context correctly.
                            For direct RHF binding, we'd pass {...rhfField} to each actual input type.
                            The current switch structure has manually registered or uses watch/setValue.
                            Let's ensure `rhfField` is correctly used if needed by the specific ShadCN component.
                            For Checkbox and Select, `onValueChange` and `checked`/`value` are used.
                            For Input, `...formMethods.register(field.key)` is more direct.
                            The `render` prop from `FormField` provides `field` which has `onChange, onBlur, value, name, ref`.
                            So, the switch should use `rhfField` properties.
                          */}
                           {field.type === 'string' && <Input type="text" {...rhfField} value={rhfField.value ?? ''} />}
                           {field.type === 'number' && <Input type="number" {...rhfField} value={rhfField.value ?? ''} onChange={e => rhfField.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />}
                           {field.type === 'email' && <Input type="email" {...rhfField} value={rhfField.value ?? ''} />}
                           {field.type === 'tel' && <Input type="tel" {...rhfField} value={rhfField.value ?? ''} />}
                           {field.type === 'date' && <Input type="date" {...rhfField} value={rhfField.value ?? ''} />}
                           {field.type === 'boolean' && (
                              <Checkbox
                                checked={rhfField.value}
                                onCheckedChange={rhfField.onChange}
                                className="mt-3"
                              />
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
                           {/* Render placeholder for unhandled or misconfigured types */}
                           {!['string', 'number', 'email', 'tel', 'date', 'boolean'].includes(field.type) && field.type !== 'select' && (
                             <Input type="text" value={`Unsupported type: ${field.type}`} disabled />
                           )}
                           {field.type === 'select' && !field.options && (
                             <Input type="text" value="Select (no options)" disabled />
                           )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}
              {/* Submit button is handled by Telegram MainButton, no actual button here */}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeleFormRenderer;
