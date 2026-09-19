import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useProducts, useCreateTransaction, useActiveShift } from '@/hooks/use-pos';
import { Card, Button, Input, Badge, Label, CardContent } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/modal';
import { formatIDR } from '@/lib/utils';
import { Search, ShoppingCart, Plus, Minus, Trash2, Wallet, CreditCard, Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function POS() {
  const { activeBranchId, cart, addToCart, updateCartQty, removeFromCart, clearCart } = useAppStore();
  const { data: products = [], isLoading } = useProducts();
  const { data: activeShift } = useActiveShift(activeBranchId);
  const createTx = useCreateTransaction();
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS'>('Tunai');
  const [cashReceived, setCashReceived] = useState('');

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'Semua' || p.category === category;
      return matchSearch && matchCategory;
    });
  }, [products, search, category]);

  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category)))];

  const handlePay = () => {
    if (!activeShift) {
      toast.error('Shift belum dibuka. Silakan buka shift di menu Shift terlebih dahulu.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }
    setIsPaymentModalOpen(true);
    setPaymentMethod('Tunai');
    setCashReceived(cartTotal.toString());
  };

  const handleCheckout = () => {
    const cash = parseInt(cashReceived.replace(/\D/g, '') || '0');
    if (paymentMethod === 'Tunai' && cash < cartTotal) {
      toast.error('Uang tunai kurang dari total belanja');
      return;
    }

    createTx.mutate({
      branchId: activeBranchId!,
      total: cartTotal,
      paymentMethod,
      status: 'success',
      items: cart.map(c => ({ productId: c.productId, name: c.name, qty: c.qty, price: c.price }))
    }, {
      onSuccess: () => {
        setIsPaymentModalOpen(false);
        clearCart();
        setCashReceived('');
        toast.success(`Transaksi Berhasil! Kembalian: ${paymentMethod === 'Tunai' ? formatIDR(cash - cartTotal) : 'Rp0'}`);
      }
    });
  };

  const quickCashButtons = [cartTotal, 50000, 100000, 200000].filter(v => v >= cartTotal);
  // Ensure unique quick cash buttons
  const uniqueQuickCash = Array.from(new Set(quickCashButtons));

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-muted/10">
      {/* Left Panel: Catalog */}
      <div className="flex-1 flex flex-col h-full border-r relative z-0">
        <div className="p-4 bg-card border-b space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari produk..." 
              className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <Badge 
                key={cat}
                variant={category === cat ? "default" : "secondary"}
                className="cursor-pointer px-4 py-1.5 whitespace-nowrap text-sm"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filteredProducts.map(product => {
                const stock = product.stock[activeBranchId || ''] || 0;
                return (
                  <Card 
                    key={product.id} 
                    className={`cursor-pointer transition-all hover:border-primary overflow-hidden ${stock <= 0 ? 'opacity-50 grayscale' : 'hover:-translate-y-1'}`}
                    onClick={() => {
                      if (stock > 0) addToCart({ id: product.id, name: product.name, price: product.price });
                      else toast.error('Stok habis');
                    }}
                  >
                    <div className="h-24 bg-muted flex items-center justify-center border-b">
                      {/* Placeholder for image */}
                      <Wallet className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">{product.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-primary text-sm">{formatIDR(product.price)}</span>
                        <Badge variant="outline" className="text-[10px] px-1">{stock}x</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Cart (Desktop always visible, Mobile scroll down or drawer-like behavior via flex) */}
      <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col h-[50vh] md:h-full bg-card shrink-0 shadow-lg md:shadow-none z-10 border-t md:border-t-0">
        <div className="p-4 border-b bg-muted/20 shrink-0 flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Pesanan Saat Ini
          </h2>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" className="text-destructive h-8 px-2" onClick={clearCart}>
              Kosongkan
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-50">
              <ShoppingCart className="h-12 w-12" />
              <p>Keranjang kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-sm truncate">{item.name}</h5>
                  <p className="text-primary font-semibold text-sm">{formatIDR(item.price)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateCartQty(item.productId, item.qty - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center font-medium text-sm">{item.qty}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateCartQty(item.productId, item.qty + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-card border-t shrink-0">
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground font-medium">Total</span>
            <span className="text-2xl font-bold text-primary">{formatIDR(cartTotal)}</span>
          </div>
          <Button 
            className="w-full h-12 text-lg font-bold shadow-md" 
            disabled={cart.length === 0}
            onClick={handlePay}
          >
            Bayar
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Pembayaran">
        <div className="space-y-6 pb-2">
          <div className="bg-primary/10 p-4 rounded-xl text-center">
            <p className="text-sm font-medium text-primary mb-1">Total Tagihan</p>
            <p className="text-4xl font-bold text-primary">{formatIDR(cartTotal)}</p>
          </div>

          <div className="space-y-3">
            <Label>Metode Pembayaran</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant={paymentMethod === 'Tunai' ? 'default' : 'outline'} 
                className="h-12"
                onClick={() => setPaymentMethod('Tunai')}
              >
                <Wallet className="mr-2 h-5 w-5" /> Tunai
              </Button>
              <Button 
                variant={paymentMethod === 'QRIS' ? 'default' : 'outline'} 
                className="h-12"
                onClick={() => setPaymentMethod('QRIS')}
              >
                <QrCode className="mr-2 h-5 w-5" /> QRIS
              </Button>
            </div>
          </div>

          {paymentMethod === 'Tunai' && (
            <div className="space-y-3 animate-in slide-in-from-bottom-2">
              <Label>Nominal Uang Diterima</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
                <Input 
                  type="text"
                  className="pl-9 h-12 text-lg font-bold"
                  value={cashReceived}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setCashReceived(val);
                  }}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {uniqueQuickCash.map((amt, idx) => (
                  <Badge 
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer px-4 py-2 shrink-0 text-sm hover:bg-primary/20"
                    onClick={() => setCashReceived(amt.toString())}
                  >
                    {amt === cartTotal ? 'Uang Pas' : formatIDR(amt)}
                  </Badge>
                ))}
              </div>
              
              {parseInt(cashReceived || '0') >= cartTotal && (
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg mt-2">
                  <span className="font-medium text-muted-foreground">Kembalian</span>
                  <span className="font-bold text-lg text-green-600">
                    {formatIDR(parseInt(cashReceived || '0') - cartTotal)}
                  </span>
                </div>
              )}
            </div>
          )}

          <Button 
            className="w-full h-14 text-lg font-bold mt-4" 
            onClick={handleCheckout}
            disabled={createTx.isPending}
          >
            {createTx.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Selesaikan Pembayaran'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}