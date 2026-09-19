import { Route, Switch, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppProvider } from '@/lib/store';
import { Shell } from '@/components/layout/Shell';

// Pages
import BranchSelect from '@/pages/BranchSelect';
import Dashboard from '@/pages/Dashboard';
import POS from '@/pages/POS';
import Products from '@/pages/Products';
import Stock from '@/pages/Stock';
import Transactions from '@/pages/Transactions';
import Shopee from '@/pages/Shopee';
import Customers from '@/pages/Customers';
import Reports from '@/pages/Reports';
import Shift from '@/pages/Shift';
import Settings from '@/pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  }
});

import { useSocketSync } from '@/hooks/use-socket';

function AppRoutes() {
  useSocketSync();
  return (
    <Shell>
      <Switch>
        <Route path="/" component={BranchSelect} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/pos" component={POS} />
        <Route path="/products" component={Products} />
        <Route path="/stock" component={Stock} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/shopee" component={Shopee} />
        <Route path="/customers" component={Customers} />
        <Route path="/reports" component={Reports} />
        <Route path="/shift" component={Shift} />
        <Route path="/settings" component={Settings} />
        <Route path="/:rest*">
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <h2 className="text-3xl font-bold text-muted-foreground mb-2">404</h2>
            <p className="text-muted-foreground">Halaman tidak ditemukan.</p>
          </div>
        </Route>
      </Switch>
    </Shell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRoutes />
        </WouterRouter>
        <Toaster position="top-center" richColors />
      </AppProvider>
    </QueryClientProvider>
  );
}