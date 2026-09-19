import React, { useState } from 'react';
import { useProducts, useSaveProduct, useDeleteProduct } from '@/hooks/use-pos';
import { Button, Input, Card, Badge, Label } from '@/components/ui/primitives';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { formatIDR } from '@/lib/utils';
import { Plus, Search, Edit, Trash2, Tag, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { Product, WholesaleTier } from '@/lib/db';

export default function Products() {
  const { data: products = [], isLoading } = useProducts();
  const saveProduct = useSaveProduct();
  const deleteProduct = useDeleteProduct();
  const { activeBranchId } = useAppStore();
  
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const emptyForm = {
    sku: '', barcode: '', name: '', category: 'Sembako', unit: 'pcs',
    cost: '', price: '', stock: '', minStock: '5', shopeeEnabled: false,
  };
  const [formData, setFormData] = useState(emptyForm);
  const [wholesaleTiers, setWholesaleTiers] = useState<WholesaleTier[]>([]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        sku: product.sku,
        barcode: product.barcode || '',
        name: product.name,
        category: product.category,
        unit: product.unit || 'pcs',
        cost: (product.cost || '').toString(),
        price: product.price.toString(),
        stock: (product.stock[activeBranchId || ''] || 0).toString(),
        minStock: (product.minStock ?? 5).toString(),
        shopeeEnabled: product.shopeeEnabled || false,
      });
      setWholesaleTiers(product.wholesaleTiers || []);
    } else {
      setEditingId(null);
      setFormData(emptyForm);
      setWholesaleTiers([]);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim() || !formData.price || !formData.category.trim()) {
      toast.error('Mohon lengkapi data produk');
      return;
    }
    const retailPrice = Number(formData.price);
    const cost = Number(formData.cost || 0);
    const validTiers = wholesaleTiers
      .filter((tier) => tier.minQty > 1 && tier.price > 0)
      .sort((a, b) => a.minQty - b.minQty);
    if (new Set(validTiers.map((tier) => tier.minQty)).size !== validTiers.length) {
      toast.error('Jumlah minimum setiap tingkat grosir harus berbeda');
      return;
    }
    if (validTiers.some((tier) => tier.price > retailPrice)) {
      toast.error('Harga grosir tidak boleh lebih tinggi dari harga eceran');
      return;
    }

    saveProduct.mutate({
      id: editingId || undefined,
      sku: formData.sku,
      barcode: formData.barcode.trim(),
      name: formData.name.trim().slice(0, 100),
      category: formData.category.trim().slice(0, 40),
      unit: formData.unit.trim().slice(0, 20),
      cost,
      price: retailPrice,
      stock: { ...(products.find((p) => p.id === editingId)?.stock || {}), [activeBranchId || '']: Number(formData.stock || 0) },
      minStock: Number(formData.minStock || 0),
      shopeeEnabled: formData.shopeeEnabled,
      wholesaleTiers: validTiers,
    }, {
      onSuccess: () => setIsModalOpen(false)
    });
  };

  const setNumericField = (field: 'cost' | 'price' | 'stock' | 'minStock', value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value.replace(/\D/g, '').slice(0, 12) }));
  };

  const addTier = () => {
    if (wholesaleTiers.length >= 5) return;
    const last = wholesaleTiers.at(-1);
    setWholesaleTiers([...wholesaleTiers, { minQty: (last?.minQty || 1) + 5, price: Math.max(0, Number(formData.price || 0) - 500) }]);
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

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Produk' : 'Tambah Produk Baru'} maxWidth="max-w-4xl">
         <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
             <Label>Nama Produk *</Label>
             <Input className="h-11" maxLength={100} value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Contoh: Penggaris 30 cm" required />
          </div>
           <div className="grid md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>SKU (Kode Produk Unik) *</Label>
               <Input className="h-11" maxLength={30} value={formData.sku} onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') }))} placeholder="SKU-5269" required />
             </div>
             <div className="space-y-2">
               <Label>Barcode (EAN-13 / UPC)</Label>
               <Input className="h-11" inputMode="numeric" value={formData.barcode} onChange={e => setFormData(prev => ({ ...prev, barcode: e.target.value.replace(/\D/g, '').slice(0, 18) }))} placeholder="8992775112012" />
             </div>
          </div>
           <div className="grid md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Kategori</Label>
               <Input className="h-11" maxLength={40} value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} />
             </div>
             <div className="space-y-2">
               <Label>Satuan</Label>
               <Input className="h-11" maxLength={20} value={formData.unit} onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))} placeholder="pcs, pack, dus" />
             </div>
           </div>
           <div className="border-t pt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
             {([
               ['cost', 'Harga Beli (HPP)'],
               ['price', 'Harga Jual Eceran *'],
               ['stock', 'Stok Tersedia'],
               ['minStock', 'Batas Stok Menipis'],
             ] as const).map(([field, label]) => (
               <div className="space-y-2" key={field}>
                 <Label>{label}</Label>
                 <div className="relative">
                   {(field === 'cost' || field === 'price') && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>}
                   <Input className={`h-11 ${(field === 'cost' || field === 'price') ? 'pl-9' : ''}`} inputMode="numeric" value={formData[field]} onChange={(e) => setNumericField(field, e.target.value)} required={field === 'price'} />
                 </div>
               </div>
             ))}
           </div>

           <div className="rounded-2xl border border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-4">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
               <div>
                 <h3 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2"><Tag className="h-4 w-4" /> Harga Grosir Bertingkat (Opsional)</h3>
                 <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Harga otomatis berubah di kasir saat jumlah beli mencapai batas minimum.</p>
               </div>
               <Button type="button" size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={addTier} disabled={wholesaleTiers.length >= 5 || !formData.price}>
                 <Plus className="h-4 w-4 mr-1" /> Tambah Tingkat
               </Button>
             </div>
             {wholesaleTiers.length === 0 && <p className="text-sm text-amber-700/70 text-center py-3">Belum ada harga grosir.</p>}
             {wholesaleTiers.map((tier, index) => (
               <div className="grid grid-cols-[90px_1fr_1fr_40px] gap-2 items-center" key={index}>
                 <Label className="text-amber-900 dark:text-amber-200">Tingkat {index + 1}</Label>
                 <div className="relative">
                   <Input inputMode="numeric" value={tier.minQty || ''} onChange={(e) => setWholesaleTiers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, minQty: Number(e.target.value.replace(/\D/g, '').slice(0, 6)) } : item))} />
                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">unit</span>
                 </div>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                   <Input className="pl-9" inputMode="numeric" value={tier.price || ''} onChange={(e) => setWholesaleTiers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: Number(e.target.value.replace(/\D/g, '').slice(0, 12)) } : item))} />
                 </div>
                 <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => setWholesaleTiers((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
               </div>
             ))}
             {wholesaleTiers.some((tier) => tier.price > 0 && tier.price < Number(formData.cost || 0)) && <p className="text-xs text-destructive">Peringatan: ada harga grosir yang lebih rendah dari HPP.</p>}
           </div>

           <label className="rounded-xl border bg-muted/20 p-4 flex items-center justify-between gap-4 cursor-pointer">
             <div>
               <p className="font-semibold flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-[#ee4d2d]" /> Jual & Sinkronkan ke Shopee</p>
               <p className="text-xs text-muted-foreground mt-1">Stok offline di kasir akan dicerminkan ke toko Shopee.</p>
             </div>
             <input type="checkbox" className="h-5 w-5 accent-primary" checked={formData.shopeeEnabled} onChange={(e) => setFormData((previous) => ({ ...previous, shopeeEnabled: e.target.checked }))} />
           </label>
           <div className="pt-4 border-t flex justify-end gap-2 sticky bottom-0 bg-card">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
             <Button type="submit" disabled={saveProduct.isPending}>{editingId ? 'Simpan Perubahan' : 'Tambah Produk'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}