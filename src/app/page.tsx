"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Check current user's role status
  const adminRoleRef = useMemoFirebase(() => 
    user ? doc(firestore, 'roles_admin', user.uid) : null,
    [firestore, user]
  );
  
  const staffRoleRef = useMemoFirebase(() => 
    user ? doc(firestore, 'roles_staff', user.uid) : null,
    [firestore, user]
  );

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef);
  const { data: staffRole, isLoading: isStaffLoading } = useDoc(staffRoleRef);

  useEffect(() => {
    if (isUserLoading || isAdminLoading || isStaffLoading) return;

    if (!user) {
      router.push('/login');
    } else if (adminRole) {
      router.push('/admin');
    } else {
      // Default to POS for staff or users without explicit roles (who might be staff by default)
      router.push('/pos');
    }
  }, [user, isUserLoading, adminRole, isAdminLoading, staffRole, isStaffLoading, router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-primary rounded-xl mb-4" />
        <p className="text-primary font-bold">Initializing JP Cafe POS...</p>
      </div>
    </div>
  );
}
