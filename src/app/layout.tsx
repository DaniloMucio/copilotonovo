import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { IOSSplashScreen } from '@/components/IOSSplashScreen';
import { InactiveUserAlert } from '@/components/InactiveUserAlert';
import { metadata } from './metadata';

// Funções de migração disponíveis apenas em desenvolvimento
// Para usar: abra o console do navegador e execute fixUsersIsActiveField() ou auditUsersIsActiveField()
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('@/services/migration-fix-isactive');
}

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
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Co-Piloto" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2D3748" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        
        {/* iOS Splash Screens */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
        
        {/* Safari Pinned Tab */}
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#2D3748" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <IOSSplashScreen>
          <ThemeProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
            <InactiveUserAlert />
          </ThemeProvider>
        </IOSSplashScreen>
      </body>
    </html>
  );
}
