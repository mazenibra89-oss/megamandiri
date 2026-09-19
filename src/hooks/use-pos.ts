import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb, saveDb, Product, Transaction, Shift, generateId, Customer, ShopeeOrder } from '../lib/db';
import { toast } from 'sonner';

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

export const useBranches = () => useQuery({
  queryKey: ['branches'],
  queryFn: async () => { await delay(); return getDb().branches; }
});

export const useProducts = () => useQuery({
  queryKey: ['products'],
  queryFn: async () => { await delay(); return getDb().products as Product[]; }
});

export const useSaveProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Partial<Product> & { name: string, price: number }) => {
      await delay();
      const db = getDb();
      let newProduct;
      if (product.id) {
        db.products = db.products.map((p: Product) => p.id === product.id ? { ...p, ...product } : p);
        newProduct = product;
      } else {
        newProduct = { 
          ...product, 
          id: generateId('p'), 
          sku: product.sku || `SKU-${Math.floor(Math.random() * 10000)}`,
          stock: product.stock || {} 
        };
        db.products.push(newProduct);
      }
      saveDb(db);
      return newProduct;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produk berhasil disimpan');
    }
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await delay();
      const db = getDb();
      db.products = db.products.filter((p: Product) => p.id !== id);
      saveDb(db);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produk berhasil dihapus');
    }
  });
};

export const useUpdateStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, branchId, newStock }: { productId: string, branchId: string, newStock: number }) => {
      await delay();
      const db = getDb();
      db.products = db.products.map((p: Product) => {
        if (p.id === productId) {
          return { ...p, stock: { ...p.stock, [branchId]: Math.max(0, newStock) } };
        }
        return p;
      });
      saveDb(db);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] })
  });
};

export const useTransactions = (branchId?: string) => useQuery({
  queryKey: ['transactions', branchId],
  queryFn: async () => { 
    await delay(); 
    let txs = getDb().transactions as Transaction[];
    if (branchId) txs = txs.filter(t => t.branchId === branchId);
    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
});

export const useCreateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Transaction, 'id' | 'receiptNo' | 'date'>) => {
      await delay();
      const db = getDb();
      const newTx: Transaction = {
        ...data,
        id: generateId('tx'),
        receiptNo: `TRX-${Math.floor(Math.random() * 1000000)}`,
        date: new Date().toISOString()
      };
      
      // Reduce stock
      db.products = db.products.map((p: Product) => {
        const item = data.items.find(i => i.productId === p.id);
        if (item) {
          const currentStock = p.stock[data.branchId] || 0;
          return { ...p, stock: { ...p.stock, [data.branchId]: Math.max(0, currentStock - item.qty) } };
        }
        return p;
      });

      db.transactions.push(newTx);
      saveDb(db);
      return newTx;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useVoidTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await delay();
      const db = getDb();
      const tx = db.transactions.find((t: Transaction) => t.id === id);
      if (!tx || tx.status === 'void') return;
      
      tx.status = 'void';
      
      // Return stock
      db.products = db.products.map((p: Product) => {
        const item = tx.items.find((i: any) => i.productId === p.id);
        if (item) {
          const currentStock = p.stock[tx.branchId] || 0;
          return { ...p, stock: { ...p.stock, [tx.branchId]: currentStock + item.qty } };
        }
        return p;
      });

      saveDb(db);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Transaksi berhasil dibatalkan (void)');
    }
  });
};

export const useCustomers = () => useQuery({
  queryKey: ['customers'],
  queryFn: async () => { await delay(); return getDb().customers as Customer[]; }
});

export const useShopeeOrders = () => useQuery({
  queryKey: ['shopee'],
  queryFn: async () => { await delay(); return getDb().shopeeOrders as ShopeeOrder[]; }
});

export const useUpdateShopeeOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: ShopeeOrder['status'] }) => {
      await delay();
      const db = getDb();
      db.shopeeOrders = db.shopeeOrders.map((o: ShopeeOrder) => o.id === id ? { ...o, status } : o);
      saveDb(db);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopee'] })
  });
};

export const useShifts = (branchId?: string) => useQuery({
  queryKey: ['shifts', branchId],
  queryFn: async () => {
    await delay();
    let shifts = getDb().shifts as Shift[];
    if (branchId) shifts = shifts.filter(s => s.branchId === branchId);
    return shifts;
  }
});

export const useActiveShift = (branchId: string | null) => useQuery({
  queryKey: ['active-shift', branchId],
  queryFn: async () => {
    if (!branchId) return null;
    await delay();
    const shifts = getDb().shifts as Shift[];
    return shifts.find(s => s.branchId === branchId && s.status === 'active') || null;
  },
  enabled: !!branchId
});

export const useOpenShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ branchId, initialCash }: { branchId: string, initialCash: number }) => {
      await delay();
      const db = getDb();
      const newShift: Shift = {
        id: generateId('shf'),
        branchId,
        initialCash,
        startTime: new Date().toISOString(),
        status: 'active'
      };
      db.shifts.push(newShift);
      saveDb(db);
      return newShift;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['shifts'] });
      qc.invalidateQueries({ queryKey: ['active-shift', variables.branchId] });
      toast.success('Shift berhasil dibuka');
    }
  });
};

export const useCloseShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ shiftId, finalCash }: { shiftId: string, finalCash: number }) => {
      await delay();
      const db = getDb();
      const shift = db.shifts.find((s: Shift) => s.id === shiftId);
      if (shift) {
        shift.status = 'closed';
        shift.endTime = new Date().toISOString();
        shift.finalCash = finalCash;
        saveDb(db);
      }
      return shift;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['shifts'] });
      if (data) qc.invalidateQueries({ queryKey: ['active-shift', data.branchId] });
      toast.success('Shift berhasil ditutup');
    }
  });
};

export const useSettings = () => useQuery({
  queryKey: ['settings'],
  queryFn: async () => { await delay(); return getDb().settings; }
});
