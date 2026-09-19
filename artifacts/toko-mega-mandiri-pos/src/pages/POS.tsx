import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useProducts, useCreateTransaction, useActiveShift } from '@/hooks/use-pos';
import { Card, Button, Input, Badge, Label, CardContent } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/modal';
import { formatIDR } from '@/lib/utils';
import { Search, ShoppingCart, Plus, Minus, Wallet, Loader2, QrCode, UserRound, Phone, MessageCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Transaction } from '@/lib/db';

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
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

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

    const normalizedPhone = normalizeWhatsapp(customerPhone);
    if (customerPhone.trim() && !normalizedPhone) {
      setPhoneError('Nomor WhatsApp tidak valid');
      return;
    }
    setPhoneError('');
    createTx.mutate({
      branchId: activeBranchId!,
      total: cartTotal,
      paymentMethod,
      status: 'success',
      customerName: customerName.trim().slice(0, 80) || undefined,
      customerPhone: normalizedPhone || undefined,
      items: cart.map(c => ({ productId: c.productId, name: c.name, qty: c.qty, price: c.price }))
    }, {
      onSuccess: (transaction) => {
        setIsPaymentModalOpen(false);
        setCompletedTx(transaction);
        clearCart();
        setCashReceived('');
        toast.success(`Transaksi Berhasil! Kembalian: ${paymentMethod === 'Tunai' ? formatIDR(cash - cartTotal) : 'Rp0'}`);
      }
    });
  };

  const normalizeWhatsapp = (value: string) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
    else if (digits.startsWith('8')) digits = `62${digits}`;
    if (!digits.startsWith('62')) return '';
    const localDigits = digits.slice(2);
    return localDigits.length >= 9 && localDigits.length <= 13 ? digits : '';
  };

  const invoiceText = completedTx
    ? `Halo ${completedTx.customerName || 'Pelanggan'},\n\nTerima kasih sudah berbelanja di Toko Mega Mandiri.\n\nInvoice: ${completedTx.receiptNo}\n${completedTx.items.map((item) => `${item.qty}x ${item.name} — ${formatIDR(item.qty * item.price)}`).join('\n')}\n\nTotal: ${formatIDR(completedTx.total)}\nPembayaran: ${completedTx.paymentMethod}\n\nTerima kasih atas kunjungan Anda.`
    : '';

  const sendWhatsapp = (transaction: Transaction) => {
    if (!transaction.customerPhone) {
      toast.error('Nomor WhatsApp pelanggan belum tersedia');
      return;
    }
    window.open(`https://wa.me/${transaction.customerPhone}?text=${encodeURIComponent(invoiceText)}`, '_blank', 'noopener,noreferrer');
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
          <div className="grid grid-cols-1 gap-2 mb-4">
            <Label className="text-xs text-muted-foreground">Data Pelanggan</Label>
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" maxLength={80} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama pelanggan (opsional)" />
            </div>
            <div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" inputMode="tel" value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value.slice(0, 18)); setPhoneError(''); }} placeholder="Nomor WhatsApp" />
              </div>
              {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
            </div>
          </div>
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
          {paymentMethod === 'QRIS' && (
            <div className="rounded-xl border bg-white p-5 text-center animate-in slide-in-from-bottom-2">
              <div className="mx-auto w-48 h-48 p-3 border-4 border-slate-900 rounded-xl bg-white">
                <div className="qris-dummy w-full h-full" aria-label="QRIS dummy untuk tampilan" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">QRIS Toko Mega Mandiri</p>
              <p className="text-xs text-slate-500">QR dummy untuk tampilan demo</p>
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
      <Modal isOpen={!!completedTx} onClose={() => setCompletedTx(null)} title="Pembayaran Berhasil">
        {completedTx && (
          <div className="space-y-5">
            <div className="text-center">
              <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatIDR(completedTx.total)}</p>
              <p className="text-sm text-muted-foreground">{completedTx.receiptNo}</p>
            </div>
            <div className="rounded-xl bg-muted p-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Pelanggan:</span> <strong>{completedTx.customerName || 'Umum'}</strong></p>
              <p><span className="text-muted-foreground">WhatsApp:</span> <strong>{completedTx.customerPhone || 'Belum diisi'}</strong></p>
            </div>
            <div className="rounded-xl border p-4 text-sm whitespace-pre-line max-h-52 overflow-y-auto">
              {invoiceText}
            </div>
            <Button className="w-full h-12 bg-green-600 hover:bg-green-700" disabled={!completedTx.customerPhone} onClick={() => sendWhatsapp(completedTx)}>
              <MessageCircle className="h-5 w-5 mr-2" />
              Kirim Invoice via WhatsApp
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { setCompletedTx(null); setCustomerName(''); setCustomerPhone(''); }}>
              Transaksi Baru
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}