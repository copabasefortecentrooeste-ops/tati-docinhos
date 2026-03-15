export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  type: 'flavor' | 'topping' | 'size';
  choices: { id: string; name: string; priceAdd: number }[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image: string;
  categoryId: string;
  minQuantity: number;
  options: ProductOption[];
  featured: boolean;
  bestSeller: boolean;
}

export type OrderStatus = 'received' | 'analyzing' | 'production' | 'delivery' | 'delivered' | 'cancelled';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedOptions: Record<string, string>;
  notes?: string;
  unitPrice: number;
}

export interface DeliveryNeighborhood {
  id: string;
  name: string;
  fee: number;
  active: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  active: boolean;
  minOrder?: number;
}

export interface BusinessHours {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  active: boolean;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  items: CartItem[];
  customer: {
    name: string;
    phone: string;
    address?: string;
    neighborhood?: string;
    reference?: string;
  };
  isPickup: boolean;
  deliveryFee: number;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  changeFor?: number;
  couponCode?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt: string;
}

export interface StoreConfig {
  name: string;
  phone: string;
  instagram: string;
  address: string;
  pixKey: string;
  deliveryPolicy: string;
  logo?: string;
}
