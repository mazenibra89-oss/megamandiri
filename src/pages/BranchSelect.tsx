import React from 'react';
import { useLocation } from 'wouter';
import { useBranches } from '@/hooks/use-pos';
import { useAppStore } from '@/lib/store';
import { Store, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives';

export default function BranchSelect() {
  const [, setLocation] = useLocation();
  const { data: branches, isLoading } = useBranches();
  const { setActiveBranchId } = useAppStore();

  const handleSelect = (id: string) => {
    setActiveBranchId(id);
    setLocation('/dashboard');
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
        </div>
      </div>
    </div>
  );
}
