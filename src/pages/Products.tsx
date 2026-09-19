import React, { useState } from 'react';
import { useProducts, useSaveProduct, useDeleteProduct } from '@/hooks/use-pos';
import { Button, Input, Card, Badge, Label } from '@/components/ui/primitives';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { formatIDR } from '@/lib/utils';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Products() {
  const { data: products = [], isLoading } = useProducts();
  const saveProduct = useSaveProduct();
  const deleteProduct = useDeleteProduct();
  
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    sku: '', name: '', category: '', price: ''
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (product?: any) => {
    if (product) {
      setEditingId(product.id);
      setFormData({ sku: product.sku, name: product.name, category: product.category, price: product.price.toString() });
    } else {
      setEditingId(null);
      setFormData({ sku: '', name: '', category: 'Minuman', price: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Mohon lengkapi data produk');
      return;
    }

    saveProduct.mutate({
      id: editingId || undefined,
      sku: formData.sku,
      name: formData.name,
      category: formData.category,
      price: parseInt(formData.price)
    }, {
      onSuccess: () => setIsModalOpen(false)
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus produk ini?')) {
      deleteProduct.mutate(id);
    }
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col overflow-hidden bg-muted/10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Katalog Produk</h1>
          <p className="text-muted-foreground">Kelola daftar produk dan harga</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Tambah Produk
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari SKU atau nama produk..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="w-[100px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                  <TableCell className="text-right font-semibold">{formatIDR(p.price)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenModal(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Tidak ada produk ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Produk' : 'Tambah Produk'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>SKU (Opsional)</Label>
            <Input value={formData.sku} onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))} placeholder="Kosongkan untuk auto-generate" />
          </div>
          <div className="space-y-2">
            <Label>Nama Produk</Label>
            <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Input value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Harga (Rp)</Label>
            <Input type="number" value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} required />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={saveProduct.isPending}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
