export type ProductCategory = 
  | 'Apparel'
  | 'Drinkware'
  | 'Merchandise'
  | 'Collections'
  | 'Fan Projects'
  | 'Digital Products'
  | 'Team KAAL Publications';

export type ProductSize = 'TS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface SizeChartEntry {
  size: ProductSize;
  width: number;
  length: number;
}

export interface ProductGalleryItem {
  label: string;
  url: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  category: ProductCategory;
  description: string;
  price: number;
  basePrice?: number;
  xxlPrice?: number;
  color?: string;
  capacity?: string;
  dimensions?: string;
  material?: string;
  sizes?: ProductSize[];
  sizeChart?: SizeChartEntry[];
  galleryImages: ProductGalleryItem[];
  imageUrl: string;
  isAvailable: boolean;
  stock?: number;
  featured?: boolean;
  sortOrder?: number;
}

export type OrderStatus = 
  | 'Pending Payment'
  | 'Under Verification'
  | 'Paid'
  | 'Ready For Pickup'
  | 'Claimed'
  | 'Cancelled';

export type PaymentStatus = 
  | 'Pending Payment'
  | 'Under Verification'
  | 'Paid'
  | 'Rejected';

export interface PaymentMethodConfig {
  id: string;
  name: string; // e.g. "GCash", "Maya", "MariBank", "Bank Transfer", or future provider
  accountName: string;
  accountNumber: string;
  qrCodeUrl?: string;
  instructions?: string;
  active: boolean;
  sortOrder?: number;
}

export type PaymentMethod = string;

export interface OrderItem {
  id: string;
  orderId?: string;
  productId: string;
  productTitle: string;
  productCategory?: ProductCategory;
  variant?: {
    size?: ProductSize;
    color?: string;
  };
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string; // APMERCH-ORD-00001
  confirmationNumber: string; // APMERCH-CONF-00001
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  customerFacebook?: string;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string;
  paymentReferenceNumber?: string;
  paymentSenderName?: string;
  paymentSenderNumber?: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  pickupDate: string; // e.g. "October 11, 2026"
  pickupLocation: string;
  deliveryMethod: 'Pickup Only';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  passwordHash?: string;
  mobileNumber: string;
  facebookName?: string;
  isVerified: boolean;
  verificationCode?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export type AdminRole = 'Super Admin' | 'Admin';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  passwordHash?: string;
  active: boolean;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  orderNumber: string;
  confirmationNumber: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  senderName: string;
  senderNumber: string;
  referenceNumber: string;
  proofUrl: string;
  status: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  notes?: string;
}

export interface CollectionItem {
  id: string;
  title: string;
  description: string;
  category: string;
  season: string;
  coverImage: string;
  images?: string[];
  status: 'Exclusive' | 'Limited Edition' | 'Archived';
  releaseYear: string;
  itemCount: number;
}

export type FanProjectCategory = 
  | 'Donation Drives'
  | 'Streaming Projects'
  | 'Birthday Projects'
  | 'Community Projects';

export interface FanProject {
  id: string;
  title: string;
  category: FanProjectCategory;
  description: string;
  targetAmount?: number;
  raisedAmount?: number;
  organizer: string;
  status: 'Active' | 'Completed' | 'Upcoming';
  bannerImage: string;
  link?: string;
  date: string;
  impactMetrics?: string;
}

export type LibraryItemType = 
  | 'Fanfiction'
  | 'Story'
  | 'Ebook'
  | 'PDF'
  | 'Archive';

export interface TeamKAALLibraryItem {
  id: string;
  title: string;
  author: string;
  type?: LibraryItemType;
  category?: string;
  description?: string;
  synopsis?: string;
  coverImage: string;
  downloadUrl?: string;
  readUrl?: string;
  contentSnippet?: string;
  fullText?: string;
  fullContent?: string;
  tags?: string[];
  publishedDate?: string;
  chaptersCount?: number;
  readTimeMinutes?: number;
  readTime?: string;
  pageCount?: number;
}

export type TeamKAALItem = TeamKAALLibraryItem;

export type EmailTemplateType = 
  | 'Registration Verification'
  | 'Order Submitted'
  | 'Payment Reminder'
  | 'Payment Approved'
  | 'Ready For Pickup'
  | 'Order Cancelled';

export interface EmailLog {
  id: string;
  toEmail: string;
  recipientName: string;
  subject: string;
  templateType: EmailTemplateType;
  orderNumber?: string;
  status: 'Sent' | 'Queued' | 'Failed';
  sentAt: string;
  previewBody?: string;
}

export interface AppSettings {
  sheetName: string;
  appsScriptUrl: string;
  paymentMethods: PaymentMethodConfig[];
  gcashNumber: string;
  gcashAccountName: string;
  gcashQrUrl?: string;
  maribankNumber: string;
  maribankAccountName: string;
  maribankQrUrl?: string;
  preorderOpenDate: string;
  preorderCloseDate: string;
  pickupDate: string;
  pickupLocation: string;
  deliveryOptionEnabled: boolean;
  announcementText: string;
  supportEmail: string;
  organizerName: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  selectedSize?: ProductSize;
  unitPrice: number;
  quantity: number;
}
