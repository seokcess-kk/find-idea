import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Product Ideation',
  description: 'Collect and analyze product ideas from global channels',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">
                Product Ideation
              </h1>
              <nav className="flex items-center gap-4">
                <a href="/" className="text-gray-600 hover:text-gray-900">
                  Feeds
                </a>
                <a href="/ideas" className="text-gray-600 hover:text-gray-900">
                  Ideas
                </a>
                <a href="/settings" className="text-gray-600 hover:text-gray-900">
                  Settings
                </a>
              </nav>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
