
export enum ProductType {
  TSHIRT = 'TSHIRT',
  HOODIE = 'HOODIE',
  CAP = 'CAP',
  TANK_TOP = 'TANK_TOP'
}

export enum OrderSubtype {
  SCHOOL = 'Школа',
  PERSONAL = 'Личный дизайн',
  TEAM = 'Команда'
}

export enum HoodieType {
  ZIP = 'На молнии с капюшоном',
  KANGAROO = 'Кенгуру с капюшоном',
  SWEATER = 'Свитер без капюшона'
}

export enum CapType {
  BASEBALL = 'Бейсболка',
  BEANIE = 'Шапка-бини',
  SNAPBACK = 'Снэпбек'
}

export type OrderStatus = 'New' | 'Processing' | 'Completed' | 'Cancelled';

export interface Player {
  id: string;
  name: string;
  number: string;
  gender: 'Мальчик' | 'Девочка';
  sleeve: string;
  size: string;
}

export interface OrderItem {
  id: string;
  type: ProductType;
  subtype: OrderSubtype;
  school?: string;
  printPlaces: string[];
  images: string[]; // Generic list for backwards compatibility
  printImages?: Record<string, string>; // Mapping: Place -> Image Data
  players?: Player[];
  hoodieType?: HoodieType;
  capType?: CapType;
  gender?: 'Мальчик' | 'Девочка' | 'Универсальный';
  sleeve?: string;
  size: string;
  color: string;
  quantity: number;
  fabric?: string;
  wishes?: string;
}

export interface CustomerData {
  name: string;
  phone: string;
  email: string;
  address?: string;
  comments?: string;
}

export interface Order {
  orderNumber: string;
  customer: CustomerData;
  items: OrderItem[];
  createdAt: string;
  status: OrderStatus;
  viewed: boolean;
  internalNotes?: string;
}

export interface School {
  id: string;
  name: string;
  logo: string;
}

export interface InventoryItem {
  id: string;
  productType: ProductType;
  color: string;
  size: string;
  quantity: number;
  sleeve?: string;   // Короткий, Длинный, Без рукавов и т.д.
  fabric?: string;   // 100% хлопок, DryFit и т.д.
}
