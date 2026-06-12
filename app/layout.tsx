import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'World Cup 26 · Sweepstake',
  description: 'Daily updates, fixtures, entrants and awards for the 24-person FIFA World Cup 26™ sweepstake.',
  appleWebApp: {
    capable: true,
    title: 'WC26',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0e1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

const themeInitScript = `(function(){try{var s=localStorage.getItem('theme');var m=s==='light'||s==='dark'?s:'dark';document.documentElement.dataset.theme=m;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <div className="min-h-dvh w-full max-w-3xl mx-auto pb-[max(6rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
          <Nav />
        </ThemeProvider>
      </body>
    </html>
  );
}
