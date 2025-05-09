
export interface FormFieldDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'tel' | 'select' | 'multiselect';
  default?: string | number | boolean | string[];
  options?: string[];
  required?: boolean;
}

export interface DecodedFormParams {
  title: string;
  form: FormFieldDefinition[];
  callbackUrl: string;
  description?: string;
  metadata?: string; // Added
  signature?: string; // Added
  metadataEnc?: string; // Added
  signatureEnc?: string; // Added
}

// Minimal Telegram WebApp types to avoid adding new dependencies if not allowed
// For a full experience, consider using @types/telegram-web-app
export interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => void;
  onClick: (callback: () => void) => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  showProgress: (disable?: boolean) => void;
  hideProgress: () => void;
  setParams: (params: any) => void;
  // It's good practice to assume an offClick or similar might exist for cleanup,
  // though not explicitly in all minimal typings. Actual SDK might provide via onEvent/offEvent.
  offClick?: (callback: () => void) => void; 
}

export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: TelegramMainButton;
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  themeParams: Record<string, string>;
  colorScheme: 'light' | 'dark';
  setHeaderColor: (colorKey: string) => void;
  setBackgroundColor: (colorKey: string) => void;
  initDataUnsafe: {
    user?: { id: number; first_name: string; last_name?: string; username?: string; language_code?: string };
  };
  isClosingConfirmationEnabled: boolean;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  // Add onEvent and offEvent based on typical Telegram WebApp SDK structure
  onEvent: (eventType: string, eventHandler: (...args: any[]) => void) => void;
  offEvent: (eventType: string, eventHandler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
