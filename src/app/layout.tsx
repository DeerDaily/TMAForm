import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
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
      <body className={`${GeistSans.className} ${GeistMono.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
