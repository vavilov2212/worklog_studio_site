import type {Metadata, Viewport} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Worklog Studio | Track your work. Understand your flow.',
  description: 'The minimal desktop time logger designed for deep focus. High-precision analytics without the overhead of heavy management tools.',
  icons: {
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

import { TimerProvider } from '@/components/TimerContext';
import { ChatProvider } from '@/components/chat/ChatContext';
import { ReleaseProvider } from '@/components/ReleaseContext';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-bg text-ink selection:bg-accent/30 selection:text-ink antialiased" suppressHydrationWarning>
        <ReleaseProvider>
          <TimerProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </TimerProvider>
        </ReleaseProvider>
      </body>
    </html>
  );
}
