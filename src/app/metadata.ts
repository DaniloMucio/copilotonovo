import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Co-Piloto Driver",
  description: 'O seu co-piloto para gestão financeira como motorista de aplicativo.',
  manifest: "/manifest.json",
  applicationName: "Co-Piloto Driver",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Co-Piloto Driver",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-config": "/icons/browserconfig.xml",
    "msapplication-TileColor": "#34495E",
    "msapplication-tap-highlight": "no",
    "theme-color": "#34495E",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    other: [
      {
        rel: "mask-icon",
        url: "/icons/safari-pinned-tab.svg",
        color: "#34495E",
      },
    ],
  },
};