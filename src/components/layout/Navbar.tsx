"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShoppingBag, 
  ClipboardList, 
  Settings, 
  TrendingUp, 
  Utensils, 
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
  };

  const navItems = [
    { name: 'POS', href: '/pos', icon: ShoppingBag },
    { name: 'Orders', href: '/orders', icon: ClipboardList },
    { name: 'Menu', href: '/admin/menu', icon: Settings },
    { name: 'Reports', href: '/reports', icon: TrendingUp },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Utensils className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary font-headline hidden sm:block">
            JP Cafe POS
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-4">
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "gap-2 font-medium transition-colors",
                    pathname === item.href ? "bg-secondary text-primary" : "text-muted-foreground hover:text-primary"
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
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Nav */}
      <div className="flex md:hidden items-center justify-around border-t py-2 bg-background">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-3">
            <item.icon className={cn(
              "h-5 w-5",
              pathname === item.href ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-[10px] font-medium",
              pathname === item.href ? "text-primary" : "text-muted-foreground"
            )}>{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
