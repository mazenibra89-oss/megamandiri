import React from 'react';
import { useLocation } from 'wouter';
import { useAddBranch, useBranches } from '@/hooks/use-pos';
import { useAppStore } from '@/lib/store';
import { Store, ChevronRight, Loader2, Plus, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, Button, Input, Label } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/modal';

export default function BranchSelect() {
  const [, setLocation] = useLocation();
  const { data: branches, isLoading } = useBranches();
  const addBranch = useAddBranch();
  const { setActiveBranchId } = useAppStore();
  const [isAdding, setIsAdding] = React.useState(false);
  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');

  const handleSelect = (id: string) => {
    setActiveBranchId(id);
    setLocation('/dashboard');
  };

  const handleAddBranch = () => {
    const cleanName = name.trim().slice(0, 80);
    const cleanAddress = address.trim().slice(0, 160);
    if (cleanName.length < 3 || cleanAddress.length < 5) return;
    addBranch.mutate(
      { name: cleanName, address: cleanAddress, phone: phone.replace(/[^\d+]/g, '').slice(0, 16) },
      {
        onSuccess: (branch) => {
          setIsAdding(false);
          setName('');
          setAddress('');
          setPhone('');
          handleSelect(branch.id);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary rounded-xl text-primary-foreground mb-2 shadow-sm">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Mega Mandiri</h1>
          <p className="text-muted-foreground">Pilih cabang untuk memulai sesi kasir</p>
        </div>

        <div className="space-y-3">
          {branches?.map((branch) => (
            <Card 
              key={branch.id} 
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md active:scale-[0.98]"
              onClick={() => handleSelect(branch.id)}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{branch.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{branch.address}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            className="w-full h-14 border-dashed border-2 text-primary"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Tambahkan Cabang
          </Button>
        </div>
      </div>
      <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Tambahkan Cabang Baru">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Cabang</Label>
            <Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Mega Mandiri - Bekasi" />
          </div>
          <div className="space-y-2">
            <Label>Alamat Cabang</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" value={address} maxLength={160} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat lengkap cabang" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nomor Telepon Cabang</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, '').slice(0, 16))} placeholder="021..." />
            </div>
          </div>
          <Button className="w-full h-12" disabled={name.trim().length < 3 || address.trim().length < 5 || addBranch.isPending} onClick={handleAddBranch}>
            {addBranch.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Simpan dan Pilih Cabang'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}