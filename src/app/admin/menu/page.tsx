"use client"

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { MenuItem } from '@/types';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function MenuAdminPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', category: 'Drinks' });
  const { toast } = useToast();
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

  const menuQuery = useMemoFirebase(() => {
    if (!user || !myAdminRole) return null;
    return query(collection(firestore, 'menu_items'), orderBy('name', 'asc'));
  }, [firestore, user, myAdminRole]);

  const { data: items, isLoading } = useCollection<MenuItem>(menuQuery);

  const handleSave = () => {
    if (!formData.name || !formData.price || isNaN(parseFloat(formData.price))) {
      toast({ title: "Validation Error", description: "Valid name and numeric price required.", variant: "destructive" });
      return;
    }

    const itemData = {
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      updatedAt: serverTimestamp()
    };

    if (editingItem) {
      updateDocumentNonBlocking(doc(firestore, 'menu_items', editingItem.id), itemData);
      toast({ title: "Updating...", description: "Changes are being saved." });
    } else {
      addDocumentNonBlocking(collection(firestore, 'menu_items'), {
        ...itemData,
        createdAt: serverTimestamp()
      });
      toast({ title: "Creating...", description: "Adding new menu item." });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this item?')) {
      deleteDocumentNonBlocking(doc(firestore, 'menu_items', id));
      toast({ title: "Deleting...", description: "Item is being removed." });
    }
  };

  const filteredItems = (items || []).filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  if (isUserLoading || isAdminLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  if (!myAdminRole) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-primary">Menu Catalog</h1>
            <p className="text-muted-foreground">Admin: Manage items available in the POS.</p>
          </div>
          <Button onClick={() => { setEditingItem(null); setFormData({ name: '', price: '', category: 'Drinks' }); setIsDialogOpen(true); }} className="gap-2 font-bold h-12 shadow-lg shadow-primary/20">
            <Plus className="h-5 w-5" /> Add Item
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-sm border p-6">
          <div className="relative max-w-sm mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search catalog..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow>
                  <TableHead className="font-bold">Name</TableHead>
                  <TableHead className="font-bold">Category</TableHead>
                  <TableHead className="font-bold">Price</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" /></TableCell></TableRow>
                ) : filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>Rs. {item.price}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setFormData({ name: item.name, price: item.price.toString(), category: item.category }); setIsDialogOpen(true); }}>
                        <Edit2 className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? 'Edit Item' : 'New Item'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase text-muted-foreground">Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase text-muted-foreground">Category</label>
                <Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase text-muted-foreground">Price</label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}