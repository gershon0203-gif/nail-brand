import { Badge } from '@/components/ui/Badge';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import type { OrderStatus } from '@/types';

const toneFor: Record<OrderStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'brand' | 'clay'> = {
  pending: 'warning',
  confirmed: 'brand',
  processing: 'clay',
  packed: 'clay',
  shipped: 'brand',
  delivered: 'success',
  cancelled: 'danger',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={toneFor[status]}>{ORDER_STATUS_LABELS[status] || status}</Badge>;
}
