
import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// Removed the incorrect function call to GeistSans.
// The imported GeistSans object itself provides the necessary properties.

// Removed GeistMono as GeistSans can cover both needs or simplify font setup
// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: 'Esper AI Call Center',
  description: 'AI-Powered Call Center Optimization Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Use GeistSans.variable directly */}
      <body className={`${GeistSans.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
