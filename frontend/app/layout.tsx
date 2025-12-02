import { Inter } from 'next/font/google';
import { cn } from '../utils/cn';
 
const inter = Inter({ subsets: ['latin'] });
 
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('text-base antialiased', inter.className)}>{children}</body>
    </html>
  );
}
