import React from 'react';
import { useShopeeOrders, useUpdateShopeeOrder } from '@/hooks/use-pos';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui/primitives';
import { formatIDR, formatDate } from '@/lib/utils';
import { ShoppingBag, Check, CheckCircle2 } from 'lucide-react';

export default function Shopee() {
  const { data: orders = [] } = useShopeeOrders();
  const updateOrder = useUpdateShopeeOrder();

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto bg-muted/10">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-[#ee4d2d] rounded-lg text-white">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#ee4d2d]">ShopeeFood</h1>
          <p className="text-muted-foreground">Simulasi penerimaan pesanan online.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => (
          <Card key={order.id} className="border-t-4 border-t-[#ee4d2d]">
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="shopee" className="mb-2">{order.orderNo}</Badge>
                  <CardTitle className="text-lg">{formatIDR(order.total)}</CardTitle>
                </div>
                <Badge variant={order.status === 'new' ? 'destructive' : order.status === 'ready' ? 'warning' : 'success'}>
                  {order.status === 'new' ? 'Baru' : order.status === 'ready' ? 'Disiapkan' : 'Selesai'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{formatDate(order.date)}</p>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col h-[180px]">
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.qty}x Produk {item.productId}</span>
                  </div>
                ))}
              </div>
              
              {order.status === 'new' && (
                <Button variant="shopee" className="w-full" onClick={() => updateOrder.mutate({ id: order.id, status: 'ready' })}>
                  <Check className="h-4 w-4 mr-2" /> Terima & Siapkan
                </Button>
              )}
              {order.status === 'ready' && (
                <Button className="w-full bg-green-500 hover:bg-green-600" onClick={() => updateOrder.mutate({ id: order.id, status: 'completed' })}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Tandai Selesai (Diambil)
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}