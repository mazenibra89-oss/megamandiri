export interface Branch { id: string; name: string; address: string; }
export interface Product { id: string; sku: string; name: string; category: string; price: number; stock: Record<string, number>; image?: string; }
export interface Customer { id: string; name: string; phone: string; points: number; }
export interface TransactionItem { productId: string; name: string; qty: number; price: number; }
export interface Transaction { id: string; receiptNo: string; branchId: string; date: string; total: number; paymentMethod: string; status: 'success' | 'void'; items: TransactionItem[]; customerId?: string; }
export interface ShopeeOrder { id: string; orderNo: string; items: {productId: string, qty: number}[]; total: number; status: 'new' | 'ready' | 'completed'; date: string; }
export interface Shift { id: string; branchId: string; startTime: string; endTime?: string; initialCash: number; finalCash?: number; status: 'active' | 'closed'; }

const DB_KEY = 'toko_mega_mandiri_db';

const defaultData = {
  branches: [
    { id: 'b1', name: 'Pusat Jakarta', address: 'Jl. Sudirman No. 1' },
    { id: 'b2', name: 'Cabang Depok', address: 'Jl. Margonda Raya No. 42' }
  ],
  products: [
    { id: 'p1', sku: 'KOP-001', name: 'Kopi Susu Gula Aren', category: 'Minuman', price: 20000, stock: { b1: 150, b2: 100 } },
    { id: 'p2', sku: 'KOP-002', name: 'Americano', category: 'Minuman', price: 15000, stock: { b1: 50, b2: 30 } },
    { id: 'p3', sku: 'MKN-001', name: 'Kentang Goreng', category: 'Makanan', price: 25000, stock: { b1: 40, b2: 20 } },
    { id: 'p4', sku: 'MKN-002', name: 'Roti Bakar Coklat Keju', category: 'Makanan', price: 28000, stock: { b1: 30, b2: 15 } },
    { id: 'p5', sku: 'KOP-003', name: 'Matcha Latte', category: 'Minuman', price: 24000, stock: { b1: 80, b2: 40 } },
    { id: 'p6', sku: 'MKN-003', name: 'Mie Goreng Spesial', category: 'Makanan', price: 30000, stock: { b1: 25, b2: 10 } }
  ],
  customers: [
    { id: 'c1', name: 'Budi Santoso', phone: '08123456789', points: 150 },
    { id: 'c2', name: 'Siti Aminah', phone: '08987654321', points: 45 }
  ],
  transactions: [
    { id: 't1', receiptNo: 'TRX-1001', branchId: 'b1', date: new Date(Date.now() - 86400000).toISOString(), total: 40000, paymentMethod: 'QRIS', status: 'success', items: [{ productId: 'p1', name: 'Kopi Susu Gula Aren', qty: 2, price: 20000 }] }
  ] as Transaction[],
  shopeeOrders: [
    { id: 'sh1', orderNo: 'SHP-001', items: [{ productId: 'p1', qty: 2 }], total: 40000, status: 'new', date: new Date().toISOString() },
    { id: 'sh2', orderNo: 'SHP-002', items: [{ productId: 'p3', qty: 1 }, { productId: 'p1', qty: 1 }], total: 45000, status: 'ready', date: new Date(Date.now() - 3600000).toISOString() }
  ] as ShopeeOrder[],
  shifts: [] as Shift[],
  settings: {
    storeName: 'Toko Mega Mandiri',
    receiptFooter: 'Terima kasih atas kunjungan Anda!\nBarang yang sudah dibeli tidak dapat ditukar.'
  }
};

export const getDb = () => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
      localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(data);
  } catch (e) {
    return defaultData;
  }
};

export const saveDb = (data: any) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

export const resetDb = () => {
  localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
};
