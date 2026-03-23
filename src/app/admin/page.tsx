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
  CheckCircle2, 
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
    
    setDocumentNonBlocking(doc(firestore, 'roles_admin', user.uid), {
      assignedAt: serverTimestamp()
    }, { merge: true });

    setDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      id: user.uid,
      name: user.displayName || 'Admin User',
      email: user.email,
      role: 'admin',
      updatedAt: serverTimestamp()
    }, { merge: true });

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
      toast({ title: "Role Removed", description: `${targetUser.name} is no longer an admin.` });
    } else {
      setDocumentNonBlocking(doc(firestore, 'roles_admin', targetUser.id), {
        assignedAt: serverTimestamp()
      }, { merge: true });
      updateDocumentNonBlocking(doc(firestore, 'users', targetUser.id), { role: 'admin' });
      toast({ title: "Role Granted", description: `${targetUser.name} is now an admin.` });
    }
  };

  const stats = [
    { title: 'Total Menu Items', icon: Settings, link: '/admin/menu', color: 'bg-blue-500' },
    { title: 'Orders Management', icon: ShoppingBag, link: '/orders', color: 'bg-green-500' },
    { title: 'Role Control', icon: Users, link: '#users-section', color: 'bg-purple-500' },
    { title: 'Sales Performance', icon: TrendingUp, link: '/reports', color: 'bg-amber-500' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage roles, menu items, and system settings.</p>
          </div>

          {!isCurrentAdminLoading && !currentAdminRole && (
            <Card className="border-primary/20 bg-primary/5 max-w-md">
              <CardContent className="p-4 flex items-center gap-4">
                <ShieldAlert className="h-10 w-10 text-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">Role Verification Required</p>
                  <Button 
                    size="sm" 
                    onClick={bootstrapAdmin} 
                    disabled={isBootstrapping}
                    className="h-8 font-bold mt-2"
                  >
                    {isBootstrapping ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                    Make Me Admin
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground">{stat.title}</CardTitle>
                <div className={`${stat.color} p-2 rounded-lg text-white`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <Link href={stat.link}>
                  <Button variant="link" className="p-0 h-auto text-xs font-bold text-primary">Access Management</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <section id="users-section" className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-black">User Role Management</h2>
          </div>
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardDescription>Grant or revoke administrative access to registered staff.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-secondary/20">
                    <TableRow>
                      <TableHead className="font-bold">Name</TableHead>
                      <TableHead className="font-bold">Email</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
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
                              <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs uppercase">
                                <ShieldCheck className="h-3 w-3" /> Admin
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground font-bold text-xs uppercase">
                                <Users className="h-3 w-3" /> Staff
                              </div>
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
                              {isUserAdmin ? "Revoke Admin" : "Make Admin"}
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
