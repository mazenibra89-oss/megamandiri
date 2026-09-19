import React from 'react';
import { useCustomers } from '@/hooks/use-pos';
import { Card, Button, Input, Badge } from '@/components/ui/primitives';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Search, Plus } from 'lucide-react';

export default function Customers() {
  const { data: customers = [] } = useCustomers();

  return (
    <div className="p-4 md:p-6 h-full flex flex-col overflow-hidden bg-muted/10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pelanggan</h1>
          <p className="text-muted-foreground">Basis data pelanggan dan poin loyalitas.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Tambah Pelanggan
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari nama atau nomor telepon..." className="pl-9" />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50">
              <TableRow>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>No. Telepon</TableHead>
                <TableHead className="text-right">Poin Loyalitas</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {c.name.charAt(0)}
                    </div>
                    {c.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">{c.points} Pts</TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm">Detail</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}