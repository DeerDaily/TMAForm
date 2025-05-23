
"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
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
  const submissionLock = useRef(false);

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
          fieldSchema = z.coerce.number(); 
           if (!field.required) fieldSchema = fieldSchema.optional().default(field.default ?? undefined);
          break;
        case 'boolean':
          fieldSchema = z.boolean().default(field.default as boolean ?? false);
          break;
        case 'date':
          fieldSchema = z.string(); 
          if (field.required) fieldSchema = fieldSchema.min(1, { message: `${field.label} is required.` });
          else fieldSchema = fieldSchema.optional().default(field.default ?? '');
          break;
        case 'multiselect':
          fieldSchema = z.array(z.string());
          if (field.required) fieldSchema = fieldSchema.nonempty({ message: `${field.label} is required (select at least one option).` });
          else fieldSchema = fieldSchema.optional().default(field.default as string[] ?? []);
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
    mode: "onChange", 
  });

  useEffect(() => {
    if (decodedParams) {
        formMethods.reset(
            decodedParams.form.reduce((acc, field) => {
              acc[field.key] = field.default ?? 
                               (field.type === 'boolean' ? false : 
                                field.type === 'number' ? undefined : 
                                field.type === 'multiselect' ? [] : 
                                '');
              return acc;
            }, {} as Record<string, any>),
            { keepDefaultValues: false } 
          );
        formMethods.trigger(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedParams, formMethods.reset, formMethods.trigger]);


  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      tg.MainButton.setText("Submit");
      if (tg.themeParams.button_color && tg.themeParams.button_text_color) {
        tg.MainButton.setParams({
          color: tg.themeParams.button_color,
          text_color: tg.themeParams.button_text_color,
        });
      }
      
      setWebApp(tg);
    } else {
      console.warn("Telegram WebApp SDK not found. Running in standalone mode.");
    }

    const titleEnc = searchParams.get('title');
    const formEnc = searchParams.get('form');
    const callbackUrlEnc = searchParams.get('callbackUrl');
    const descriptionEnc = searchParams.get('description');
    const metadataEnc = searchParams.get('metadata');
    const signatureEnc = searchParams.get('signature');

    const missingParamsMessages: string[] = [];
    if (!titleEnc) missingParamsMessages.push("- `title`: (String, Mandatory) The main title for the form.");
    if (!formEnc) missingParamsMessages.push("- `form`: (String, Mandatory) A JSON string representing an array of field definition objects.");
    if (!callbackUrlEnc) missingParamsMessages.push("- `callbackUrl`: (String, Mandatory) The absolute URL to which the collected form data will be POSTed.");
    
    if (missingParamsMessages.length > 0) {
      const fullErrorMessage = "Invalid or missing critical form parameters. Please ensure the URL includes the following parameters, correctly base64url encoded:\n\n" +
                               missingParamsMessages.join("\n");
      setErrorMessage(fullErrorMessage);
      setAppState('paramError');
      return;
    }

    try {
      const title = base64UrlDecode(titleEnc!);
      const formStr = base64UrlDecode(formEnc!);
      const callbackUrl = base64UrlDecode(callbackUrlEnc!);
      let description: string | undefined = undefined;
      let metadata: string | undefined = undefined;
      let signature: string | undefined = undefined;

      if (descriptionEnc) {
        try { description = base64UrlDecode(descriptionEnc); } 
        catch (e) { console.warn("Failed to decode description, proceeding without it."); }
      }
      if (metadataEnc) {
        try { metadata = base64UrlDecode(metadataEnc); }
        catch (e) { console.warn("Failed to decode metadata, proceeding without it."); }
      }
      if (signatureEnc) {
        try { signature = base64UrlDecode(signatureEnc); }
        catch (e) { console.warn("Failed to decode signature, proceeding without it."); }
      }
      
      let parsedFormJson: any;
      try {
        parsedFormJson = JSON.parse(formStr);
      } catch (jsonParseError: any) {
        setErrorMessage(`Form structure is invalid: 'form' parameter is not a valid JSON string.\nDetails: ${jsonParseError.message}\nExpected: A JSON array of field objects, e.g., [ { "key": "name", ... }, ... ]`);
        setAppState('paramError');
        return;
      }

      if (!Array.isArray(parsedFormJson)) {
        setErrorMessage("Form structure is invalid: The 'form' definition must be a JSON array of field objects.\nExample: [ { \"key\": \"name\", ... }, { \"key\": \"email\", ... } ]");
        setAppState('paramError');
        return;
      }

      const formFields = parsedFormJson as FormFieldDefinition[];

      for (let i = 0; i < formFields.length; i++) {
        const field = formFields[i];
        if (typeof field !== 'object' || field === null) {
          setErrorMessage(`Form structure is invalid: Field definition at index ${i} is not a valid object.\nExpected: Each item in the 'form' array must be a field definition object.`);
          setAppState('paramError');
          return;
        }

        if (!field.key || typeof field.key !== 'string' || field.key.trim() === '') {
          setErrorMessage(`Form structure is invalid: Field definition at index ${i} (Label: "${field.label || 'N/A'}") is missing a 'key' or 'key' is not a non-empty string.\nExpected: Each field must have a unique string 'key'. Example: { "key": "firstName", "label": "First Name", "type": "string" }`);
          setAppState('paramError');
          return;
        }

        if (!field.label || typeof field.label !== 'string' || field.label.trim() === '') {
          setErrorMessage(`Form structure is invalid: Field definition for key "${field.key}" (Index: ${i}) is missing a 'label' or 'label' is not a non-empty string.\nExpected: Each field must have a display 'label'. Example: { "key": "${field.key}", "label": "Your Label", "type": "string" }`);
          setAppState('paramError');
          return;
        }

        const validTypes = ['string', 'number', 'boolean', 'date', 'email', 'tel', 'select', 'multiselect'];
        if (!field.type || typeof field.type !== 'string' || !validTypes.includes(field.type)) {
          setErrorMessage(`Form structure is invalid: Field definition for key "${field.key}" (Label: "${field.label}", Index: ${i}) has a missing or invalid 'type'.\nExpected: 'type' must be one of: ${validTypes.join(', ')}. Example: { "key": "${field.key}", "label": "${field.label}", "type": "string" }`);
          setAppState('paramError');
          return;
        }

        if (field.type === 'select' || field.type === 'multiselect') {
          if (!field.options || !Array.isArray(field.options) || field.options.length === 0 || field.options.some(opt => typeof opt !== 'string')) {
            setErrorMessage(`Form structure is invalid: Field definition for key "${field.key}" (Label: "${field.label}", Type: '${field.type}', Index: ${i}) is missing 'options', 'options' is not a non-empty array of strings, or contains non-string values.\nExpected: 'options' must be an array of strings. Example: { ..., "type": "${field.type}", "options": ["Option 1", "Option 2"] }`);
            setAppState('paramError');
            return;
          }
        }
        
        if (field.required !== undefined && typeof field.required !== 'boolean') {
          setErrorMessage(`Form structure is invalid: Field definition for key "${field.key}" (Label: "${field.label}", Index: ${i}) has an invalid 'required' property.\nExpected: If provided, 'required' must be a boolean (true or false).`);
          setAppState('paramError');
          return;
        }

        if (field.default !== undefined) {
            const defaultType = typeof field.default;
            let expectedTypeMessage = '';
            let typeMatch = false;

            switch(field.type) {
                case 'string': case 'email': case 'tel': case 'date':
                    typeMatch = defaultType === 'string';
                    expectedTypeMessage = `a string for type '${field.type}'.`;
                    break;
                case 'number':
                    typeMatch = defaultType === 'number';
                    expectedTypeMessage = `a number for type 'number'.`;
                    break;
                case 'boolean':
                    typeMatch = defaultType === 'boolean';
                    expectedTypeMessage = `a boolean (true or false) for type 'boolean'.`;
                    break;
                case 'select':
                    const optionsArray = field.options as string[] | undefined;
                    typeMatch = defaultType === 'string' && !!optionsArray && optionsArray.includes(field.default as string);
                    if (defaultType !== 'string') {
                        expectedTypeMessage = `a string for type 'select'.`;
                    } else if (!optionsArray) {
                         expectedTypeMessage = `a string, but 'options' array is missing for this select field.`;
                    } else if (!optionsArray.includes(field.default as string)) {
                        expectedTypeMessage = `a string value that exists in its 'options' array ([${optionsArray.join(', ')}]) for type 'select'. Current default: "${field.default}".`;
                    }
                    break;
                case 'multiselect':
                    const multiSelectOptions = field.options as string[] | undefined;
                    if (Array.isArray(field.default)) {
                        const allDefaultsAreStrings = field.default.every(item => typeof item === 'string');
                        const allDefaultsInOptions = field.default.every(item => multiSelectOptions?.includes(item as string));
                        typeMatch = allDefaultsAreStrings && allDefaultsInOptions;

                        if (!allDefaultsAreStrings) {
                            expectedTypeMessage = `an array of strings for type 'multiselect'. One or more items in the default array are not strings.`;
                        } else if (!multiSelectOptions) {
                            expectedTypeMessage = `an array of strings, but 'options' array is missing for this multiselect field.`;
                        } else if (!allDefaultsInOptions) {
                            const missingDefaults = field.default.filter(item => !multiSelectOptions.includes(item as string));
                            expectedTypeMessage = `an array of string values that all exist in its 'options' array ([${multiSelectOptions.join(', ')}]) for type 'multiselect'. The following default values are not in options: "${missingDefaults.join('", "')}".`;
                        }
                    } else {
                        typeMatch = false;
                        expectedTypeMessage = `an array of strings for type 'multiselect'. Current default type: '${defaultType}'.`;
                    }
                    break;
            }

            if (!typeMatch) {
                setErrorMessage(`Form structure is invalid: Field definition for key "${field.key}" (Label: "${field.label}", Index: ${i}) has a 'default' value of type '${defaultType === 'object' && Array.isArray(field.default) ? 'array' : defaultType}' but expected ${expectedTypeMessage}`);
                setAppState('paramError');
                return;
            }
        }
      }

      setDecodedParams({ title, form: formFields, callbackUrl, description, metadata, metadataEnc, signature, signatureEnc });
      setAppState('formDisplay');

    } catch (error: any) { 
      console.error("Parameter decoding error or unhandled validation case:", error);
      const specificErrorMessage = error.message && (error.message.startsWith("Form structure is invalid:") || error.message.startsWith("Invalid or missing critical form parameters") || error.message === "Invalid base64url string") ? error.message : "Failed to initialize form due to an unexpected error in parameter processing.";
      setErrorMessage(specificErrorMessage);
      setAppState('paramError');
    }
  }, [searchParams]);


  const handleFormSubmit = useCallback(async (formData: any) => {
    if (!decodedParams || !webApp || submissionLock.current) return;

    submissionLock.current = true;
    setAppState('submitting');
    webApp.MainButton.showProgress(true);
    webApp.MainButton.disable();

    const payload = {
      form: formData,
      ...(decodedParams.metadata && { metadata: decodedParams.metadataEnc }),
      ...(decodedParams.signature && { signature: decodedParams.signatureEnc }),
    };

    try {
      const response = await fetch(decodedParams.callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setAppState('success');
        webApp.MainButton.hide();
        webApp.HapticFeedback.notificationOccurred('success');
        // submissionLock remains true as we transition to a final state
      } else {
        const errorText = await response.text();
        throw new Error(`Submission failed: ${response.status} ${errorText || response.statusText}`);
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      const submissionErrorMessage = error.message || "Submission Failed. Please try again later.";
      setErrorMessage(submissionErrorMessage);
      setAppState('error'); 
      webApp.HapticFeedback.notificationOccurred('error');
      webApp.MainButton.hideProgress();
      webApp.MainButton.setText("Retry"); 
      webApp.MainButton.enable(); 
      submissionLock.current = false; // Release lock for retry
      toast({
        title: "Submission Error",
        description: submissionErrorMessage,
        variant: "destructive",
      });
    }
  }, [decodedParams, webApp, toast]);

  const onMainButtonClick = useCallback(() => {
    if (formMethods) {
      formMethods.handleSubmit(handleFormSubmit)();
    }
  }, [formMethods, handleFormSubmit]);


  useEffect(() => {
    if (!webApp || !decodedParams || appState !== 'formDisplay') {
      if (webApp?.MainButton.isVisible) webApp.MainButton.hide();
      return;
    }
    
    webApp.MainButton.setText("Submit");
    webApp.MainButton.show();

    if (formMethods.formState.isValid && !formMethods.formState.isSubmitting && !submissionLock.current) {
        webApp.MainButton.enable();
    } else {
        webApp.MainButton.disable();
    }
        
    // Prefer onEvent/offEvent if available for robust listener management
    if (typeof webApp.onEvent === 'function' && typeof webApp.offEvent === 'function') {
        webApp.onEvent('mainButtonClicked', onMainButtonClick);
        return () => {
            webApp.offEvent('mainButtonClicked', onMainButtonClick);
        };
    } else {
        // Fallback to MainButton.onClick, assuming it replaces the handler
        console.warn("Using MainButton.onClick as onEvent/offEvent are not available in this Telegram WebApp version. Ensure SDK handles listener replacement correctly.");
        webApp.MainButton.onClick(onMainButtonClick);
        return () => {
            // Attempt to clear by setting to a no-op if MainButton.offClick is available or if no other cleanup method.
            // This part is speculative as offClick is not standard on MainButton itself.
            if (typeof webApp.MainButton.offClick === 'function') {
              try {
                // It's important that the same function reference is passed to offClick
                // However, the original code had a new function in useEffect, so direct offClick might not work as expected without stable reference
                // This might not effectively remove the listener if onMainButtonClick was not the exact one registered
                webApp.MainButton.offClick(onMainButtonClick); 
              } catch (e) {
                // Some SDK versions might throw if offClick is not fully implemented
                console.warn("Error calling MainButton.offClick", e);
                 webApp.MainButton.onClick(() => {}); // Last resort: set to no-op
              }
            } else {
              // If no offClick, setting to no-op to potentially clear the previous one,
              // though this relies on onClick overwriting behavior.
              webApp.MainButton.onClick(() => {});
            }
        };
    }
    
  }, [webApp, decodedParams, appState, formMethods.formState.isValid, formMethods.formState.isSubmitting, onMainButtonClick]);


  if (appState === 'loading' || (!decodedParams && appState !== 'paramError')) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-secondary/30">
        <Card className="p-8 shadow-xl rounded-xl border-border/60 backdrop-blur-md bg-card/80">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-semibold text-primary">Loading Form...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pt-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (appState === 'paramError') return <ErrorDisplay message={errorMessage} />;
  if (appState === 'success') return <SuccessDisplay />;
  if (appState === 'error') return <ErrorDisplay message={errorMessage} onClose={() => { submissionLock.current = false; webApp?.close();}} />; 

  if (appState === 'formDisplay' && decodedParams) {
    return (
      <TeleFormRenderer
        title={decodedParams.title}
        description={decodedParams.description}
        fields={decodedParams.form}
        formMethods={formMethods}
        onSubmit={handleFormSubmit} // This will be wrapped by RHF's handleSubmit
      />
    );
  }
  
  return <ErrorDisplay message="An unexpected error occurred. Please try closing and reopening." />;
}


export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-secondary/30">
        <Card className="p-8 shadow-xl rounded-xl border-border/60 backdrop-blur-md bg-card/80">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-semibold text-primary">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pt-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    }>
      <TeleFormPageContent />
    </Suspense>
  );
}

