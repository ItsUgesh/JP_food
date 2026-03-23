"use client"

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Order } from '@/types';
import { format, startOfDay, endOfDay } from 'date-fns';
import { TrendingUp, ShoppingBag, CheckCircle2, IndianRupee } from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    recentOrders: [] as Order[]
  });

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();
      const q = query(
        collection(db, 'orders'),
        where('status', '==', 'paid'),
        where('createdAt', '>=', startOfDay(today)),
        where('createdAt', '<=', endOfDay(today))
      );

      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      
      const total = orders.reduce((acc, curr) => acc + curr.total, 0);

      // Fetch recent 5 orders regardless of date
      const recentQ = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentSnapshot = await getDocs(recentQ);
      const recent = recentSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Order));

      setStats({
        totalSales: total,
        orderCount: orders.length,
        recentOrders: recent
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-primary">Sales Overview</h1>
          <p className="text-muted-foreground">Track your cafe performance for today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase opacity-80">Total Revenue (Today)</CardTitle>
              <TrendingUp className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">Rs. {stats.totalSales}</div>
              <p className="text-xs mt-1 opacity-80">Based on {stats.orderCount} paid orders</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Orders Count</CardTitle>
              <ShoppingBag className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{stats.orderCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed today</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Performance</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">Good</div>
              <p className="text-xs text-muted-foreground mt-1">Status is healthy</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm",
                        order.status === 'paid' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        T{order.tableNumber}
                      </div>
                      <div>
                        <div className="font-bold">Rs. {order.total}</div>
                        <div className="text-xs text-muted-foreground">{format(order.createdAt, 'hh:mm a')}</div>
                      </div>
                    </div>
                    <Badge variant={order.status === 'paid' ? "default" : "outline"} className={cn(
                      "font-bold",
                      order.status === 'paid' ? "bg-green-500 hover:bg-green-600" : "text-amber-600 border-amber-200 bg-amber-50"
                    )}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
                {stats.recentOrders.length === 0 && (
                  <p className="text-center py-10 text-muted-foreground">No recent activity found.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Sales Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex items-center justify-center bg-secondary/10 h-64">
              <div className="text-center p-6">
                <IndianRupee className="h-12 w-12 text-primary mx-auto mb-2 opacity-20" />
                <p className="text-muted-foreground text-sm">Visual sales trends will appear here as more data is collected over days.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
