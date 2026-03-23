"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Check current user's role status (Admin vs Staff)
  const adminRoleRef = useMemoFirebase(() => 
    user ? doc(firestore, 'roles_admin', user.uid) : null,
    [firestore, user]
  );

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef);

  useEffect(() => {
    // Wait for auth and role checks to complete
    if (isUserLoading || isAdminLoading) return;

    if (!user) {
      // Not logged in
      router.push('/login');
    } else if (adminRole) {
      // User is an Admin
      router.push('/admin');
    } else {
      // Default to POS for staff or users without explicit admin role
      router.push('/pos');
    }
  }, [user, isUserLoading, adminRole, isAdminLoading, router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-primary rounded-xl mb-4" />
        <p className="text-primary font-bold">Initializing JP Cafe POS...</p>
      </div>
    </div>
  );
}
