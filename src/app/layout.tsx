import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import ModernHeader from '@/components/navigation/ModernHeader';
import Footer from '@/components/navigation/Footer';
import MobileNavigation from '@/components/navigation/MobileNavigation';
import AffiliateProductsProvider from '@/components/providers/MockProductsProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { PWAProvider } from '@/components/providers/PWAProvider';
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { OfflineSyncStatus } from '@/components/pwa/OfflineSyncStatus';
import { FloatingSyncIndicator } from '@/components/pwa/OfflineSyncStatus';
import { brandConfig } from '@/config/brand';
import { Toaster } from 'react-hot-toast';
import '@/lib/websocket/init'; // Initialize WebSocket services

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${brandConfig.name} - ${brandConfig.tagline}`,
  description: brandConfig.description,
  keywords: [
    'affiliate marketing',
    'product showcase',
    'link management',
    'analytics',
    'e-commerce',
    'Philippines',
    'Lazada',
    'Shopee',
    'Amazon',
    'TikTok Shop',
    'PWA',
    'mobile app',
    'offline',
    'push notifications'
  ],
  authors: [{ name: brandConfig.name }],
  creator: brandConfig.name,
  publisher: brandConfig.name,
  category: 'business',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: `${brandConfig.name} - ${brandConfig.tagline}`,
    description: brandConfig.description,
    siteName: brandConfig.name,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} - Professional Affiliate Marketing Platform`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brandConfig.name} - ${brandConfig.tagline}`,
    description: brandConfig.description,
    images: ['/twitter-image.png'],
    creator: '@linkvaultpro',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: brandConfig.name,
    startupImage: [
      {
        url: '/apple-touch-startup-image-768x1004.png',
        media: '(device-width: 768px) and (device-height: 1024px)',
      },
      {
        url: '/apple-touch-startup-image-1536x2008.png',
        media: '(device-width: 1536px) and (device-height: 2048px)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://linkvaultpro.com',
  },
  referrer: 'origin-when-cross-origin',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: brandConfig.colors.primary[500] },
    { media: '(prefers-color-scheme: dark)', color: brandConfig.colors.primary[600] },
  ],
  colorScheme: 'light dark',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider defaultTheme="light" storageKey="linkvault-theme">
          <PWAProvider>
            <AuthProvider>
              <WebSocketProvider>
                <AffiliateProductsProvider>
                  <div className="relative flex min-h-screen flex-col">
                    <ModernHeader />
                    <main className="flex-1">
                      {children}
                    </main>
                    <Footer />
                    <MobileNavigation />
                    
                    {/* PWA Components */}
                    <PWAInstallPrompt variant="banner" />
                    <OfflineSyncStatus variant="banner" />
                    <FloatingSyncIndicator />
                  </div>
                  <Toaster 
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                      },
                    }}
                  />
                </AffiliateProductsProvider>
              </WebSocketProvider>
            </AuthProvider>
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
