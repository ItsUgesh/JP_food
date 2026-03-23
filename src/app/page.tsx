"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/pos');
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-primary rounded-xl mb-4" />
        <p className="text-primary font-bold">Loading JP Cafe POS...</p>
      </div>
    </div>
  );
}
