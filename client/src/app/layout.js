import './globals.css';
import Providers from './providers';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Groovy Holdings – T-shirt, cap printing, embroidery & mugs in Sri Lanka',
    template: '%s · Groovy Holdings',
  },
  description:
    'Custom T-shirt and cap printing, embroidery, mugs and branded merchandise. Upload your design, talk to our team and track your order online.',
  icons: { icon: '/logo.jpg' },
  openGraph: { images: ['/logo.jpg'] },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F7FA' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1524' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
