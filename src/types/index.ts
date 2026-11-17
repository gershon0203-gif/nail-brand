export type UserRole = 'customer' | 'admin' | 'super_admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  path: string;
  alt_text: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  sku: string;
  category_id: string | null;
  price: number;
  discount_percent: number;
  stock_quantity: number;
  is_featured: boolean;
  is_archived: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithDetails extends Product {
  images: ProductImage[];
  category: Category | null;
  sold_count?: number;
}

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  full_name: string;
  phone: string;
  house_flat: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pin_code: string;
  landmark: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type AddressInput = Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemWithProduct extends CartItem {
  product: ProductWithDetails;
  line_total: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cod';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'not_applicable';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string;
  product_image_path: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_amount: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  currency: string;
  address_snapshot: Record<string, string | boolean | null>;
  customer_snapshot: Record<string, string | null>;
  notes: string | null;
  placed_at: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  profile?: Pick<Profile, 'id' | 'full_name' | 'email' | 'phone'> | null;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  change_amount: number;
  quantity_after: number;
  reason: string;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'name_asc';

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  featuredOnly?: boolean;
  includeArchived?: boolean;
}

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  message: string;
}
