import React, { useState } from 'react';
import { useActiveShift, useOpenShift, useCloseShift, useShifts } from '@/hooks/use-pos';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge } from '@/components/ui/primitives';
import { formatIDR, formatDate } from '@/lib/utils';
import { Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Shift() {
  const { activeBranchId } = useAppStore();
  const { data: activeShift, isLoading } = useActiveShift(activeBranchId);
  const { data: history = [] } = useShifts(activeBranchId || undefined);
  
  const openShift = useOpenShift();
  const closeShift = useCloseShift();

  const [initialCash, setInitialCash] = useState('');
  const [finalCash, setFinalCash] = useState('');

  const handleOpen = () => {
    if (!activeBranchId) return;
    openShift.mutate({ branchId: activeBranchId, initialCash: parseInt(initialCash.replace(/\D/g, '') || '0') });
  };

  const handleClose = () => {
    if (!activeShift) return;
    closeShift.mutate({ shiftId: activeShift.id, finalCash: parseInt(finalCash.replace(/\D/g, '') || '0') });
  };

  if (isLoading) return null;

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto bg-muted/10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Shift</h1>
        <p className="text-muted-foreground">Buka dan tutup shift kasir.</p>
      </div>

      {!activeShift ? (
        <Card className="max-w-md border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Clock className="h-5 w-5" /> Buka Shift Baru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Uang Modal (Laci Kasir)</Label>
              <Input 
                placeholder="Rp 0" 
                value={initialCash}
                onChange={e => setInitialCash(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <Button className="w-full" onClick={handleOpen} disabled={openShift.isPending}>
              Mulai Shift
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-md border-amber-500/20 bg-amber-50/30 dark:bg-amber-900/10">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-500 flex items-center justify-between">
              <span className="flex items-center gap-2"><Clock className="h-5 w-5" /> Shift Aktif</span>
              <Badge variant="warning" className="bg-amber-500">Berjalan</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-card rounded-md border text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Mulai</span> <span className="font-medium">{formatDate(activeShift.startTime)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Modal Awal</span> <span className="font-medium">{formatIDR(activeShift.initialCash)}</span></div>
            </div>
            <div className="space-y-2 pt-2 border-t border-amber-500/10">
              <Label>Uang Akhir di Laci (Aktual)</Label>
              <Input 
                placeholder="Rp 0" 
                value={finalCash}
                onChange={e => setFinalCash(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <Button variant="destructive" className="w-full" onClick={handleClose} disabled={closeShift.isPending}>
              Tutup Shift
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Shift Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.filter(s => s.status === 'closed').slice(0,5).map(shift => (
              <div key={shift.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" /> 
                    {formatDate(shift.startTime)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Ditutup: {formatDate(shift.endTime!)}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">Modal: {formatIDR(shift.initialCash)}</p>
                  <p className="font-semibold text-primary">Akhir: {formatIDR(shift.finalCash || 0)}</p>
                </div>
              </div>
            ))}
            {history.filter(s => s.status === 'closed').length === 0 && (
              <p className="text-muted-foreground text-center py-4">Belum ada riwayat shift.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
