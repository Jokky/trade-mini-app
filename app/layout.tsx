import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TelegramUIProvider } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Trade Mini App',
  description: 'Telegram Mini App for trading',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TelegramUIProvider>
          {children}
        </TelegramUIProvider>
      </body>
    </html>
  );
}
