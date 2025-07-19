import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import ModernHeader from '@/components/navigation/ModernHeader';
import Footer from '@/components/navigation/Footer';
import MobileNavigation from '@/components/navigation/MobileNavigation';
import AffiliateProductsProvider from '@/components/providers/MockProductsProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { PWAProvider } from '@/components/providers/PWAProvider';
import { brandConfig } from '@/config/brand';
import { Toaster } from 'react-hot-toast';

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
  ],
  authors: [{ name: brandConfig.name }],
  creator: brandConfig.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: `${brandConfig.name} - ${brandConfig.tagline}`,
    description: brandConfig.description,
    siteName: brandConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brandConfig.name} - ${brandConfig.tagline}`,
    description: brandConfig.description,
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
  },
  formatDetection: {
    telephone: false,
  },
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
              <AffiliateProductsProvider>
                <div className="relative flex min-h-screen flex-col">
                  <ModernHeader />
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />
                  <MobileNavigation />
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
            </AuthProvider>
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
