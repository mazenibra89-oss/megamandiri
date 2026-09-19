import React, { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useTransactions, useProducts, useActiveShift } from '@/hooks/use-pos';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/primitives';
import { formatIDR } from '@/lib/utils';
import { Receipt, TrendingUp, AlertTriangle, Box } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { activeBranchId } = useAppStore();
  const { data: transactions = [] } = useTransactions(activeBranchId || undefined);
  const { data: products = [] } = useProducts();
  const { data: activeShift } = useActiveShift(activeBranchId);

  const stats = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const todayTxs = transactions.filter(t => new Date(t.date).setHours(0,0,0,0) === today && t.status === 'success');
    
    const salesToday = todayTxs.reduce((sum, t) => sum + t.total, 0);
    const txCount = todayTxs.length;

    // Last 7 days chart data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const daySales = transactions
        .filter(t => new Date(t.date).setHours(0,0,0,0) === d.getTime() && t.status === 'success')
        .reduce((sum, t) => sum + t.total, 0);
      chartData.push({
        name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        Total: daySales
      });
    }

    const lowStock = products.filter(p => (p.stock[activeBranchId || ''] || 0) <= 10);

    return { salesToday, txCount, chartData, lowStock };
  }, [transactions, products, activeBranchId]);

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-full bg-muted/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Ringkasan performa toko hari ini.</p>
        </div>
        {!activeShift && (
          <Badge variant="destructive" className="px-3 py-1 text-sm shrink-0">
            Shift Belum Dibuka
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary text-primary-foreground border-transparent">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 font-medium mb-1">Penjualan Hari Ini</p>
              <h3 className="text-3xl font-bold">{formatIDR(stats.salesToday)}</h3>
            </div>
            <TrendingUp className="h-10 w-10 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground font-medium mb-1">Total Transaksi</p>
              <h3 className="text-3xl font-bold">{stats.txCount}</h3>
            </div>
            <Receipt className="h-10 w-10 text-muted-foreground/30" />
          </CardContent>
        </Card>
        <Card className={stats.lowStock.length > 0 ? "border-amber-200 bg-amber-50/30 dark:bg-amber-900/10" : ""}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground font-medium mb-1">Stok Menipis</p>
              <h3 className="text-3xl font-bold">{stats.lowStock.length} Produk</h3>
            </div>
            <AlertTriangle className={`h-10 w-10 ${stats.lowStock.length > 0 ? "text-amber-500" : "text-muted-foreground/30"}`} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Penjualan 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `Rp${v/1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatIDR(value)}
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" /> Stok Menipis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStock.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Semua stok aman.</p>
            ) : (
              <div className="space-y-4">
                {stats.lowStock.slice(0,5).map(p => (
                  <div key={p.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </div>
                    <Badge variant="destructive">{p.stock[activeBranchId || ''] || 0} Tersisa</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}