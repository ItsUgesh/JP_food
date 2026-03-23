"use client"

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  Search, 
  Loader2, 
  UtensilsCrossed
} from 'lucide-react';
import { MenuItem, OrderItem, Order } from '@/types';
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useUser,
  addDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, serverTimestamp, query, orderBy, where, getDocs, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const menuQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'menu_items'), orderBy('name', 'asc'));
  }, [firestore, user]);

  const { data: menuItems, isLoading } = useCollection<MenuItem>(menuQuery);

  const categories = ['All', ...Array.from(new Set((menuItems || []).map(i => i.category)))];

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

  const handleConfirmOrder = async () => {
    if (!tableNumber.trim()) {
      toast({ title: "Table Required", description: "Please enter a table number.", variant: "destructive" });
      return;
    }
    if (cart.length === 0) {
      toast({ title: "Cart Empty", description: "Please add items to your cart.", variant: "destructive" });
      return;
    }

    setIsPlacing(true);
    try {
      const q = query(
        collection(firestore, 'orders'),
        where('tableNumber', '==', tableNumber.trim()),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const existingOrderDoc = snapshot.docs[0];
        const existingOrder = existingOrderDoc.data() as Order;
        const mergedItems = [...existingOrder.items];
        
        cart.forEach(newCartItem => {
          const index = mergedItems.findIndex(ei => ei.id === newCartItem.id);
          if (index > -1) {
            mergedItems[index].qty += newCartItem.qty;
          } else {
            mergedItems.push(newCartItem);
          }
        });

        const newTotal = mergedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

        updateDocumentNonBlocking(doc(firestore, 'orders', existingOrderDoc.id), {
          items: mergedItems,
          total: newTotal,
          updatedAt: serverTimestamp()
        });

        toast({ title: "Order Merged", description: `Added items to Table ${tableNumber}.` });
      } else {
        addDocumentNonBlocking(collection(firestore, 'orders'), {
          tableNumber: tableNumber.trim(),
          items: cart,
          total: cartTotal,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast({ title: "Order Created", description: `New order for Table ${tableNumber}.` });
      }

      setCart([]);
      setTableNumber('');
    } catch (error) {
      toast({ title: "Error", description: "Could not process order.", variant: "destructive" });
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 flex flex-col lg:flex-row gap-6 overflow-hidden h-[calc(100vh-4rem)]">
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search menu..." 
                className="pl-9 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="w-full sm:w-auto">
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <TabsList className="h-11 flex justify-start">
                  {categories.map(cat => (
                    <TabsTrigger key={cat} value={cat} className="text-xs font-bold whitespace-nowrap">{cat}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </ScrollArea>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {filteredItems.map(item => (
                  <Card 
                    key={item.id} 
                    className="cursor-pointer hover:border-primary/50 transition-all shadow-sm border-none group"
                    onClick={() => addToCart(item)}
                  >
                    <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
                      <img 
                        src={`https://picsum.photos/seed/${item.id}/400/300`} 
                        alt={item.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-bold text-sm line-clamp-1">{item.name}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-primary font-black text-sm">Rs. {item.price}</span>
                        <Badge variant="secondary" className="text-[9px] uppercase">{item.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="w-full lg:w-[380px] flex flex-col gap-4">
          <Card className="flex-1 flex flex-col border-none shadow-lg overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h2 className="font-black text-sm tracking-tight uppercase">Order Summary</h2>
              </div>
              <Badge variant="outline" className="font-bold">{cart.length} items</Badge>
            </div>

            <div className="p-4 bg-muted/20 border-b space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Table Number</label>
              <Input 
                placeholder="Table #" 
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="font-black text-xl h-12 text-center"
              />
            </div>

            <ScrollArea className="flex-1 p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground/40">
                  <UtensilsCrossed className="h-12 w-12 mb-3" />
                  <p className="font-bold text-xs uppercase tracking-widest">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 group">
                      <div className="flex-1">
                        <h4 className="font-bold text-xs leading-tight">{item.name}</h4>
                        <p className="text-[10px] text-muted-foreground">Rs. {item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => updateQty(item.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-4 text-center text-xs font-black">{item.qty}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => updateQty(item.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t bg-muted/5 space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black uppercase text-muted-foreground">Subtotal</span>
                <span className="text-2xl font-black text-primary tracking-tighter">Rs. {cartTotal}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-11 font-black uppercase text-[10px] tracking-widest" onClick={() => { setCart([]); setTableNumber(''); }} disabled={isPlacing || cart.length === 0}>
                  Clear
                </Button>
                <Button className="h-11 font-black uppercase text-[10px] tracking-widest" onClick={handleConfirmOrder} disabled={isPlacing || cart.length === 0}>
                  {isPlacing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Place Order"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
