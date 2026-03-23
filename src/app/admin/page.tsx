"use client"

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users, 
  ShieldAlert, 
  Loader2, 
  ShieldCheck,
  UserPlus,
  ArrowRight,
  Settings,
  ShoppingBag,
  TrendingUp
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

  const adminRoleRef = useMemoFirebase(() => 
    user ? doc(firestore, 'roles_admin', user.uid) : null,
    [firestore, user]
  );
  const { data: currentAdminRole, isLoading: isCurrentAdminLoading } = useDoc(adminRoleRef);

  const usersQuery = useMemoFirebase(() => 
    query(collection(firestore, 'users')),
    [firestore]
  );
  const { data: allUsers, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);

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
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      role: 'admin',
      updatedAt: serverTimestamp()
    });
    toast({ title: "Role Granted", description: "You now have admin privileges." });
    setTimeout(() => setIsBootstrapping(false), 1000);
  };

  const toggleAdminRole = (targetUser: UserProfile, isCurrentlyAdmin: boolean) => {
    if (targetUser.id === user?.uid) {
      toast({ title: "Forbidden", description: "You cannot remove your own admin role.", variant: "destructive" });
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

  if (!isCurrentAdminLoading && !currentAdminRole) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-primary/20 bg-primary/5">
            <CardHeader className="text-center">
              <ShieldAlert className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-xl font-black">Restricted Access</CardTitle>
              <CardDescription>Admin credentials required for this dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={bootstrapAdmin} 
                disabled={isBootstrapping}
                className="w-full font-bold h-11"
              >
                {isBootstrapping ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Promote Self to Admin
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const quickLinks = [
    { title: 'Menu Items', icon: Settings, link: '/admin/menu', color: 'text-blue-500' },
    { title: 'Live Orders', icon: ShoppingBag, link: '/orders', color: 'text-green-500' },
    { title: 'Analytics', icon: TrendingUp, link: '/reports', color: 'text-amber-500' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Control Center</h1>
            <p className="text-muted-foreground text-sm">System configuration and user management.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map((item, idx) => (
            <Link key={idx} href={item.link}>
              <Card className="hover:border-primary transition-colors cursor-pointer border-none shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-secondary ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-wider">{item.title}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black uppercase tracking-tight">Staff Management</h2>
          </div>
          <Card className="border-none shadow-sm">
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase">Staff Member</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Email Address</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Current Role</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isUsersLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary opacity-30" />
                    </TableCell>
                  </TableRow>
                ) : allUsers?.map((u) => {
                  const isUserAdmin = adminUids.has(u.id);
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-bold text-sm">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                      <TableCell>
                        {isUserAdmin ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1 text-[9px] uppercase font-black">
                            <ShieldCheck className="h-3 w-3" /> Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 text-[9px] uppercase font-black">
                            Staff
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="font-black text-[10px] uppercase tracking-widest h-8"
                          onClick={() => toggleAdminRole(u, isUserAdmin)}
                          disabled={u.id === user?.uid}
                        >
                          {isUserAdmin ? "Demote" : "Promote"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </section>
      </main>
    </div>
  );
}
