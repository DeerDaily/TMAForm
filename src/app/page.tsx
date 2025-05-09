"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { base64UrlDecode } from '@/lib/utils';
import type { FormFieldDefinition, DecodedFormParams, TelegramWebApp } from '@/lib/types';
import TeleFormRenderer from '@/components/teleform/TeleFormRenderer';
import ErrorDisplay from '@/components/teleform/ErrorDisplay';
import SuccessDisplay from '@/components/teleform/SuccessDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


type AppState = 'loading' | 'paramError' | 'formDisplay' | 'submitting' | 'success' | 'error';

function TeleFormPageContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [appState, setAppState] = useState<AppState>('loading');
  const [decodedParams, setDecodedParams] = useState<DecodedFormParams | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);

  const generateValidationSchema = (fields: FormFieldDefinition[]) => {
    const schemaObject: Record<string, z.ZodTypeAny> = {};
    fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;
      switch (field.type) {
        case 'string':
        case 'select':
          fieldSchema = z.string();
          if (field.required) fieldSchema = fieldSchema.min(1, { message: `${field.label} is required.` });
          else fieldSchema = fieldSchema.optional().default(field.default ?? '');
          break;
        case 'email':
          fieldSchema = z.string();
          if (field.required) fieldSchema = fieldSchema.min(1, { message: `${field.label} is required.` }).email({ message: "Invalid email address." });
          else fieldSchema = fieldSchema.optional().default(field.default ?? '').or(z.literal('').transform(() => undefined)).refine(val => val === undefined || z.string().email().safeParse(val).success, { message: "Invalid email address." });
          break;
        case 'tel':
          fieldSchema = z.string();
          if (field.required) fieldSchema = fieldSchema.min(1, { message: `${field.label} is required.` }).regex(/^\+?[0-9\s-()]*$/, "Invalid phone number.");
          else fieldSchema = fieldSchema.optional().default(field.default ?? '').or(z.literal('').transform(() => undefined)).refine(val => val === undefined || z.string().regex(/^\+?[0-9\s-()]*$/).safeParse(val).success, { message: "Invalid phone number." });
          break;
        case 'number':
          fieldSchema = z.coerce.number(); // Coerce to number
           if (!field.required) fieldSchema = fieldSchema.optional().default(field.default ?? undefined);
          // For required number, zod makes it non-optional by default. If default is 0, it's fine.
          // If required and default is not set, it must be provided.
          break;
        case 'boolean':
          fieldSchema = z.boolean().default(field.default as boolean ?? false);
          break;
        case 'date':
          fieldSchema = z.string(); // Input type="date" returns "YYYY-MM-DD"
          if (field.required) fieldSchema = fieldSchema.min(1, { message: `${field.label} is required.` });
          else fieldSchema = fieldSchema.optional().default(field.default ?? '');
          break;
        default:
          fieldSchema = z.any();
      }
      schemaObject[field.key] = fieldSchema;
    });
    return z.object(schemaObject);
  };
  
  const formMethods = useForm<any>({
    resolver: decodedParams ? zodResolver(generateValidationSchema(decodedParams.form)) : undefined,
    mode: "onChange", // Validate on change to enable/disable MainButton
  });

  useEffect(() => {
    if (decodedParams) {
        formMethods.reset(
            decodedParams.form.reduce((acc, field) => {
              acc[field.key] = field.default ?? (field.type === 'boolean' ? false : field.type === 'number' ? undefined: '');
              return acc;
            }, {} as Record<string, any>),
            { keepDefaultValues: false } 
          );
        formMethods.trigger(); // Trigger validation after reset for MainButton state
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedParams, formMethods.reset, formMethods.trigger]);


  useEffect(() => {
    // Initialize Telegram WebApp
    if (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      // tg.enableClosingConfirmation(); // Good for production
      
      // Apply theme from Telegram
      document.documentElement.style.setProperty('--background-hsl', tg.themeParams.bg_color || '210 20% 96%');
      document.documentElement.style.setProperty('--foreground-hsl', tg.themeParams.text_color || '220 10% 20%');
      // You might need to convert hex to HSL if you want to use HSL variables extensively

      setWebApp(tg);
    } else {
      console.warn("Telegram WebApp SDK not found. Running in standalone mode.");
      // For local development, allow proceeding if query params are faked
    }

    // Decode parameters
    const titleEnc = searchParams.get('title');
    const formEnc = searchParams.get('form');
    const callbackUrlEnc = searchParams.get('callbackUrl');
    const descriptionEnc = searchParams.get('description');

    if (!titleEnc || !formEnc || !callbackUrlEnc) {
      setErrorMessage("Invalid or missing critical form parameters.");
      setAppState('paramError');
      return;
    }

    try {
      const title = base64UrlDecode(titleEnc);
      const formStr = base64UrlDecode(formEnc);
      const callbackUrl = base64UrlDecode(callbackUrlEnc);
      let description: string | undefined = undefined;

      if (descriptionEnc) {
        try {
          description = base64UrlDecode(descriptionEnc);
        } catch (e) {
          console.warn("Failed to decode description, proceeding without it.");
        }
      }
      
      const form = JSON.parse(formStr) as FormFieldDefinition[];
      if (!Array.isArray(form) || form.some(f => !f.key || !f.label || !f.type)) {
          throw new Error("Form structure is invalid.");
      }

      setDecodedParams({ title, form, callbackUrl, description });
      setAppState('formDisplay');
    } catch (error: any) {
      console.error("Parameter decoding/parsing error:", error);
      setErrorMessage(error.message || "Failed to initialize form. Invalid parameters.");
      setAppState('paramError');
    }
  }, [searchParams]);


  const handleFormSubmit = useCallback(async (data: any) => {
    if (!decodedParams || !webApp) return;

    setAppState('submitting');
    webApp.MainButton.showProgress(true);
    webApp.MainButton.disable();

    try {
      const response = await fetch(decodedParams.callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setAppState('success');
        webApp.MainButton.hide();
        webApp.HapticFeedback.notificationOccurred('success');
      } else {
        const errorText = await response.text();
        throw new Error(`Submission failed: ${response.status} ${errorText || response.statusText}`);
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      setErrorMessage(error.message || "Submission Failed. Please try again later.");
      setAppState('error'); // This state will show ErrorDisplay
      webApp.HapticFeedback.notificationOccurred('error');
      webApp.MainButton.hideProgress();
      webApp.MainButton.setText("Retry"); // Or keep "Submit"
      webApp.MainButton.enable(); // Allow retry
      toast({
        title: "Submission Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [decodedParams, webApp, errorMessage, toast]);


  useEffect(() => {
    if (!webApp || !decodedParams || appState !== 'formDisplay') {
      if (webApp?.MainButton.isVisible) webApp.MainButton.hide();
      return;
    }
    
    webApp.MainButton.setText("Submit");
    webApp.MainButton.show();

    if (formMethods.formState.isValid && !formMethods.formState.isSubmitting) {
        webApp.MainButton.enable();
    } else {
        webApp.MainButton.disable();
    }
    
    const onClick = () => formMethods.handleSubmit(handleFormSubmit)();
    webApp.MainButton.onClick(onClick);

    return () => {
      // Important: Remove listener to avoid multiple submissions if component re-renders.
      // The Telegram SDK might not have a simple removeListener for onClick.
      // A common pattern is to set it to a no-op or handle this carefully.
      // For simplicity here, we re-assign on each relevant effect run.
      // If issues arise, an intermediate variable or ref for the callback could be used.
      webApp.MainButton.offClick(onClick); // Assuming offClick exists or similar. If not, this needs care.
                                           // If no offClick, ensure onClick is idempotent or managed.
                                           // A common workaround is to set a new empty function if offClick is not available:
                                           // webApp.MainButton.onClick(() => {}); 
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webApp, decodedParams, appState, formMethods.formState.isValid, formMethods.formState.isSubmitting, handleFormSubmit]);


  if (appState === 'loading' || !decodedParams && appState !== 'paramError') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Loading Form...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (appState === 'paramError') return <ErrorDisplay message={errorMessage} />;
  if (appState === 'success') return <SuccessDisplay />;
  if (appState === 'error') return <ErrorDisplay message={errorMessage} onClose={() => webApp?.close()} />; // Provide an explicit close for retry failure

  if (appState === 'formDisplay' && decodedParams) {
    return (
      <TeleFormRenderer
        title={decodedParams.title}
        description={decodedParams.description}
        fields={decodedParams.form}
        formMethods={formMethods}
        onSubmit={handleFormSubmit}
      />
    );
  }
  
  // Fallback for any unhandled state, though ideally not reached.
  return <ErrorDisplay message="An unexpected error occurred. Please try closing and reopening." />;
}


export default function Page() {
  // Suspense is required by Next.js for useSearchParams hook
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    }>
      <TeleFormPageContent />
    </Suspense>
  );
}

