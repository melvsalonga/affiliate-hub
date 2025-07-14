import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/navigation/Header';
import Footer from '@/components/navigation/Footer';
import AffiliateProductsProvider from '@/components/providers/MockProductsProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Affiliate Hub - Best Deals from Multiple Platforms",
  description: "Compare prices and find the best deals from Lazada, Shopee, TikTok Shop, Amazon, and AliExpress. Your one-stop affiliate shopping destination.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        <ThemeProvider>
          <AffiliateProductsProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </AffiliateProductsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
