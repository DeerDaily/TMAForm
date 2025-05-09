"use client";

import type { FC } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle } from 'lucide-react';

interface SuccessDisplayProps {
  message?: string;
  onClose?: () => void;
}

const SuccessDisplay: FC<SuccessDisplayProps> = ({ message = "Form submitted successfully!", onClose }) => {
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
          <CheckCircle className="text-accent h-6 w-6" />
          <CardTitle>Success</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-accent-foreground">{message}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleClose} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SuccessDisplay;
