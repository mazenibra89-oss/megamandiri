import React, { useMemo } from 'react';
import { useTransactions } from '@/hooks/use-pos';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives';
import { formatIDR } from '@/lib/utils';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

export default function Reports() {
  const { activeBranchId } = useAppStore();
  const { data: transactions = [] } = useTransactions(activeBranchId || undefined);

  const stats = useMemo(() => {
    const successTxs = transactions.filter(t => t.status === 'success');
    
    // Group by date for last 7 days
    const last7Days = Array.from({length: 7}).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      return d.getTime();
    }).reverse();

    let weeklySales = 0;
    let cashSales = 0;
    let qrisSales = 0;

    successTxs.forEach(t => {
      const tDate = new Date(t.date).setHours(0,0,0,0);
      if (last7Days.includes(tDate)) {
        weeklySales += t.total;
        if (t.paymentMethod === 'Tunai') cashSales += t.total;
        if (t.paymentMethod === 'QRIS') qrisSales += t.total;
      }
    });

    return { total: weeklySales, cash: cashSales, qris: qrisSales, count: successTxs.length };
  }, [transactions]);

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto bg-muted/10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Penjualan</h1>
        <p className="text-muted-foreground">Analisis pendapatan 7 hari terakhir.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-primary mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">Total Pendapatan</span>
            </div>
            <h3 className="text-2xl font-bold">{formatIDR(stats.total)}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-emerald-600 mb-2">
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Penjualan Tunai</span>
            </div>
            <h3 className="text-2xl font-bold">{formatIDR(stats.cash)}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Penjualan QRIS</span>
            </div>
            <h3 className="text-2xl font-bold">{formatIDR(stats.qris)}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-amber-600 mb-2">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Total Transaksi</span>
            </div>
            <h3 className="text-2xl font-bold">{stats.count} TRX</h3>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Laporan Belum Tersedia Penuh</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Fitur chart tingkat lanjut dan ekspor PDF/Excel akan segera hadir.</p>
        </CardContent>
      </Card>
    </div>
  );
}
