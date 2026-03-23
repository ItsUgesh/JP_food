"use client"

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, Trash2, ShoppingCart, Search, Loader2 } from 'lucide-react';
import { MenuItem, OrderItem } from '@/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase';

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();

  const menuQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'menuItems'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: menuItems, isLoading } = useCollection<MenuItem>(menuQuery);

  const filteredItems = (menuItems || []).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const placeOrder = () => {
    if (!tableNumber) {
      toast({ title: "Table Required", description: "Please enter a table number.", variant: "destructive" });
      return;
    }
    if (cart.length === 0) {
      toast({ title: "Cart Empty", description: "Please add items to your cart.", variant: "destructive" });
      return;
    }

    addDocumentNonBlocking(collection(firestore, 'orders'), {
      tableNumber,
      items: cart,
      total: cartTotal,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    setCart([]);
    setTableNumber('');
    toast({ title: "Order Placed", description: `Order for Table ${tableNumber} has been created.` });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Left Side: Menu */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search menu items..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full sm:w-auto">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="All">All</TabsTrigger>
                <TabsTrigger value="Drinks">Drinks</TabsTrigger>
                <TabsTrigger value="Snacks">Snacks</TabsTrigger>
                <TabsTrigger value="Meals">Meals</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {filteredItems.map(item => (
                  <Card 
                    key={item.id} 
                    className="group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all border-none shadow-sm overflow-hidden"
                    onClick={() => addToCart(item)}
                  >
                    <div className="aspect-[4/3] bg-muted relative">
                      <img 
                        src={`https://picsum.photos/seed/${item.id}/400/300`} 
                        alt={item.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        data-ai-hint="food drink"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <Button size="sm" className="w-full font-bold">Add to Order</Button>
                      </div>
                    </div>
                    <CardContent className="p-4 bg-card">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-primary font-bold">Rs. {item.price}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">{item.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {!isLoading && filteredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p>No items found.</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Side: Cart */}
        <div className="w-full md:w-[400px] flex flex-col gap-4">
          <Card className="flex-1 flex flex-col shadow-lg border-primary/10">
            <CardContent className="p-0 flex flex-col h-full">
              <div className="p-4 border-b flex items-center justify-between bg-primary text-primary-foreground">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <h2 className="font-bold text-lg">Current Order</h2>
                </div>
                <Badge variant="secondary" className="font-bold">{cart.length} items</Badge>
              </div>

              <div className="p-4 border-b bg-secondary/30">
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Table Number</label>
                <Input 
                  placeholder="e.g. 12" 
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="font-bold text-lg h-12"
                />
              </div>

              <ScrollArea className="flex-1 p-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground opacity-50">
                    <ShoppingCart className="h-12 w-12 mb-2" />
                    <p>No items in cart</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">Rs. {item.price} x {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t bg-secondary/10 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">Rs. {cartTotal}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-black text-primary">Rs. {cartTotal}</span>
                </div>
                <Button 
                  className="w-full h-14 text-lg font-bold mt-2 shadow-lg"
                  onClick={placeOrder}
                >
                  Confirm Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
