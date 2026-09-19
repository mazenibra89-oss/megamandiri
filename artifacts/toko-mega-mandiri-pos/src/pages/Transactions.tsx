import React, { useState } from 'react';
import { useTransactions, useVoidTransaction } from '@/hooks/use-pos';
import { useAppStore } from '@/lib/store';
import { Card, Badge, Button } from '@/components/ui/primitives';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { formatIDR, formatDate } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export default function Transactions() {
  const { activeBranchId } = useAppStore();
  const { data: transactions = [] } = useTransactions(activeBranchId || undefined);
  const voidTx = useVoidTransaction();

  const [voidConfirmId, setVoidConfirmId] = useState<string | null>(null);

  const handleVoid = () => {
    if (voidConfirmId) {
      voidTx.mutate(voidConfirmId, {
        onSuccess: () => setVoidConfirmId(null)
      });
    }
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col overflow-hidden bg-muted/10">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Transaksi</h1>
        <p className="text-muted-foreground">Daftar transaksi untuk cabang ini.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>No Resi</TableHead>
                <TableHead>Item</TableHead>
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
                      <Button variant="ghost" size="sm" className="text-destructive h-8 px-2 text-xs" onClick={() => setVoidConfirmId(tx.id)}>
                        Void
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Belum ada transaksi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

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