import type {Metadata} from 'next';
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
    icon: '/worklog_studio/icon.svg',
  },
};

import { TimerProvider } from '@/components/TimerContext';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-bg text-ink selection:bg-accent/30 selection:text-ink antialiased" suppressHydrationWarning>
        <TimerProvider>
          {children}
        </TimerProvider>
      </body>
    </html>
  );
}
