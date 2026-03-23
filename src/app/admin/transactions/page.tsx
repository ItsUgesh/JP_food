"use client"

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, where, limit, doc } from 'firebase/firestore';
import { Order } from '@/types';
import { format } from 'date-fns';
import { Search, Wallet, IndianRupee, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function TransactionsPage() {
  const [filter, setFilter] = useState<'all' | 'cash' | 'esewa'>('all');
  const [search, setSearch] = useState('');
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const myAdminRoleRef = useMemoFirebase(() => user ? doc(firestore, 'roles_admin', user.uid) : null, [firestore, user]);
  const { data: myAdminRole, isLoading: isAdminLoading } = useDoc(myAdminRoleRef);

  // Protection: Redirect non-admins away from this page
  useEffect(() => {
    if (!isUserLoading && !isAdminLoading && user && !myAdminRole) {
      router.push('/pos');
    }
  }, [user, isUserLoading, isAdminLoading, myAdminRole, router]);

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !myAdminRole) return null;
    let baseQuery = query(
      collection(firestore, 'orders'),
      where('status', '==', 'paid'),
      orderBy('paidAt', 'desc'),
      limit(100)
    );
    return baseQuery;
  }, [firestore, user, myAdminRole]);

  const { data: orders, isLoading } = useCollection<Order>(transactionsQuery);

  const filteredOrders = (orders || []).filter(order => {
    const matchesFilter = filter === 'all' || order.paymentMethod === filter;
    const matchesSearch = order.tableNumber.includes(search) || order.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isUserLoading || isAdminLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  if (!myAdminRole) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Live Transactions</h1>
          <p className="text-muted-foreground text-sm">Real-time settlement history and payment tracking.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search Table # or ID..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash Only</SelectItem>
              <SelectItem value="esewa">eSewa Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase">Order ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Table</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Amount</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Method</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase">Settled At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-30" /></TableCell></TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No matching transactions found.</TableCell></TableRow>
              ) : filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-[10px] text-muted-foreground">#{order.id.slice(-6).toUpperCase()}</TableCell>
                  <TableCell className="font-black">Table {order.tableNumber}</TableCell>
                  <TableCell className="font-black text-primary">Rs. {order.total}</TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2",
                      order.paymentMethod === 'cash' ? "bg-slate-500 text-white" : "bg-emerald-500 text-white"
                    )}>
                      {order.paymentMethod === 'cash' ? <Wallet className="h-3 w-3 mr-1" /> : <IndianRupee className="h-3 w-3 mr-1" />}
                      {order.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-[10px] font-bold text-muted-foreground">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" />
                      {order.paidAt?.toDate ? format(order.paidAt.toDate(), 'hh:mm:ss a') : 'N/A'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}