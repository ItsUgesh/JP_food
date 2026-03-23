"use client"

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Settings, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  ShieldAlert, 
  Loader2, 
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types';

export default function AdminDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  // Check current user's admin status
  const adminRoleRef = useMemoFirebase(() => 
    user ? doc(firestore, 'roles_admin', user.uid) : null,
    [firestore, user]
  );
  const { data: currentAdminRole, isLoading: isCurrentAdminLoading } = useDoc(adminRoleRef);

  // Fetch all users for role management
  const usersQuery = useMemoFirebase(() => 
    query(collection(firestore, 'users')),
    [firestore]
  );
  const { data: allUsers, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);

  // Fetch all admin UIDs to check roles efficiently
  const adminRolesQuery = useMemoFirebase(() => 
    query(collection(firestore, 'roles_admin')),
    [firestore]
  );
  const { data: adminRolesList } = useCollection(adminRolesQuery);
  const adminUids = new Set(adminRolesList?.map(r => r.id) || []);

  const bootstrapAdmin = () => {
    if (!user) return;
    setIsBootstrapping(true);
    
    // Existence in roles_admin collection is the source of truth
    setDocumentNonBlocking(doc(firestore, 'roles_admin', user.uid), {
      assignedAt: serverTimestamp()
    }, { merge: true });

    // Update the informational role in the user document
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      role: 'admin',
      updatedAt: serverTimestamp()
    });

    toast({ title: "Role Granted", description: "You now have admin privileges." });
    setTimeout(() => setIsBootstrapping(false), 1000);
  };

  const toggleAdminRole = (targetUser: UserProfile, isCurrentlyAdmin: boolean) => {
    if (targetUser.id === user?.uid) {
      toast({ title: "Action Denied", description: "You cannot remove your own admin role.", variant: "destructive" });
      return;
    }

    if (isCurrentlyAdmin) {
      deleteDocumentNonBlocking(doc(firestore, 'roles_admin', targetUser.id));
      updateDocumentNonBlocking(doc(firestore, 'users', targetUser.id), { role: 'staff' });
      toast({ title: "Role Revoked", description: `${targetUser.name} is now Staff.` });
    } else {
      setDocumentNonBlocking(doc(firestore, 'roles_admin', targetUser.id), {
        assignedAt: serverTimestamp()
      }, { merge: true });
      updateDocumentNonBlocking(doc(firestore, 'users', targetUser.id), { role: 'admin' });
      toast({ title: "Role Granted", description: `${targetUser.name} is now Admin.` });
    }
  };

  const stats = [
    { title: 'Menu Items', icon: Settings, link: '/admin/menu', color: 'bg-blue-500' },
    { title: 'Live Orders', icon: ShoppingBag, link: '/orders', color: 'bg-green-500' },
    { title: 'Sales Reports', icon: TrendingUp, link: '/reports', color: 'bg-amber-500' },
    { title: 'Staff Control', icon: Users, link: '#users-section', color: 'bg-purple-500' },
  ];

  if (!isCurrentAdminLoading && !currentAdminRole) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-primary/20 bg-primary/5">
            <CardHeader className="text-center">
              <ShieldAlert className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-black">Access Restricted</CardTitle>
              <CardDescription>Only system administrators can access this panel.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-center text-muted-foreground">
                If you believe you should have access, contact the owner or click below to request admin privileges (development mode).
              </p>
              <Button 
                onClick={bootstrapAdmin} 
                disabled={isBootstrapping}
                className="font-bold h-12"
              >
                {isBootstrapping ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Make Me Admin
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-black text-primary">Admin Control Center</h1>
          <p className="text-muted-foreground">Oversee roles, inventory, and business performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm group hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground">{stat.title}</CardTitle>
                <div className={`${stat.color} p-2 rounded-lg text-white`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <Link href={stat.link}>
                  <Button variant="link" className="p-0 h-auto text-xs font-bold text-primary">
                    Manage {stat.title} →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <section id="users-section" className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-black">Staff & Role Management</h2>
          </div>
          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-secondary/20">
                    <TableRow>
                      <TableHead className="font-bold">Name</TableHead>
                      <TableHead className="font-bold">Email</TableHead>
                      <TableHead className="font-bold">Access Level</TableHead>
                      <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isUsersLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                        </TableCell>
                      </TableRow>
                    ) : allUsers?.map((u) => {
                      const isUserAdmin = adminUids.has(u.id);
                      return (
                        <TableRow key={u.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-bold">{u.name}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                          <TableCell>
                            {isUserAdmin ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1">
                                <ShieldCheck className="h-3 w-3" /> ADMIN
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <Users className="h-3 w-3" /> STAFF
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant={isUserAdmin ? "outline" : "default"} 
                              size="sm"
                              className="font-bold text-xs h-8"
                              onClick={() => toggleAdminRole(u, isUserAdmin)}
                              disabled={u.id === user?.uid}
                            >
                              {isUserAdmin ? "Demote to Staff" : "Promote to Admin"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
