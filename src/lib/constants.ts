export const STORE = {
  name: import.meta.env.VITE_STORE_NAME || 'Norwood & Co.',
  tagline: import.meta.env.VITE_STORE_TAGLINE || 'Thoughtful goods, close to home.',
  email: import.meta.env.VITE_STORE_EMAIL || 'hello@norwoodandco.example',
  phone: import.meta.env.VITE_STORE_PHONE || '+1 (555) 010-2040',
  address: '128 Willow Lane, Old Town District, Springfield',
  currency: 'USD',
  locale: 'en-US',
  freeShippingThreshold: 75,
  standardShipping: 6.5,
} as const;

export const PAGE_SIZE = 12;

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ROLE_LABELS = {
  customer: 'Customer',
  admin: 'Admin',
  super_admin: 'Super Admin',
} as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export const STORAGE_BUCKETS = {
  products: 'product-images',
  categories: 'category-images',
} as const;
