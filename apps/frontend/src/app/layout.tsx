import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SocialX Advanced',
  description: 'A modern social platform with AI-powered features',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}