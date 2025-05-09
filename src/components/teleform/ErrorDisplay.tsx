"use client";

import type { FC } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertTriangle } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  onClose?: () => void; // Custom close handler if needed beyond Telegram's default
}

const ErrorDisplay: FC<ErrorDisplayProps> = ({ message, onClose }) => {
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex flex-row items-center space-x-2">
          <AlertTriangle className="text-destructive h-6 w-6" />
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{message}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleClose} className="w-full" variant="destructive">
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ErrorDisplay;
