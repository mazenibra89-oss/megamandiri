import React, { useState } from 'react';
import { useProducts, useUpdateStock } from '@/hooks/use-pos';
import { useAppStore } from '@/lib/store';
import { Button, Input, Card, Badge } from '@/components/ui/primitives';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Minus, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Stock() {
  const { activeBranchId } = useAppStore();
  const { data: products = [] } = useProducts();
  const updateStock = useUpdateStock();
  const [search, setSearch] = useState('');

  // Local state for inline edits
  const [edits, setEdits] = useState<Record<string, number>>({});

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const getStock = (pId: string, currentStock: number) => {
    return edits[pId] !== undefined ? edits[pId] : currentStock;
  };

  const handleAdjust = (pId: string, currentStock: number, delta: number) => {
    const val = getStock(pId, currentStock) + delta;
    setEdits(prev => ({ ...prev, [pId]: Math.max(0, val) }));
  };

  const handleSave = (pId: string) => {
    if (edits[pId] === undefined || !activeBranchId) return;
    updateStock.mutate({ productId: pId, branchId: activeBranchId, newStock: edits[pId] }, {
      onSuccess: () => {
        toast.success('Stok diperbarui');
        setEdits(prev => { const next = {...prev}; delete next[pId]; return next; });
      }
    });
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col overflow-hidden bg-muted/10">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Stok</h1>
        <p className="text-muted-foreground">Sesuaikan jumlah stok untuk cabang aktif.</p>
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
                <TableHead>Produk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center w-[200px]">Atur Stok</TableHead>
                <TableHead className="w-[100px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map(p => {
                const currentStock = p.stock[activeBranchId || ''] || 0;
                const isEdited = edits[p.id] !== undefined;
                const displayStock = getStock(p.id, currentStock);

                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                    </TableCell>
                    <TableCell>
                      {currentStock <= 5 ? (
                        <Badge variant="destructive">Menipis ({currentStock})</Badge>
                      ) : (
                        <Badge variant="success" className="bg-green-500 hover:bg-green-600">Aman ({currentStock})</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAdjust(p.id, currentStock, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input 
                          type="number" 
                          className={`w-16 h-8 text-center px-1 font-bold ${isEdited ? 'border-primary ring-1 ring-primary' : ''}`} 
                          value={displayStock}
                          onChange={(e) => setEdits(prev => ({...prev, [p.id]: parseInt(e.target.value) || 0}))}
                        />
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAdjust(p.id, currentStock, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {isEdited ? (
                        <Button size="sm" className="h-8 px-2" onClick={() => handleSave(p.id)}>
                          <Check className="h-4 w-4 mr-1" /> Simpan
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}