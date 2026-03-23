"use client"

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useUser, 
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { Order, OrderItem } from '@/types';
import { format } from 'date-fns';
import { 
  Printer, 
  CheckCircle2, 
  Clock, 
  Wallet, 
  Loader2, 
  Edit3, 
  Trash2, 
  Plus, 
  Minus 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Receipt } from '@/components/receipt/Receipt';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItems, setEditingItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'esewa'>('cash');
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

  const handleMarkAsPaid = (order: Order) => {
    setSelectedOrder(order);
    setIsPaymentDialogOpen(true);
  };

  const confirmPayment = () => {
    if (!selectedOrder) return;
    updateDocumentNonBlocking(doc(firestore, 'orders', selectedOrder.id), {
      status: 'paid',
      paymentMethod,
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setIsPaymentDialogOpen(false);
    setSelectedOrder(null);
    toast({ title: "Order Settled", description: "Payment has been recorded successfully." });
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditingItems([...order.items]);
    setIsEditDialogOpen(true);
  };

  const updateEditQty = (itemId: string, delta: number) => {
    setEditingItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    }));
  };

  const removeEditItem = (itemId: string) => {
    setEditingItems(prev => prev.filter(i => i.id !== itemId));
  };

  const saveEditedOrder = () => {
    if (!selectedOrder) return;
    const newTotal = editingItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
    updateDocumentNonBlocking(doc(firestore, 'orders', selectedOrder.id), {
      items: editingItems,
      total: newTotal,
      updatedAt: serverTimestamp()
    });
    
    setIsEditDialogOpen(false);
    toast({ title: "Order Updated", description: "Modifications saved." });
  };

  const handlePrint = (order: Order) => {
    setOrderToPrint(order);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const pendingOrders = (orders || []).filter(o => o.status === 'pending');
  const paidOrders = (orders || []).filter(o => o.status === 'paid');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-primary">Order Tracking</h1>
          <p className="text-muted-foreground">Monitor and settle customer transactions.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          </div>
        ) : (
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="bg-muted p-1 h-12">
              <TabsTrigger value="pending" className="gap-2 px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                Pending
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                  {pendingOrders.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="paid" className="gap-2 px-8 font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                Settled
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                  {paidOrders.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pendingOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onPay={() => handleMarkAsPaid(order)}
                  onEdit={() => handleEditOrder(order)}
                />
              ))}
              {pendingOrders.length === 0 && (
                <div className="col-span-full text-center py-24 bg-muted/20 rounded-2xl border-2 border-dashed">
                  <p className="text-muted-foreground font-bold italic">No active orders found.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="paid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paidOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onPrint={() => handlePrint(order)}
                />
              ))}
              {paidOrders.length === 0 && (
                <div className="col-span-full text-center py-24 bg-muted/20 rounded-2xl border-2 border-dashed">
                  <p className="text-muted-foreground font-bold italic">No settled orders in history.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Payment Settlement Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black">
              Settle Payment
            </DialogTitle>
            <DialogDescription>Finalizing bill for Table {selectedOrder?.tableNumber}.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="flex justify-between items-center p-6 bg-secondary/30 rounded-xl border border-primary/10">
              <span className="font-bold text-muted-foreground">TOTAL BILL</span>
              <span className="text-4xl font-black text-primary">Rs. {selectedOrder?.total}</span>
            </div>
            <div className="space-y-3">
              <Label className="font-black text-[10px] uppercase text-muted-foreground">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 border p-4 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary">
                  <RadioGroupItem value="cash" id="cash-opt" />
                  <Label htmlFor="cash-opt" className="flex-1 cursor-pointer font-bold">CASH</Label>
                </div>
                <div className="flex items-center space-x-2 border p-4 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-emerald-500">
                  <RadioGroupItem value="esewa" id="esewa-opt" />
                  <Label htmlFor="esewa-opt" className="flex-1 cursor-pointer font-bold text-emerald-600">eSEWA</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmPayment} className="px-10 font-black tracking-widest h-12 uppercase">Complete Bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Edit Table {selectedOrder?.tableNumber}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] py-4">
            <div className="space-y-4 pr-4">
              {editingItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-secondary/20 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">Rs. {item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateEditQty(item.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-black">{item.qty}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateEditQty(item.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeEditItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="border-t pt-4">
            <div className="flex-1">
              <span className="text-xs font-bold text-muted-foreground uppercase">Recalculated Total</span>
              <p className="text-xl font-black text-primary">Rs. {editingItems.reduce((acc, i) => acc + (i.price * i.qty), 0)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveEditedOrder} className="font-bold">Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printing Area */}
      <div className="hidden">
        {orderToPrint && <Receipt order={orderToPrint} />}
      </div>
    </div>
  );
}

function OrderCard({ order, onPay, onPrint, onEdit }: { order: Order, onPay?: () => void, onPrint?: () => void, onEdit?: () => void }) {
  const isPaid = order.status === 'paid';
  const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
  
  return (
    <Card className="shadow-sm border-none hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-primary">
      <CardHeader className={cn(
        "py-4 flex flex-row items-center justify-between",
        isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      )}>
        <div>
          <CardTitle className="text-xl font-black uppercase">TABLE {order.tableNumber}</CardTitle>
          <div className="flex items-center gap-1 text-[10px] font-bold opacity-70">
            <Clock className="h-3 w-3" />
            {format(orderDate, 'hh:mm a')}
          </div>
        </div>
        <Badge className={cn(
          "font-black px-3 h-6 text-[10px] uppercase",
          isPaid ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600 text-white"
        )}>
          {order.status}
        </Badge>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <ScrollArea className="h-[100px]">
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground"><span className="font-black text-primary">{item.qty}x</span> {item.name}</span>
                <span className="font-bold">Rs. {item.price * item.qty}</span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-dashed pt-4 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-muted-foreground">Total</span>
            <span className="text-2xl font-black text-primary">Rs. {order.total}</span>
          </div>
          
          <div className="flex gap-2">
            {!isPaid && (
              <>
                <Button size="icon" variant="secondary" className="h-10 w-10" onClick={onEdit}>
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button size="sm" className="h-10 px-4 font-black uppercase text-[10px] tracking-widest" onClick={onPay}>
                  SETTLE
                </Button>
              </>
            )}
            {isPaid && (
              <Button variant="outline" size="sm" className="h-10 font-black uppercase text-[10px] gap-2" onClick={onPrint}>
                <Printer className="h-4 w-4" /> BILL
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
