"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Check if user is admin
  const { data: adminRole, isLoading: isAdminLoading } = useDoc(
    user ? doc(firestore, 'roles_admin', user.uid) : null
  );

  // Check if user is staff
  const { data: staffRole, isLoading: isStaffLoading } = useDoc(
    user ? doc(firestore, 'roles_staff', user.uid) : null
  );

  useEffect(() => {
    if (isUserLoading || isAdminLoading || isStaffLoading) return;

    if (!user) {
      router.push('/login');
    } else if (adminRole) {
      router.push('/admin');
    } else if (staffRole) {
      router.push('/pos');
    } else {
      // Default fallback if authenticated but no role assigned yet
      router.push('/pos');
    }
  }, [user, isUserLoading, adminRole, isAdminLoading, staffRole, isStaffLoading, router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-primary rounded-xl mb-4" />
        <p className="text-primary font-bold">Loading JP Cafe POS...</p>
      </div>
    </div>
  );
}
