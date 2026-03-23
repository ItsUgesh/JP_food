"use client"

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { DailyReport } from '@/types';
import { Loader2, TrendingUp, TrendingDown, Target, Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function InsightsPage() {
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

  const reportsQuery = useMemoFirebase(() => {
    if (!user || !myAdminRole) return null;
    return query(collection(firestore, 'daily_reports'), orderBy('date', 'desc'), limit(30));
  }, [firestore, user, myAdminRole]);

  const { data: reports, isLoading } = useCollection<DailyReport>(reportsQuery);

  const chartData = [...(reports || [])].reverse();
  
  const COLORS = ['#994729', '#10b981']; // Primary (Earth Red) and Emerald
  
  const paymentBreakdown = reports && reports.length > 0 ? [
    { name: 'Cash', value: reports.reduce((acc, curr) => acc + curr.cashRevenue, 0) },
    { name: 'eSewa', value: reports.reduce((acc, curr) => acc + curr.esewaRevenue, 0) },
  ] : [];

  const calculateKPI = () => {
    if (!reports || reports.length < 2) return { label: 'Average', color: 'text-amber-500', icon: Activity, growth: 0 };
    
    const currentTotal = reports[0].totalRevenue;
    const previousTotal = reports[1].totalRevenue;
    const growth = previousTotal === 0 ? 0 : ((currentTotal - previousTotal) / previousTotal) * 100;

    if (growth > 20) return { label: 'Excellent', color: 'text-emerald-500', icon: Zap, growth };
    if (growth > 5) return { label: 'Good', color: 'text-blue-500', icon: TrendingUp, growth };
    if (growth > -5) return { label: 'Average', color: 'text-amber-500', icon: Activity, growth };
    return { label: 'Poor', color: 'text-destructive', icon: TrendingDown, growth };
  };

  const kpi = calculateKPI();

  if (isUserLoading || isAdminLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  if (!myAdminRole) {
    return null; // Effect will handle redirect
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Business Insights</h1>
            <p className="text-muted-foreground text-sm">Growth metrics and historical revenue trends.</p>
          </div>
          <Badge className={cn("px-4 py-2 gap-2 text-sm font-black uppercase", kpi.color, "bg-secondary")}>
            {kpi.icon && <kpi.icon className="h-4 w-4" />}
            Performance: {kpi.label}
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-40"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" /></div>
        ) : !reports || reports.length === 0 ? (
          <Card className="p-20 text-center border-dashed border-2">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground font-bold">Historical data is being aggregated. Check back tomorrow.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm h-[400px]">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase text-muted-foreground">Revenue Trend (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip 
                      contentStyle={{backgroundColor: 'hsl(var(--background))', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      labelClassName="font-black text-xs mb-1"
                    />
                    <Line type="monotone" dataKey="totalRevenue" stroke="#994729" strokeWidth={3} dot={{r: 4, fill: '#994729'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm h-[400px]">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase text-muted-foreground">Payment Mix</CardTitle>
                <CardDescription className="text-xs">Cash vs eSewa distribution</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase text-muted-foreground">Detailed Daily Aggregates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(reports || []).slice(0, 4).map((report) => (
                    <div key={report.id} className="p-4 rounded-xl bg-secondary/50 border border-primary/5 space-y-2">
                      <div className="text-[10px] font-black uppercase text-muted-foreground">{report.date}</div>
                      <div className="text-xl font-black text-primary">Rs. {report.totalRevenue}</div>
                      <div className="flex justify-between text-[9px] font-bold">
                        <span className="text-muted-foreground">Cash: Rs. {report.cashRevenue}</span>
                        <span className="text-emerald-600">eSewa: Rs. {report.esewaRevenue}</span>
                      </div>
                      <div className="text-[10px] font-bold opacity-70">{report.numberOfOrders} Orders settled</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}