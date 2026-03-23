"use client"

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { Order } from '@/types';
import { format } from 'date-fns';
import { Printer, CheckCircle2, Clock, Wallet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Receipt } from '@/components/receipt/Receipt';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
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
    });
    setIsPaymentDialogOpen(false);
    setSelectedOrder(null);
    toast({ title: "Payment Recorded", description: "Order has been marked as paid." });
  };

  const handlePrint = (order: Order) => {
    setOrderToPrint(order);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const pendingOrders = (orders || []).filter(o => o.status === 'pending');
  const paidOrders = (orders || []).filter(o => o.status === 'paid');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl font-black text-primary">Orders Management</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          </div>
        ) : (
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="bg-secondary/30 p-1">
              <TabsTrigger value="pending" className="gap-2 px-6">
                Pending
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                  {pendingOrders.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="paid" className="gap-2 px-6">
                Paid
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                  {paidOrders.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onPay={() => handleMarkAsPaid(order)}
                  />
                ))}
                {pendingOrders.length === 0 && (
                  <div className="col-span-full text-center py-20 bg-secondary/10 rounded-xl border-2 border-dashed">
                    <p className="text-muted-foreground">No pending orders found.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="paid">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paidOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onPrint={() => handlePrint(order)}
                  />
                ))}
                {paidOrders.length === 0 && (
                  <div className="col-span-full text-center py-20 bg-secondary/10 rounded-xl border-2 border-dashed">
                    <p className="text-muted-foreground">No paid orders found.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Complete Payment
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg">
              <span className="font-medium">Amount to Pay</span>
              <span className="text-2xl font-black text-primary">Rs. {selectedOrder?.total}</span>
            </div>
            <div className="space-y-3">
              <Label className="font-bold text-sm uppercase text-muted-foreground">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                  <Label
                    htmlFor="cash"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="text-lg font-bold">Cash</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="esewa" id="esewa" className="peer sr-only" />
                  <Label
                    htmlFor="esewa"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="text-lg font-bold text-emerald-600">eSewa</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmPayment} className="px-8">Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="hidden">
        {orderToPrint && <Receipt order={orderToPrint} />}
      </div>
    </div>
  );
}

function OrderCard({ order, onPay, onPrint }: { order: Order, onPay?: () => void, onPrint?: () => void }) {
  const isPaid = order.status === 'paid';
  const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : (order.createdAt instanceof Date ? order.createdAt : new Date());
  
  return (
    <Card className="shadow-sm border-none overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className={cn(
        "py-3 flex flex-row items-center justify-between space-y-0",
        isPaid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
      )}>
        <CardTitle className="text-lg font-bold">Table {order.tableNumber}</CardTitle>
        <Badge variant={isPaid ? "default" : "secondary"} className={cn(
          "font-bold px-3",
          isPaid ? "bg-green-500 hover:bg-green-600" : "bg-amber-500 hover:bg-amber-600 text-white"
        )}>
          {order.status.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 bg-card">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Clock className="h-3 w-3" />
            {format(orderDate, 'hh:mm a, dd MMM')}
          </div>
          
          <div className="border-y border-dashed py-3 my-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-0.5">
                <span className="text-muted-foreground">{item.qty}x {item.name}</span>
                <span className="font-medium">Rs. {item.price * item.qty}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <span className="font-bold">Total</span>
            <span className="text-xl font-black text-primary">Rs. {order.total}</span>
          </div>

          <div className="pt-2 flex gap-2">
            {!isPaid && (
              <Button className="flex-1 font-bold gap-2" onClick={onPay}>
                <CheckCircle2 className="h-4 w-4" />
                Mark as Paid
              </Button>
            )}
            {isPaid && (
              <Button variant="outline" className="flex-1 font-bold gap-2" onClick={onPrint}>
                <Printer className="h-4 w-4" />
                Print Bill
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
