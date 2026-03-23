"use client"

import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const stats = [
    { title: 'Total Menu Items', value: '42', icon: Settings, link: '/admin/menu', color: 'bg-blue-500' },
    { title: 'Orders Today', value: '18', icon: ShoppingBag, link: '/orders', color: 'bg-green-500' },
    { title: 'Staff Active', value: '3', icon: Users, link: '#', color: 'bg-purple-500' },
    { title: 'Today\'s Revenue', value: 'Rs. 12,450', icon: TrendingUp, link: '/reports', color: 'bg-amber-500' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground">Quick overview and management of your cafe operations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground">{stat.title}</CardTitle>
                <div className={`${stat.color} p-2 rounded-lg text-white`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{stat.value}</div>
                <Link href={stat.link}>
                  <Button variant="link" className="p-0 h-auto text-xs font-bold text-primary">View Details</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/admin/menu">
                <Button className="w-full h-24 flex-col gap-2 font-bold" variant="outline">
                  <Settings className="h-6 w-6" />
                  Manage Menu
                </Button>
              </Link>
              <Link href="/orders">
                <Button className="w-full h-24 flex-col gap-2 font-bold" variant="outline">
                  <ShoppingBag className="h-6 w-6" />
                  View Orders
                </Button>
              </Link>
              <Link href="/reports">
                <Button className="w-full h-24 flex-col gap-2 font-bold" variant="outline">
                  <TrendingUp className="h-6 w-6" />
                  Sales Reports
                </Button>
              </Link>
              <Button className="w-full h-24 flex-col gap-2 font-bold" variant="outline" disabled>
                <Users className="h-6 w-6" />
                Staff Access
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <span className="font-medium">Firestore Database</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <span className="font-medium">Authentication Service</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <span className="font-medium">Last Sync</span>
                <span className="text-muted-foreground text-sm">Just now</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
