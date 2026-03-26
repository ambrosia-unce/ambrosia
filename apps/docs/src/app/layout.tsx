import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ambrosia.dev'),
  title: {
    default: 'Ambrosia — The Bun Framework for Modern Backends',
    template: '%s | Ambrosia',
  },
  description:
    'Decorator-based DI, provider-agnostic HTTP, compile-time validation, and a pack ecosystem. Built from the ground up for Bun.',
  keywords: [
    'bun',
    'framework',
    'typescript',
    'dependency injection',
    'http',
    'backend',
    'nodejs alternative',
    'decorator',
    'validation',
  ],
  authors: [{ name: 'Ambrosia Team' }],
  creator: 'Ambrosia',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ambrosia.dev',
    siteName: 'Ambrosia',
    title: 'Ambrosia — The Bun Framework for Modern Backends',
    description:
      'Decorator-based DI, provider-agnostic HTTP, compile-time validation, and a pack ecosystem. Built from the ground up for Bun.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ambrosia — The Bun Framework for Modern Backends',
    description:
      'Decorator-based DI, provider-agnostic HTTP, compile-time validation, and a pack ecosystem.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.className} dark`} style={{ colorScheme: 'dark' }}>
      <body className="flex flex-col min-h-screen bg-fd-background text-fd-foreground">
        <RootProvider
          theme={{
            enabled: false,
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
