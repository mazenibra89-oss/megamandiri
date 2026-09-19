import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

interface AppState {
  activeBranchId: string | null;
  setActiveBranchId: (id: string) => void;
  cart: CartItem[];
  addToCart: (product: { id: string; name: string; price: number }) => void;
  updateCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(() => {
    return localStorage.getItem('pos_active_branch') || null;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('pos_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const setActiveBranchId = (id: string) => {
    setActiveBranchIdState(id);
    localStorage.setItem('pos_active_branch', id);
  };

  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: { id: string; name: string; price: number }) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }];
    });
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.productId === productId ? { ...item, qty } : item));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{ activeBranchId, setActiveBranchId, cart, addToCart, updateCartQty, removeFromCart, clearCart }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};