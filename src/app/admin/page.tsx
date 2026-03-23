"use client"

import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, ShoppingBag, TrendingUp, Users, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function AdminDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  // Memoize the document reference to prevent infinite loops
  const adminRoleRef = useMemoFirebase(() => 
    user ? doc(firestore, 'roles_admin', user.uid) : null,
    [firestore, user]
  );

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef);

  const bootstrapAdmin = () => {
    if (!user) return;
    setIsBootstrapping(true);
    
    // Create the role entry in roles_admin
    setDocumentNonBlocking(doc(firestore, 'roles_admin', user.uid), {
      id: user.uid,
      name: user.displayName || 'Admin User',
      email: user.email,
      role: 'admin',
      assignedAt: serverTimestamp()
    }, { merge: true });

    // Also ensure a profile exists in /users
    setDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      id: user.uid,
      name: user.displayName || 'Admin User',
      email: user.email,
      role: 'admin',
      updatedAt: serverTimestamp()
    }, { merge: true });

    toast({ 
      title: "Role Requested", 
      description: "Admin privileges are being assigned to your account." 
    });
    
    setTimeout(() => setIsBootstrapping(false), 2000);
  };

  const stats = [
    { title: 'Total Menu Items', value: '...', icon: Settings, link: '/admin/menu', color: 'bg-blue-500' },
    { title: 'Orders Today', value: '...', icon: ShoppingBag, link: '/orders', color: 'bg-green-500' },
    { title: 'Staff Active', value: '...', icon: Users, link: '#', color: 'bg-purple-500' },
    { title: 'Today\'s Revenue', value: '...', icon: TrendingUp, link: '/reports', color: 'bg-amber-500' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground">Quick overview and management of your cafe operations.</p>
          </div>

          {!isAdminLoading && !adminRole && (
            <Card className="border-primary/20 bg-primary/5 max-w-md">
              <CardContent className="p-4 flex items-center gap-4">
                <ShieldAlert className="h-10 w-10 text-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">Permissions Required</p>
                  <p className="text-xs text-muted-foreground mb-2">You don't have the admin role assigned yet.</p>
                  <Button 
                    size="sm" 
                    variant="default" 
                    onClick={bootstrapAdmin} 
                    disabled={isBootstrapping}
                    className="h-8 font-bold"
                  >
                    {isBootstrapping ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                    Assign Admin Role
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
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
                <Button className="w-full h-24 flex-col gap-2 font-bold" variant="outline" disabled={!adminRole}>
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
                <span className="font-medium">Admin Role</span>
                {isAdminLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                ) : adminRole ? (
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Verified
                  </span>
                ) : (
                  <span className="text-destructive font-bold">Unassigned</span>
                )}
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <span className="font-medium">Firestore Database</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <span className="font-medium">Authentication</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  {user ? "Authenticated" : "Not Signed In"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
