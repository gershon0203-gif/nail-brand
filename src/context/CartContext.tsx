import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import * as cartService from '@/services/cart.service';
import { cartTotals } from '@/services/cart.service';
import type { CartItemWithProduct } from '@/types';
import { useAuth } from './AuthContext';

interface CartContextValue {
  items: CartItemWithProduct[];
  count: number;
  subtotal: number;
  total: number;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  add: (productId: string, quantity?: number) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isDemo } = useAuth();
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!user && !isDemo) {
      setItems([]);
      setCount(0);
      setLoading(false);
      return;
    }
    setRefreshing(true);
    try {
      const [nextItems, nextCount] = await Promise.all([
        cartService.getCartItems(),
        cartService.getCartCount(),
      ]);
      setItems(nextItems);
      setCount(nextCount);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => { void refresh(); }, [refresh]);

  const add = useCallback(async (productId: string, quantity = 1) => {
    const next = await cartService.addToCart(productId, quantity);
    setCount(next);
    await refresh();
  }, [refresh]);

  const setQuantity = useCallback(async (productId: string, quantity: number) => {
    const next = await cartService.setCartQuantity(productId, quantity);
    setCount(next);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (productId: string) => {
    const next = await cartService.removeFromCart(productId);
    setCount(next);
    await refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    await cartService.clearCart();
    setCount(0);
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const { subtotal, total } = cartTotals(items);
    return { items, count, subtotal, total, loading, refreshing, refresh, add, setQuantity, remove, clear };
  }, [items, count, loading, refreshing, refresh, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
