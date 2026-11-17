import { demoProductById } from '@/lib/demoData';
import { discountPrice } from '@/lib/utils';
import { isDemoMode, supabase } from '@/lib/supabase';
import type { CartItemWithProduct } from '@/types';

const CART_SELECT = '*, product:products(*, images:product_images(*), category:categories(*))';

/** Demo cart lives in memory only and is clearly badged in the UI. */
const demoCart = new Map<string, number>();

function demoItems(): CartItemWithProduct[] {
  return [...demoCart.entries()].flatMap(([id, quantity], index) => {
    const product = demoProductById(id);
    if (!product) return [];
    return [{
      id: `demo-cart-${index}`,
      cart_id: 'demo-cart',
      product_id: id,
      quantity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product,
      line_total: Math.round(discountPrice(product.price, product.discount_percent) * quantity * 100) / 100,
    }];
  });
}

export async function getCartItems(): Promise<CartItemWithProduct[]> {
  if (isDemoMode) return demoItems();
  const { data, error } = await supabase.from('cart_items').select(CART_SELECT).order('created_at');
  if (error) throw error;
  return ((data || []) as Record<string, unknown>[]).map((row) => {
    const product = row.product as CartItemWithProduct['product'];
    const unit = discountPrice(product.price, product.discount_percent);
    return {
      ...(row as unknown as CartItemWithProduct),
      product,
      line_total: Math.round(unit * Number(row.quantity) * 100) / 100,
    };
  });
}

export async function getCartCount(): Promise<number> {
  if (isDemoMode) return [...demoCart.values()].reduce((sum, q) => sum + q, 0);
  const { data, error } = await supabase.rpc('get_cart_count');
  if (error) throw error;
  return Number(data || 0);
}

export async function addToCart(productId: string, quantity = 1): Promise<number> {
  if (isDemoMode) {
    const product = demoProductById(productId);
    if (!product) throw new Error('Product not found.');
    const next = (demoCart.get(productId) || 0) + quantity;
    if (next > product.stock_quantity) throw new Error(`Only ${product.stock_quantity} available in stock.`);
    demoCart.set(productId, next);
    return getCartCount();
  }
  const { data, error } = await supabase.rpc('add_to_cart', {
    p_product_id: productId,
    p_quantity: quantity,
  });
  if (error) throw error;
  return Number((data as { cart_count?: number })?.cart_count || 0);
}

export async function setCartQuantity(productId: string, quantity: number): Promise<number> {
  if (isDemoMode) {
    const product = demoProductById(productId);
    if (quantity <= 0) demoCart.delete(productId);
    else {
      if (product && quantity > product.stock_quantity) {
        throw new Error(`Only ${product.stock_quantity} available in stock.`);
      }
      demoCart.set(productId, quantity);
    }
    return getCartCount();
  }
  const { data, error } = await supabase.rpc('set_cart_quantity', {
    p_product_id: productId,
    p_quantity: quantity,
  });
  if (error) throw error;
  return Number((data as { cart_count?: number })?.cart_count || 0);
}

export async function removeFromCart(productId: string): Promise<number> {
  if (isDemoMode) {
    demoCart.delete(productId);
    return getCartCount();
  }
  const { data, error } = await supabase.rpc('remove_from_cart', { p_product_id: productId });
  if (error) throw error;
  return Number((data as { cart_count?: number })?.cart_count || 0);
}

export async function clearCart(): Promise<void> {
  if (isDemoMode) {
    demoCart.clear();
    return;
  }
  const { error } = await supabase.rpc('clear_cart');
  if (error) throw error;
}

export function cartTotals(items: CartItemWithProduct[]) {
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  return { subtotal, total: subtotal };
}
