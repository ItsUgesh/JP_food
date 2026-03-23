"use client"

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  ClipboardList, 
  Settings, 
  TrendingUp, 
  Utensils, 
  LogOut,
  Moon,
  Sun,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuth, useUser, useFirestore, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if user is admin for conditional rendering
  const { data: adminRole } = useDoc(
    user ? doc(firestore, 'roles_admin', user.uid) : null
  );

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = [
    { name: 'POS', href: '/pos', icon: ShoppingBag, roles: ['staff', 'admin'] },
    { name: 'Orders', href: '/orders', icon: ClipboardList, roles: ['staff', 'admin'] },
    { name: 'Admin', href: '/admin', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Menu', href: '/admin/menu', icon: Settings, roles: ['admin'] },
    { name: 'Reports', href: '/reports', icon: TrendingUp, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.roles.includes('admin') && !adminRole) return false;
    return true;
  });

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Utensils className="h-6 w-6" />
          </div>
          <span className="text-xl font-black tracking-tighter text-primary font-headline hidden sm:block">
            JP CAFE POS
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-4">
          <div className="hidden md:flex items-center gap-1">
            {filteredNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "gap-2 font-bold transition-all px-4",
                    pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary hover:bg-secondary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>

          <div className="h-6 w-px bg-border hidden md:block" />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full">
              {isDarkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-blue-500" />}
            </Button>
            {user && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:bg-destructive/10 rounded-full"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Nav */}
      <div className="flex md:hidden items-center justify-around border-t py-2 bg-background/50 backdrop-blur-lg">
        {filteredNavItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-3 py-1">
            <item.icon className={cn(
              "h-5 w-5 transition-colors",
              pathname === item.href ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              pathname === item.href ? "text-primary" : "text-muted-foreground"
            )}>{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
