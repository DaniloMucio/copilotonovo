import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';
import { metadata } from './metadata';

export { metadata };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2D3748" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Co-Piloto" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
