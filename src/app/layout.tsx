import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
// import { GeistMono } from 'geist/font/mono'; // Removed as it's not used and can cause errors if not present
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Shadcn Toaster

export const metadata: Metadata = {
  title: 'TeleForm',
  description: 'Dynamic Form Renderer for Telegram Mini Apps',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js?57"></script>
      </head>
      <body className={`${GeistSans.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
