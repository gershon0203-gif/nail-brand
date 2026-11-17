import { functionsUrl, isDemoMode, supabase } from '@/lib/supabase';
import type { OrderStatus, OrderWithItems } from '@/types';

const ORDER_SELECT = '*, items:order_items(*), profile:profiles!orders_user_id_fkey(id, full_name, email, phone)';

export interface PlaceOrderInput {
  addressId: string;
  paymentMethod: 'cod';
  notes?: string;
}

/**
 * Orders are created by the create-order Edge Function. The function delegates
 * the atomic work (price recalculation, stock validation, stock decrement and
 * snapshots) to a SECURITY DEFINER database function using the service role.
 * No price or total is ever trusted from the browser.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<{ orderId: string; orderNumber: string }> {
  if (isDemoMode) throw new Error('Placing orders requires a connected Supabase backend.');
  const { data, error } = await supabase.functions.invoke('create-order', {
    body: {
      address_id: input.addressId,
      payment_method: input.paymentMethod,
      notes: input.notes || null,
    },
  });
  if (error) throw error;
  if (!data?.orderId) throw new Error(data?.error || 'Order could not be created.');
  return { orderId: data.orderId as string, orderNumber: data.orderNumber as string };
}

export async function listMyOrders(): Promise<OrderWithItems[]> {
  if (isDemoMode) return [];
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as OrderWithItems[];
}

export async function getOrder(id: string): Promise<OrderWithItems | null> {
  if (isDemoMode) return null;
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as OrderWithItems) || null;
}

export async function listAllOrders(status?: OrderStatus, search?: string): Promise<OrderWithItems[]> {
  if (isDemoMode) return [];
  let q = supabase.from('orders').select(ORDER_SELECT).order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (search) {
    const term = search.replace(/[%,()]/g, ' ').trim();
    if (term) q = q.or(`order_number.ilike.%${term}%,customer_snapshot.ilike.%${term}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as OrderWithItems[];
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  if (isDemoMode) throw new Error('Order management requires a connected Supabase backend.');
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}

export const ORDER_TRACKING_STEPS: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered',
];

export function trackingStep(status: OrderStatus): number {
  if (status === 'cancelled') return -1;
  return ORDER_TRACKING_STEPS.indexOf(status);
}

export { functionsUrl };
