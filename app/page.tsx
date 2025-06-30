'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">QuizApp</h1>

      <nav className="space-x-4 mb-6">
        <Link href="/host" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          出題者
        </Link>
        <Link href="/participant" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          参加者
        </Link>
      </nav>
    </div>
  );
}