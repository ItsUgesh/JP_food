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
  Save, 
  Eraser,
  RefreshCw
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
    return query(collection(firestore, 'menuItems'), orderBy('name', 'asc'));
  }, [firestore, user]);

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
      // Find existing pending order for this table
      const q = query(
        collection(firestore, 'orders'),
        where('tableNumber', '==', tableNumber.trim()),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // Merge items into existing order
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

        toast({ title: "Order Updated", description: `Added items to pending order for Table ${tableNumber}.` });
      } else {
        // Create a new order
        addDocumentNonBlocking(collection(firestore, 'orders'), {
          tableNumber: tableNumber.trim(),
          items: cart,
          total: cartTotal,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast({ title: "Order Placed", description: `New order for Table ${tableNumber} created.` });
      }

      setCart([]);
      setTableNumber('');
    } catch (error) {
      console.error(error);
      toast({ title: "Operation Failed", description: "Could not process order.", variant: "destructive" });
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Left Side: Menu Grid */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search menu items..." 
                className="pl-9 h-12 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full sm:w-auto">
              <TabsList className="w-full justify-start h-12 bg-muted/50">
                <TabsTrigger value="All" className="px-6 font-bold">All</TabsTrigger>
                <TabsTrigger value="Drinks" className="px-6 font-bold">Drinks</TabsTrigger>
                <TabsTrigger value="Snacks" className="px-6 font-bold">Snacks</TabsTrigger>
                <TabsTrigger value="Meals" className="px-6 font-bold">Meals</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1 pr-4">
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
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      <img 
                        src={`https://picsum.photos/seed/${item.id}/400/300`} 
                        alt={item.name}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                        data-ai-hint="food drink"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Plus className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-4 bg-card">
                      <h3 className="font-bold text-md mb-1 truncate">{item.name}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-primary font-black">Rs. {item.price}</span>
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-tighter">{item.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Side: Cart Panel */}
        <div className="w-full md:w-[400px] flex flex-col gap-4">
          <Card className="flex-1 flex flex-col shadow-xl border-none overflow-hidden bg-card">
            <div className="p-4 border-b flex items-center justify-between bg-primary text-primary-foreground">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                <h2 className="font-black text-lg tracking-tight">SHOPPING CART</h2>
              </div>
              <Badge variant="outline" className="text-white border-white/50">{cart.length} ITEMS</Badge>
            </div>

            <div className="p-4 bg-secondary/20">
              <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block tracking-widest">Table Number</label>
              <Input 
                placeholder="e.g. 5" 
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="font-black text-2xl h-14 text-center focus:ring-primary shadow-inner"
              />
            </div>

            <ScrollArea className="flex-1 p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground opacity-30">
                  <ShoppingCart className="h-16 w-16 mb-4" />
                  <p className="font-black uppercase tracking-widest text-xs">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group transition-colors">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                        <p className="text-xs text-muted-foreground font-medium">Rs. {item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-full border" 
                          onClick={() => updateQty(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-black">{item.qty}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-full border" 
                          onClick={() => updateQty(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-6 border-t bg-secondary/5 space-y-4">
              <div className="flex justify-between items-center border-t border-dashed pt-4">
                <span className="text-lg font-black uppercase text-muted-foreground">Total</span>
                <span className="text-3xl font-black text-primary tracking-tighter">Rs. {cartTotal}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-14 font-black tracking-widest uppercase text-xs gap-2"
                  onClick={() => { setCart([]); setTableNumber(''); }}
                  disabled={isPlacing || (cart.length === 0 && !tableNumber)}
                >
                  <Eraser className="h-4 w-4" /> Reset
                </Button>
                <Button 
                  className="h-14 font-black tracking-widest uppercase text-xs gap-2 shadow-lg shadow-primary/20"
                  onClick={handleConfirmOrder}
                  disabled={isPlacing || cart.length === 0}
                >
                  {isPlacing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isPlacing ? "Processing" : "Place Order"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
