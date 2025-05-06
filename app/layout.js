import './globals.css'

export const metadata = {
  title: 'TikTok Affiliate Search Tool',
  description: 'Find exact moments products are mentioned in videos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
