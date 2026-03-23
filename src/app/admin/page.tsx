"use client"

import { useState, useEffect } from 'react';
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
  Loader2, 
  ShieldCheck,
  TrendingUp,
  Settings,
  ShoppingBag,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
  useDoc
} from '@/firebase';
import { doc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, Order } from '@/types';

export default function AdminDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [stats, setStats] = useState({ revenue: 0, orders: 0 });

  const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users')), [firestore]);
  const { data: allUsers, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);

  const adminRolesQuery = useMemoFirebase(() => query(collection(firestore, 'roles_admin')), [firestore]);
  const { data: adminRolesList } = useCollection(adminRolesQuery);
  const adminUids = new Set(adminRolesList?.map(r => r.id) || []);

  const myAdminRoleRef = useMemoFirebase(() => user ? doc(firestore, 'roles_admin', user.uid) : null, [firestore, user]);
  const { data: myAdminRole } = useDoc(myAdminRoleRef);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const q = query(collection(firestore, 'orders'), where('status', '==', 'paid'));
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(d => d.data() as Order);
        const revenue = orders.reduce((acc, curr) => acc + curr.total, 0);
        setStats({ revenue, orders: orders.length });
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      }
    };
    if (user) fetchStats();
  }, [firestore, user]);

  const toggleAdminRole = (targetUser: UserProfile, isCurrentlyAdmin: boolean) => {
    if (isCurrentlyAdmin) {
      if (targetUser.id === user?.uid) {
        toast({ title: "Error", description: "Cannot demote yourself.", variant: "destructive" });
        return;
      }
      deleteDocumentNonBlocking(doc(firestore, 'roles_admin', targetUser.id));
      updateDocumentNonBlocking(doc(firestore, 'users', targetUser.id), { role: 'staff' });
      toast({ title: "Role Updated", description: `${targetUser.name} is now Staff.` });
    } else {
      setDocumentNonBlocking(doc(firestore, 'roles_admin', targetUser.id), { assignedAt: new Date() }, { merge: true });
      updateDocumentNonBlocking(doc(firestore, 'users', targetUser.id), { role: 'admin' });
      toast({ title: "Role Updated", description: `${targetUser.name} is now Admin.` });
    }
  };

  const bootstrapMe = () => {
    if (!user) return;
    setDocumentNonBlocking(doc(firestore, 'roles_admin', user.uid), { 
      assignedAt: new Date(),
      bootstrap: true
    }, { merge: true });
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { role: 'admin' });
    toast({ title: "Success", description: "You are now an Admin." });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Management Dashboard</h1>
            <p className="text-muted-foreground text-sm">Review performance and manage user permissions.</p>
          </div>
          {!myAdminRole && (
            <Button onClick={bootstrapMe} variant="outline" className="gap-2 border-primary text-primary font-black uppercase text-xs">
              <Zap className="h-4 w-4 fill-primary" /> Bootstrap Admin Access
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary text-primary-foreground border-none shadow-xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase opacity-80">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">Rs. {stats.revenue}</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Settled Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{stats.orders}</div>
            </CardContent>
          </Card>
          <Link href="/admin/menu">
            <Card className="hover:border-primary transition-all cursor-pointer border-none shadow-sm bg-secondary/50 h-full group">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Menu Editor</CardTitle>
                <Settings className="h-4 w-4 text-primary group-hover:rotate-90 transition-transform" />
              </CardHeader>
              <CardContent className="text-xs font-black text-primary">MANAGE CATALOG →</CardContent>
            </Card>
          </Link>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black uppercase tracking-tight">Staff & Roles</h2>
          </div>
          <Card className="border-none shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase">User</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Email</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Role</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isUsersLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary opacity-30" /></TableCell></TableRow>
                ) : allUsers?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground font-medium">No users found.</TableCell></TableRow>
                ) : allUsers?.map((u) => {
                  const isAdmin = adminUids.has(u.id);
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-bold text-sm">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                      <TableCell>
                        {isAdmin ? <Badge className="bg-emerald-500 gap-1 text-[9px] font-black"><ShieldCheck className="h-3 w-3" /> ADMIN</Badge> : <Badge variant="secondary" className="text-[9px] font-black">STAFF</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase h-8" onClick={() => toggleAdminRole(u, isAdmin)} disabled={u.id === user?.uid && isAdmin}>
                          {isAdmin ? "Demote" : "Promote"}
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