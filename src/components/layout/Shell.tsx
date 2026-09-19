import React from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, MonitorSmartphone, Package, Box, Receipt, ShoppingBag, Users, BarChart3, Clock, Settings, Store, LogOut, Menu } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useBranches } from '@/hooks/use-pos';
import { Button } from '@/components/ui/primitives';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pos', label: 'Kasir', icon: MonitorSmartphone },
  { path: '/products', label: 'Produk', icon: Package },
  { path: '/stock', label: 'Stok', icon: Box },
  { path: '/transactions', label: 'Transaksi', icon: Receipt },
  { path: '/shopee', label: 'Shopee', icon: ShoppingBag },
  { path: '/customers', label: 'Pelanggan', icon: Users },
  { path: '/reports', label: 'Laporan', icon: BarChart3 },
  { path: '/shift', label: 'Shift', icon: Clock },
  { path: '/settings', label: 'Pengaturan', icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { activeBranchId, setActiveBranchId } = useAppStore();
  const { data: branches } = useBranches();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // If no branch is selected and we are not on root, redirect to root
  React.useEffect(() => {
    if (!activeBranchId && location !== '/') {
      setLocation('/');
    }
  }, [activeBranchId, location, setLocation]);

  if (location === '/') return <>{children}</>; // Branch select page handles itself

  const activeBranch = branches?.find(b => b.id === activeBranchId);

  const NavLinks = () => (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = location.startsWith(item.path);
        return (
          <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)}>
            <span className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${
              isActive 
                ? 'bg-primary text-primary-foreground font-medium' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}>
              <Icon className="h-5 w-5" />
              {item.label}
            </span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card h-full z-10 shadow-sm">
        <div className="flex items-center gap-2 h-16 px-6 border-b shrink-0">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <Store className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg text-primary tracking-tight">Mega Mandiri</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          <NavLinks />
        </div>

        <div className="p-4 border-t shrink-0 bg-muted/30">
          <div className="flex flex-col mb-4">
            <span className="text-xs text-muted-foreground">Cabang Aktif</span>
            <span className="font-medium text-sm truncate">{activeBranch?.name || 'Memuat...'}</span>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground" 
            onClick={() => setActiveBranchId('')}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Ganti Cabang
          </Button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 border-b bg-card shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <span className="font-bold text-primary">{activeBranch?.name || 'Mega Mandiri'}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between h-14 px-4 border-b">
            <span className="font-bold">Menu</span>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <NavLinks />
            <div className="pt-4 mt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => {
                  setActiveBranchId('');
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Ganti Cabang
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative z-0">
        {children}
      </main>

      {/* Mobile Bottom Nav (Quick Actions) */}
      <nav className="md:hidden flex items-center justify-around h-16 border-t bg-card pb-safe shrink-0 z-10">
        <Link href="/dashboard" className="flex flex-col items-center p-2 text-muted-foreground hover:text-primary">
          <LayoutDashboard className={`h-5 w-5 ${location === '/dashboard' ? 'text-primary' : ''}`} />
          <span className="text-[10px] mt-1">Dash</span>
        </Link>
        <Link href="/pos" className="flex flex-col items-center p-2 text-muted-foreground hover:text-primary">
          <MonitorSmartphone className={`h-5 w-5 ${location === '/pos' ? 'text-primary' : ''}`} />
          <span className="text-[10px] mt-1">Kasir</span>
        </Link>
        <Link href="/transactions" className="flex flex-col items-center p-2 text-muted-foreground hover:text-primary">
          <Receipt className={`h-5 w-5 ${location === '/transactions' ? 'text-primary' : ''}`} />
          <span className="text-[10px] mt-1">Trx</span>
        </Link>
        <Link href="/shopee" className="flex flex-col items-center p-2 text-muted-foreground hover:text-primary relative">
          <ShoppingBag className={`h-5 w-5 ${location === '/shopee' ? 'text-[#ee4d2d]' : ''}`} />
          <span className="text-[10px] mt-1">Shopee</span>
          {/* Mock notification dot */}
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#ee4d2d]"></span>
        </Link>
      </nav>
    </div>
  );
}
