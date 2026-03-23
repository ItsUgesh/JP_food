"use client"

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Order } from '@/types';
import { format, startOfDay, endOfDay } from 'date-fns';
import { TrendingUp, ShoppingBag, CheckCircle2, IndianRupee, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    recentOrders: [] as Order[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const q = query(
          collection(firestore, 'orders'),
          where('status', '==', 'paid'),
          where('paidAt', '>=', startOfDay(today)),
          where('paidAt', '<=', endOfDay(today))
        );

        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        
        const total = orders.reduce((acc, curr) => acc + curr.total, 0);

        const recentQ = query(
          collection(firestore, 'orders'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSnapshot = await getDocs(recentQ);
        const recent = recentSnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
          } as Order;
        });

        setStats({
          totalSales: total,
          orderCount: orders.length,
          recentOrders: recent
        });
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [firestore, user]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-primary">Sales Analytics</h1>
          <p className="text-muted-foreground">Detailed overview of daily business performance.</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mb-4" />
            <p className="font-bold text-muted-foreground">Calculating statistics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold uppercase opacity-80">Revenue (Today)</CardTitle>
                  <TrendingUp className="h-4 w-4 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">Rs. {stats.totalSales}</div>
                  <p className="text-xs mt-1 opacity-80">From {stats.orderCount} paid transactions</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Orders Count</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{stats.orderCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Settled today</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold uppercase text-muted-foreground">System Status</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-emerald-600">Active</div>
                  <p className="text-xs text-muted-foreground mt-1">Operations running smoothly</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs",
                            order.status === 'paid' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          )}>
                            T{order.tableNumber}
                          </div>
                          <div>
                            <div className="font-bold">Rs. {order.total}</div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase">
                              {order.createdAt instanceof Date ? format(order.createdAt, 'hh:mm a') : 'Now'}
                            </div>
                          </div>
                        </div>
                        <Badge variant={order.status === 'paid' ? "default" : "outline"} className={cn(
                          "font-black text-[10px]",
                          order.status === 'paid' ? "bg-green-500" : "text-amber-600 border-amber-200"
                        )}>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm flex flex-col items-center justify-center bg-secondary/5 min-h-[300px]">
                <IndianRupee className="h-12 w-12 text-primary opacity-20 mb-4" />
                <p className="text-muted-foreground text-sm font-medium text-center px-8">
                  Daily visual trends will appear here as more transaction data is populated in the system.
                </p>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
