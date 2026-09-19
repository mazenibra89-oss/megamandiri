import React, { useState } from 'react';
import { useCashflowTransactions, useCreateCashflowTransaction, useTransactions, useVoidTransaction } from '@/hooks/use-pos';
import { useAppStore } from '@/lib/store';
import { Card, Badge, Button, Input, Label } from '@/components/ui/primitives';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { formatIDR, formatDate } from '@/lib/utils';
import { AlertCircle, MessageCircle, Plus, TrendingDown, TrendingUp, Upload } from 'lucide-react';
import { shareReceiptImage } from '@/lib/receipt-image';
import { toast } from 'sonner';

export default function Transactions() {
  const { activeBranchId } = useAppStore();
  const { data: transactions = [] } = useTransactions(activeBranchId || undefined);
  const { data: cashflowTransactions = [] } = useCashflowTransactions(activeBranchId || undefined);
  const createCashflow = useCreateCashflowTransaction();
  const voidTx = useVoidTransaction();

  const [voidConfirmId, setVoidConfirmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sales' | 'cashflow'>('sales');
  const [isCashflowModalOpen, setIsCashflowModalOpen] = useState(false);
  const [cashflowForm, setCashflowForm] = useState({
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    category: '',
    description: '',
    receiptImage: '',
  });
  const categories = ['Bahan baku', 'Biaya iklan', 'Gaji Karyawan', 'Sewa Tempat', 'Operasional', 'Prive', 'Lainnya'];

  const handleVoid = () => {
    if (voidConfirmId) {
      voidTx.mutate(voidConfirmId, {
        onSuccess: () => setVoidConfirmId(null)
      });
    }
  };

  const sendInvoice = async (tx: (typeof transactions)[number]) => {
    try {
      const result = await shareReceiptImage(tx);
      if (result === 'downloaded') {
        toast.info('Gambar struk diunduh. Lampirkan gambar tersebut saat WhatsApp terbuka.');
        if (tx.customerPhone) {
          window.open(
            `https://wa.me/${tx.customerPhone}?text=${encodeURIComponent(`Halo ${tx.customerName || 'Pelanggan'}, berikut struk pembayaran ${tx.receiptNo}.`)}`,
            '_blank',
            'noopener,noreferrer',
          );
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('Gagal menyiapkan gambar struk');
    }
  };

  const resetCashflowForm = () => {
    setCashflowForm({
      type: 'expense',
      date: new Date().toISOString().slice(0, 10),
      amount: '',
      category: '',
      description: '',
      receiptImage: '',
    });
  };

  const handleCashflowSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(cashflowForm.amount);
    if (!activeBranchId || !cashflowForm.date || !cashflowForm.category || amount <= 0) {
      toast.error('Lengkapi tanggal, jumlah, dan kategori transaksi');
      return;
    }
    createCashflow.mutate({
      branchId: activeBranchId,
      type: cashflowForm.type,
      date: new Date(`${cashflowForm.date}T12:00:00`).toISOString(),
      amount,
      category: cashflowForm.category,
      description: cashflowForm.description.trim().slice(0, 250) || undefined,
      receiptImage: cashflowForm.receiptImage || undefined,
    }, {
      onSuccess: () => {
        setIsCashflowModalOpen(false);
        setActiveTab('cashflow');
        resetCashflowForm();
      },
    });
  };

  const handleReceiptUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Bukti transaksi harus berupa gambar');
      return;
    }
    if (file.size > 1_500_000) {
      toast.error('Ukuran gambar maksimal 1,5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCashflowForm((current) => ({ ...current, receiptImage: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col overflow-hidden bg-muted/10">
      <div className="mb-6 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Transaksi</h1>
          <p className="text-muted-foreground">Penjualan dan cashflow untuk cabang ini.</p>
        </div>
        <Button onClick={() => setIsCashflowModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Tambahkan Transaksi
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b flex gap-2">
          <Button size="sm" variant={activeTab === 'sales' ? 'default' : 'ghost'} onClick={() => setActiveTab('sales')}>
            Penjualan Produk
          </Button>
          <Button size="sm" variant={activeTab === 'cashflow' ? 'default' : 'ghost'} onClick={() => setActiveTab('cashflow')}>
            Cashflow Lainnya
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          {activeTab === 'sales' ? <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>No Resi</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(tx => (
                <TableRow key={tx.id} className={tx.status === 'void' ? 'opacity-60 bg-muted/30' : ''}>
                  <TableCell className="text-sm whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                  <TableCell className="font-mono text-xs">{tx.receiptNo}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {tx.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{tx.customerName || 'Umum'}</p>
                    <p className="text-xs text-muted-foreground">{tx.customerPhone || '-'}</p>
                  </TableCell>
                  <TableCell className="font-semibold">{formatIDR(tx.total)}</TableCell>
                  <TableCell><Badge variant="outline">{tx.paymentMethod}</Badge></TableCell>
                  <TableCell>
                    {tx.status === 'success' ? (
                      <Badge variant="success" className="bg-green-500">Berhasil</Badge>
                    ) : (
                      <Badge variant="destructive">Dibatalkan</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {tx.status === 'success' && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="text-green-600 h-8 px-2 text-xs" onClick={() => sendInvoice(tx)}>
                          <MessageCircle className="h-4 w-4 mr-1" /> Struk Gambar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive h-8 px-2 text-xs" onClick={() => setVoidConfirmId(tx.id)}>
                          Void
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Belum ada transaksi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table> : <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Bukti</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashflowTransactions.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(entry.date)}</TableCell>
                  <TableCell>
                    <Badge variant={entry.type === 'income' ? 'success' : 'destructive'}>
                      {entry.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{entry.category}</TableCell>
                  <TableCell className="max-w-[280px] truncate text-muted-foreground">{entry.description || '-'}</TableCell>
                  <TableCell>
                    {entry.receiptImage ? (
                      <a href={entry.receiptImage} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline">Lihat gambar</a>
                    ) : '-'}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.type === 'income' ? '+' : '-'}{formatIDR(entry.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {cashflowTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Belum ada transaksi cashflow di luar penjualan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>}
        </div>
      </Card>

      <Modal isOpen={isCashflowModalOpen} onClose={() => setIsCashflowModalOpen(false)} title="Tambahkan Transaksi Cashflow" maxWidth="max-w-2xl">
        <form onSubmit={handleCashflowSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Jenis Transaksi</Label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
              <Button type="button" variant={cashflowForm.type === 'income' ? 'default' : 'ghost'} className={cashflowForm.type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''} onClick={() => setCashflowForm((current) => ({ ...current, type: 'income' }))}>
                <TrendingUp className="h-4 w-4 mr-2" /> Pemasukan
              </Button>
              <Button type="button" variant={cashflowForm.type === 'expense' ? 'destructive' : 'ghost'} onClick={() => setCashflowForm((current) => ({ ...current, type: 'expense' }))}>
                <TrendingDown className="h-4 w-4 mr-2" /> Pengeluaran
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cashflow-date">Tanggal</Label>
              <Input id="cashflow-date" type="date" value={cashflowForm.date} onChange={(event) => setCashflowForm((current) => ({ ...current, date: event.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashflow-amount">Jumlah</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                <Input id="cashflow-amount" className="pl-9" inputMode="numeric" placeholder="50.000" value={cashflowForm.amount} onChange={(event) => setCashflowForm((current) => ({ ...current, amount: event.target.value.replace(/\D/g, '').slice(0, 14) }))} required />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cashflow-category">Kategori</Label>
            <select id="cashflow-category" className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={cashflowForm.category} onChange={(event) => setCashflowForm((current) => ({ ...current, category: event.target.value }))} required>
              <option value="">Pilih kategori</option>
              {categories.map((category) => <option value={category} key={category}>{category}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cashflow-description">Deskripsi <span className="text-muted-foreground font-normal">(Opsional)</span></Label>
            <textarea id="cashflow-description" className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" maxLength={250} placeholder="Tambahkan catatan singkat..." value={cashflowForm.description} onChange={(event) => setCashflowForm((current) => ({ ...current, description: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Bukti Transaksi <span className="text-muted-foreground font-normal">(Opsional)</span></Label>
            <label className="min-h-24 rounded-xl border border-dashed flex items-center justify-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors">
              {cashflowForm.receiptImage ? (
                <img src={cashflowForm.receiptImage} alt="Pratinjau bukti transaksi" className="h-20 w-20 object-cover rounded-lg" />
              ) : (
                <><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload gambar, maksimal 1,5 MB</span></>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(event) => handleReceiptUpload(event.target.files?.[0])} />
            </label>
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCashflowModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={createCashflow.isPending}>{createCashflow.isPending ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!voidConfirmId} onClose={() => setVoidConfirmId(null)} title="Konfirmasi Void">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Peringatan Penting</p>
              <p className="text-sm mt-1">Tindakan ini akan membatalkan transaksi dan mengembalikan stok. Data yang di-void tidak dapat dikembalikan. Lanjutkan?</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setVoidConfirmId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleVoid} disabled={voidTx.isPending}>Ya, Void Transaksi</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}