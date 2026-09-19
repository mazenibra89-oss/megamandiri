import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Branch, Product, Transaction, CashflowTransaction, ShopeeOrder, Shift, Customer } from '../lib/db';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    }
  });
  if (!res.ok) throw new Error('API Error');
  return res.json() as Promise<T>;
};

export const useBranches = () => useQuery({
  queryKey: ['branches'],
  queryFn: () => api<Branch[]>('/branches')
});

export const useAddBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (branch: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>) => api<Branch>('/branches', { method: 'POST', body: JSON.stringify(branch) }),
    onSuccess: () => toast.success('Cabang baru berhasil ditambahkan'),
  });
};

export const useProducts = () => useQuery({
  queryKey: ['products'],
  queryFn: () => api<Product[]>('/products')
});

export const useSaveProduct = () => {
  return useMutation({
    mutationFn: (product: any) => api<Product>('/products', { method: 'POST', body: JSON.stringify(product) }),
    onSuccess: () => toast.success('Produk berhasil disimpan')
  });
};

export const useDeleteProduct = () => {
  return useMutation({
    mutationFn: (id: string) => api<{success: boolean}>(`/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => toast.success('Produk berhasil dihapus')
  });
};

export const useUpdateStock = () => {
  return useMutation({
    mutationFn: (data: { productId: string, branchId: string, newStock: number }) => api<{success: boolean}>('/products/stock', { method: 'PUT', body: JSON.stringify(data) })
  });
};

export const useTransactions = (branchId?: string) => useQuery({
  queryKey: ['transactions', branchId],
  queryFn: () => api<Transaction[]>(`/transactions${branchId ? `?branchId=${branchId}` : ''}`)
});

export const useCashflowTransactions = (branchId?: string) => useQuery({
  queryKey: ['cashflow', branchId],
  queryFn: () => api<CashflowTransaction[]>(`/cashflow${branchId ? `?branchId=${branchId}` : ''}`)
});

export const useCreateCashflowTransaction = () => {
  return useMutation({
    mutationFn: (data: any) => api<CashflowTransaction>('/cashflow', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => toast.success('Transaksi cashflow berhasil disimpan'),
  });
};

export const useCreateTransaction = () => {
  return useMutation({
    mutationFn: (data: any) => api<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) })
  });
};

export const useVoidTransaction = () => {
  return useMutation({
    mutationFn: (id: string) => api<{success: boolean}>(`/transactions/${id}/void`, { method: 'PUT' }),
    onSuccess: () => toast.success('Transaksi berhasil dibatalkan (void)')
  });
};

export const useCustomers = () => useQuery({
  queryKey: ['customers'],
  queryFn: () => api<Customer[]>('/customers')
});

export const useShopeeOrders = () => useQuery({
  queryKey: ['shopee'],
  queryFn: () => api<ShopeeOrder[]>('/shopee')
});

export const useUpdateShopeeOrder = () => {
  return useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => api<{success: boolean}>(`/shopee/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
  });
};

export const useShifts = (branchId?: string) => useQuery({
  queryKey: ['shifts', branchId],
  queryFn: () => api<Shift[]>(`/shifts${branchId ? `?branchId=${branchId}` : ''}`)
});

export const useActiveShift = (branchId: string | null) => useQuery({
  queryKey: ['active-shift', branchId],
  queryFn: async () => {
    if (!branchId) return null;
    const shifts = await api<Shift[]>(`/shifts?branchId=${branchId}`);
    return shifts.find(s => s.status === 'active') || null;
  },
  enabled: !!branchId
});

export const useOpenShift = () => {
  return useMutation({
    mutationFn: (data: { branchId: string, initialCash: number }) => api<Shift>('/shifts/open', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => toast.success('Shift berhasil dibuka')
  });
};

export const useCloseShift = () => {
  return useMutation({
    mutationFn: (data: { shiftId: string, finalCash: number }) => api<Shift>('/shifts/close', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => toast.success('Shift berhasil ditutup')
  });
};

export const useSettings = () => useQuery({
  queryKey: ['settings'],
  queryFn: () => api<any>('/settings')
});
