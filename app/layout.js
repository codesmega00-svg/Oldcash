import './globals.css';
import Providers from '@/components/Providers';
import ConfettiCanvas from '@/components/ConfettiCanvas';

export const metadata = {
  title: 'Old Cash · Every Forgotten Dollar Back to One Wallet',
  description: 'The First (Public) Solana Recovery Engine. Scan every wallet account, identify MEV rewards, unclaimed staking rewards, and protocol incentives.',
  icons: {
    icon: '/assets/logo.jpg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="pink" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('oldcash-theme');
                  if (!t || t === 'light') {
                    t = 'pink';
                    try { localStorage.setItem('oldcash-theme', 'pink'); } catch(e) {}
                  }
                  document.documentElement.setAttribute('data-theme', t);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
          <ConfettiCanvas />
        </Providers>
      </body>
    </html>
  );
}
