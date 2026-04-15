import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Worklog Studio | Track your work. Understand your flow.',
  description: 'The minimal desktop time logger designed for deep focus. High-precision analytics without the overhead of heavy management tools.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="font-sans selection:bg-accent/30 selection:text-ink antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
