import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui/primitives';
import { useSettings } from '@/hooks/use-pos';
import { toast } from 'sonner';

export default function Settings() {
  const { data: settings } = useSettings();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Pengaturan berhasil disimpan');
    // Note: Mock settings save to localstorage could be added here
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto bg-muted/10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Toko</h1>
        <p className="text-muted-foreground">Konfigurasi dasar aplikasi.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informasi Struk & Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Toko</Label>
              <Input defaultValue={settings?.storeName} />
            </div>
            <div className="space-y-2">
              <Label>Pesan Penutup Struk (Footer)</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={settings?.receiptFooter}
              />
            </div>
            <div className="pt-4">
              <Button type="submit">Simpan Perubahan</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
