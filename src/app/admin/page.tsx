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
  Zap,
  IndianRupee,
  Wallet,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
  useDoc,
  errorEmitter,
  FirestorePermissionError
} from '@/firebase';
import { doc, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, Order } from '@/types';
import { formatNepalDateID, startOfNepalDay, endOfNepalDay } from '@/lib/date-utils';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState({ revenue: 0, orders: 0, cash: 0, esewa: 0 });

  const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users')), [firestore]);
  const { data: allUsers, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);

  const adminRolesQuery = useMemoFirebase(() => query(collection(firestore, 'roles_admin')), [firestore]);
  const { data: adminRolesList } = useCollection(adminRolesQuery);
  const adminUids = new Set(adminRolesList?.map(r => r.id) || []);

  const myAdminRoleRef = useMemoFirebase(() => user ? doc(firestore, 'roles_admin', user.uid) : null, [firestore, user]);
  const { data: myAdminRole, isLoading: isAdminLoading } = useDoc(myAdminRoleRef);

  // Protection: Redirect non-admins away from this page
  useEffect(() => {
    if (!isUserLoading && !isAdminLoading && user && !myAdminRole) {
      router.push('/pos');
    }
  }, [user, isUserLoading, isAdminLoading, myAdminRole, router]);

  useEffect(() => {
    const fetchTodayStats = async () => {
      if (!user || !myAdminRole) return;
      
      const todayId = formatNepalDateID();
      const start = startOfNepalDay();
      const end = endOfNepalDay();
      
      const q = query(
        collection(firestore, 'orders'), 
        where('status', '==', 'paid'),
        where('paidAt', '>=', start),
        where('paidAt', '<=', end)
      );
      
      getDocs(q)
        .then((snapshot) => {
          const orders = snapshot.docs.map(d => d.data() as Order);
          
          const revenue = orders.reduce((acc, curr) => acc + curr.total, 0);
          const cash = orders.reduce((acc, curr) => curr.paymentMethod === 'cash' ? acc + curr.total : acc, 0);
          const esewa = orders.reduce((acc, curr) => curr.paymentMethod === 'esewa' ? acc + curr.total : acc, 0);
          
          setStats({ revenue, orders: orders.length, cash, esewa });

          setDocumentNonBlocking(doc(firestore, 'daily_reports', todayId), {
            id: todayId,
            date: todayId,
            totalRevenue: revenue,
            cashRevenue: cash,
            esewaRevenue: esewa,
            numberOfOrders: orders.length,
            updatedAt: new Date()
          }, { merge: true });
        })
        .catch((err) => {
          const permissionError = new FirestorePermissionError({
            path: 'orders',
            operation: 'list'
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    };
    
    fetchTodayStats();
  }, [firestore, user, myAdminRole]);

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

  if (isUserLoading || isAdminLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  if (!myAdminRole) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-4 space-y-6 text-center">
          <div className="bg-amber-100 p-6 rounded-2xl max-w-md">
            <ShieldCheck className="h-16 w-16 text-amber-600 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-amber-800 uppercase">Access Denied</h2>
            <p className="text-amber-700 mt-2 font-medium">You need Admin privileges to access the management dashboard.</p>
            <Button onClick={bootstrapMe} className="mt-6 w-full font-black uppercase">
              Bootstrap Admin Access
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Management Dashboard</h1>
            <p className="text-muted-foreground text-sm">Real-time business performance (Nepal Time).</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/insights">
              <Button variant="outline" className="gap-2 font-bold uppercase text-xs h-10">
                <TrendingUp className="h-4 w-4" /> View Insights
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary text-primary-foreground border-none shadow-xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase opacity-80">Today Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">Rs. {stats.revenue}</div>
              <p className="text-[10px] opacity-70">Nepal Time: {formatNepalDateID()}</p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-emerald-50 dark:bg-emerald-950/20">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase text-emerald-700">eSewa Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600">Rs. {stats.esewa}</div>
              <p className="text-[10px] text-muted-foreground">{Math.round((stats.esewa / (stats.revenue || 1)) * 100)}% of today</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-slate-50 dark:bg-slate-900/20">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase text-slate-600">Cash Revenue</CardTitle>
              <Wallet className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-700">Rs. {stats.cash}</div>
              <p className="text-[10px] text-muted-foreground">{Math.round((stats.cash / (stats.revenue || 1)) * 100)}% of today</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Paid Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{stats.orders}</div>
              <p className="text-[10px] text-muted-foreground">Successful settlements</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-black uppercase tracking-tight">Staff Management</h2>
              </div>
            </div>
            <Card className="border-none shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-secondary/20">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase">User</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Role</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isUsersLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary opacity-30" /></TableCell></TableRow>
                  ) : allUsers?.map((u) => {
                    const isAdmin = adminUids.has(u.id);
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="font-bold text-sm">{u.name}</div>
                          <div className="text-[9px] text-muted-foreground">{u.email}</div>
                        </TableCell>
                        <TableCell>
                          {isAdmin ? <Badge className="bg-emerald-500 text-[9px] font-black">ADMIN</Badge> : <Badge variant="secondary" className="text-[9px] font-black">STAFF</Badge>}
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

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-black uppercase tracking-tight">Quick Links</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/admin/transactions" className="group">
                <Card className="hover:border-primary transition-all shadow-sm border-none bg-secondary/30 h-full">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase">Live Transactions</CardTitle>
                    <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </CardHeader>
                  <CardContent className="text-[10px] font-bold text-muted-foreground">Monitor all payments in real-time.</CardContent>
                </Card>
              </Link>
              <Link href="/admin/menu" className="group">
                <Card className="hover:border-primary transition-all shadow-sm border-none bg-secondary/30 h-full">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase">Menu Catalog</CardTitle>
                    <Settings className="h-4 w-4 group-hover:rotate-45 transition-transform" />
                  </CardHeader>
                  <CardContent className="text-[10px] font-bold text-muted-foreground">Manage products, categories, and pricing.</CardContent>
                </Card>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}