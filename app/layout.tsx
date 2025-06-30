// app/layout.tsx
import './global.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QuizApp',
  description: 'Next.jsで作るクイズアプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}