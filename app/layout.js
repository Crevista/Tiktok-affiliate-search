import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'TikTok Affiliate Search Tool',
  description: 'Find exact moments products are mentioned in videos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
