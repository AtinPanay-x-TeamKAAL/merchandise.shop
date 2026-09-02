import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  Product, 
  Order, 
  Customer, 
  AdminUser, 
  AppSettings, 
  CartItem, 
  CollectionItem, 
  FanProject, 
  TeamKAALLibraryItem,
  ProductSize,
  EmailLog,
  PaymentRecord,
  OrderStatus,
  PaymentStatus,
  EmailTemplateType
} from '../types';
import { googleSheetsApi } from '../services/googleSheetsApi';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_SETTINGS, 
  INITIAL_COLLECTIONS, 
  INITIAL_FAN_PROJECTS, 
  INITIAL_LIBRARY_ITEMS,
  INITIAL_CUSTOMERS,
  INITIAL_ADMINS,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_EMAIL_LOGS
} from '../data/initialData';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  // Config & Status
  settings: AppSettings;
  isPreorderActive: boolean;
  isPreorderClosed: boolean;
  isPreorderUpcoming: boolean;
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  };
  
  // Theme & Preferences (Allowed in localStorage)
  themePreference: 'dark' | 'light';
  toggleThemePreference: () => void;
  recentlyViewed: string[];
  addRecentlyViewed: (productId: string) => void;

  // Products & Collections
  products: Product[];
  collections: CollectionItem[];
  fanProjects: FanProject[];
  libraryItems: TeamKAALLibraryItem[];
  teamKaalItems: TeamKAALLibraryItem[];
  refreshData: () => Promise<void>;
  syncWithGoogleSheets: () => Promise<void>;

  // Customer Auth
  currentCustomer: Customer | null;
  customerOrders: Order[];
  isCustomerLoggedIn: boolean;
  loginCustomer: (email: string) => Promise<Customer>;
  registerCustomer: (data: { fullName: string; email: string; mobileNumber: string; facebookName?: string; password?: string }) => Promise<{ customer: Customer; code: string }>;
  verifyCustomerEmail: (email: string, code: string) => Promise<Customer>;
  logoutCustomer: () => void;
  refreshCustomerOrders: () => Promise<void>;

  // Admin Auth
  currentAdmin: AdminUser | null;
  isAdminLoggedIn: boolean;
  isSuperAdmin: boolean;
  loginAdmin: (email: string, password?: string) => Promise<AdminUser>;
  logoutAdmin: () => void;

  // Cart (Temporary cache allowed in localStorage)
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (product: Product, selectedSize?: ProductSize, quantity?: number) => void;
  removeFromCart: (productId: string, selectedSize?: ProductSize) => void;
  updateCartQuantity: (productId: string, quantity: number, selectedSize?: ProductSize) => void;
  clearCart: () => void;

  // Order Operations
  createOrder: (orderData: {
    customerName: string;
    customerEmail: string;
    customerMobile: string;
    customerFacebook?: string;
    paymentMethod: string;
    paymentProofUrl?: string;
    paymentReferenceNumber?: string;
    paymentSenderName?: string;
    paymentSenderNumber?: string;
    notes?: string;
  }) => Promise<Order>;
  submitPaymentProof: (orderNumber: string, proofUrl: string, referenceNumber: string, senderName: string, senderNumber: string) => Promise<Order>;
  searchOrderByNumber: (orderNumber: string) => Promise<Order | null>;

  // Admin Management Operations
  allOrders: Order[];
  orders: Order[];
  allPayments: PaymentRecord[];
  allCustomers: Customer[];
  allAdmins: AdminUser[];
  emailLogs: EmailLog[];
  saveProduct: (product: Product) => Promise<Product>;
  addNewProduct: (product: Omit<Product, 'id' | 'slug' | 'isAvailable' | 'galleryImages'> & Partial<Product>) => Promise<Product>;
  updateProduct: (product: Product) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<boolean>;
  saveCollection: (col: CollectionItem) => Promise<CollectionItem>;
  saveFanProject: (fp: FanProject) => Promise<FanProject>;
  saveLibraryItem: (item: TeamKAALLibraryItem) => Promise<TeamKAALLibraryItem>;
  updateOrderStatus: (orderNumber: string, status: OrderStatus, paymentStatus?: PaymentStatus, notes?: string, sendEmail?: boolean) => Promise<Order>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<AppSettings>;
  sendManualEmail: (toEmail: string, recipientName: string, subject: string, templateType: EmailTemplateType, orderNumber?: string, customBody?: string) => Promise<EmailLog>;
  addAdminUser: (admin: { email: string; name: string; role: 'Super Admin' | 'Admin' }) => Promise<AdminUser>;
  resetDatabaseDefaults: () => Promise<void>;

  // UI Modals & Toasts
  activeModal: string | null;
  modalData: any;
  openModal: (modalName: string, data?: any) => void;
  closeModal: () => void;
  toasts: ToastNotification[];
  addToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Global Quick Action / View
  activeView: 'home' | 'merch' | 'collections' | 'fan-projects' | 'team-kaal-corner' | 'about' | 'customer-dashboard' | 'admin-dashboard' | 'track-order' | 'admin';
  setActiveView: (view: 'home' | 'merch' | 'collections' | 'fan-projects' | 'team-kaal-corner' | 'about' | 'customer-dashboard' | 'admin-dashboard' | 'track-order' | 'admin') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// STRICT MANDATE: localStorage is ONLY permitted for temporary cart cache, theme preference, and recently viewed products.
// All Database Entities (Orders, Customers, Payments, Admins, etc.) live strictly in Google Sheets / APMERCH_DATABASE.
const PERMITTED_LOCAL_STORAGE_KEYS = {
  CART_CACHE: 'apmerch_temp_cart',
  THEME_PREFERENCE: 'apmerch_theme_preference',
  RECENTLY_VIEWED: 'apmerch_recently_viewed'
};

const BROWSER_SESSION_KEYS = {
  ACTIVE_CUSTOMER_EMAIL: 'apmerch_session_cust_email',
  ACTIVE_ADMIN_EMAIL: 'apmerch_session_admin_email'
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [collections, setCollections] = useState<CollectionItem[]>(INITIAL_COLLECTIONS);
  const [fanProjects, setFanProjects] = useState<FanProject[]>(INITIAL_FAN_PROJECTS);
  const [libraryItems, setLibraryItems] = useState<TeamKAALLibraryItem[]>(INITIAL_LIBRARY_ITEMS);
  
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allAdmins, setAllAdmins] = useState<AdminUser[]>(INITIAL_ADMINS);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(INITIAL_EMAIL_LOGS);

  // Client-side local preferences strictly per permitted requirements
  const [cart, setCart] = useState<CartItem[]>([]);
  const [themePreference, setThemePreference] = useState<'dark' | 'light'>('dark');
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [activeView, setActiveView] = useState<'home' | 'merch' | 'collections' | 'fan-projects' | 'team-kaal-corner' | 'about' | 'customer-dashboard' | 'admin-dashboard' | 'track-order'>('home');

  // Load initial data & sync with APMERCH_DATABASE in Google Sheets
  const refreshData = async () => {
    try {
      const syncResult = await googleSheetsApi.syncWithSheet();

      setSettings(syncResult.settings);
      setProducts(syncResult.products);
      setCollections(syncResult.collections);
      setFanProjects(syncResult.fanProjects);
      setLibraryItems(syncResult.libraryItems);
      setAllOrders(syncResult.orders);
      setAllPayments(syncResult.payments);
      setAllCustomers(syncResult.customers);
      setAllAdmins(syncResult.admins);
      setEmailLogs(syncResult.emailLogs);

      // Check and hydrate active session accounts from Google Sheet data
      const activeCustEmail = sessionStorage.getItem(BROWSER_SESSION_KEYS.ACTIVE_CUSTOMER_EMAIL);
      if (activeCustEmail) {
        const foundCust = syncResult.customers.find(c => c.email.toLowerCase() === activeCustEmail.toLowerCase());
        if (foundCust) {
          setCurrentCustomer(foundCust);
          const orders = syncResult.orders.filter(o => o.customerEmail.toLowerCase() === activeCustEmail.toLowerCase());
          setCustomerOrders(orders);
        }
      }

      const activeAdminEmail = sessionStorage.getItem(BROWSER_SESSION_KEYS.ACTIVE_ADMIN_EMAIL);
      if (activeAdminEmail) {
        const foundAdmin = syncResult.admins.find(a => a.email.toLowerCase() === activeAdminEmail.toLowerCase());
        if (foundAdmin) {
          setCurrentAdmin(foundAdmin);
        } else if (activeAdminEmail.toLowerCase() === 'yeojeam@gmail.com') {
          const defaultAdmin = syncResult.admins[0] || INITIAL_ADMINS[0];
          setCurrentAdmin(defaultAdmin);
        }
      }
    } catch (error) {
      console.error('APMERCH_DATABASE synchronization error:', error);
      throw error;
    }
  };

  const syncWithGoogleSheets = async () => {
    try {
      const url = googleSheetsApi.getAppsScriptUrl();
      if (!url) {
        addToast('error', 'Google Sheets Not Configured', 'VITE_APPS_SCRIPT_URL is not set. Please configure VITE_APPS_SCRIPT_URL or update the Apps Script URL in Settings.');
        return;
      }
      await refreshData();
      addToast('success', 'APMERCH_DATABASE Synced', 'Successfully synchronized with Google Sheets single source of truth.');
    } catch (error: any) {
      console.error('[APMERCH_DATABASE] Manual sync error:', error);
      addToast('error', 'Google Sheets Sync Failed', error?.message || 'Could not communicate with Google Sheets.');
    }
  };

  useEffect(() => {
    // Initial mount hydration from APMERCH_DATABASE
    refreshData().catch(err => {
      console.warn('[APMERCH_DATABASE] Initial mount synchronization warning:', err?.message || err);
    });

    // Hydrate allowed client preferences from localStorage
    try {
      const storedCart = localStorage.getItem(PERMITTED_LOCAL_STORAGE_KEYS.CART_CACHE);
      if (storedCart) setCart(JSON.parse(storedCart));

      const storedTheme = localStorage.getItem(PERMITTED_LOCAL_STORAGE_KEYS.THEME_PREFERENCE);
      if (storedTheme === 'light' || storedTheme === 'dark') setThemePreference(storedTheme);

      const storedRecent = localStorage.getItem(PERMITTED_LOCAL_STORAGE_KEYS.RECENTLY_VIEWED);
      if (storedRecent) setRecentlyViewed(JSON.parse(storedRecent));
    } catch (e) {
      console.warn('Client preference hydration error', e);
    }
  }, []);

  // Save permitted cart cache to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PERMITTED_LOCAL_STORAGE_KEYS.CART_CACHE, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart cache', e);
    }
  }, [cart]);

  // Save permitted theme preference to localStorage
  const toggleThemePreference = () => {
    const nextTheme = themePreference === 'dark' ? 'light' : 'dark';
    setThemePreference(nextTheme);
    try {
      localStorage.setItem(PERMITTED_LOCAL_STORAGE_KEYS.THEME_PREFERENCE, nextTheme);
    } catch (e) {}
  };

  // Save permitted recently viewed products to localStorage
  const addRecentlyViewed = (productId: string) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== productId);
      const updated = [productId, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(PERMITTED_LOCAL_STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Sync customer orders when current customer changes
  useEffect(() => {
    if (currentCustomer) {
      googleSheetsApi.getCustomerOrders(currentCustomer.email).then(setCustomerOrders);
    } else {
      setCustomerOrders([]);
    }
  }, [currentCustomer]);

  // Pre-order countdown calculator
  // Deadline: September 20, 2026 23:59:59 (Philippine Time UTC+8)
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const updateCountdown = () => {
      const deadline = new Date(settings?.preorderCloseDate || '2026-09-20T23:59:59+08:00').getTime();
      const now = new Date().getTime();
      const difference = deadline - now;

      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({ days, hours, minutes, seconds, isExpired: false });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [settings.preorderCloseDate]);

  const isPreorderClosed = timeRemaining.isExpired;
  const isPreorderActive = !timeRemaining.isExpired;
  const isPreorderUpcoming = false;

  // Cart operations
  const addToCart = (product: Product, selectedSize?: ProductSize, quantity: number = 1) => {
    let finalUnitPrice = product.basePrice || product.price;
    if (selectedSize === 'XXL' && product.xxlPrice) {
      finalUnitPrice = product.xxlPrice;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.productId === product.id && item.selectedSize === selectedSize
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      } else {
        const newItem: CartItem = {
          productId: product.id,
          product,
          unitPrice: finalUnitPrice,
          quantity,
          selectedSize
        };
        return [...prev, newItem];
      }
    });

    addToast('success', 'Added to Cart', `${quantity}x ${product.title} ${selectedSize ? `(${selectedSize})` : ''} added.`);
  };

  const removeFromCart = (productId: string, selectedSize?: ProductSize) => {
    setCart(prev => prev.filter(item => 
      !(item.productId === productId && item.selectedSize === selectedSize)
    ));
    addToast('info', 'Item Removed', 'Item removed from your cart.');
  };

  const updateCartQuantity = (productId: string, quantity: number, selectedSize?: ProductSize) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.productId === productId && item.selectedSize === selectedSize) {
        return {
          ...item,
          quantity
        };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0), [cart]);

  // Customer Auth (Reads from APMERCH_DATABASE, uses session memory)
  const loginCustomer = async (email: string) => {
    const customer = await googleSheetsApi.loginCustomer(email);
    setCurrentCustomer(customer);
    sessionStorage.setItem(BROWSER_SESSION_KEYS.ACTIVE_CUSTOMER_EMAIL, customer.email);
    await refreshData();
    addToast('success', 'Welcome Back!', `Logged in as ${customer.fullName}`);
    return customer;
  };

  const registerCustomer = async (data: { fullName: string; email: string; mobileNumber: string; facebookName?: string; password?: string }) => {
    const res = await googleSheetsApi.registerCustomer({
      ...data,
      isVerified: false
    });
    addToast('info', 'Verification Required', `A 6-digit verification code was sent to ${data.email}.`);
    return res;
  };

  const verifyCustomerEmail = async (email: string, code: string) => {
    const verifiedCustomer = await googleSheetsApi.verifyCustomerEmail(email, code);
    setCurrentCustomer(verifiedCustomer);
    sessionStorage.setItem(BROWSER_SESSION_KEYS.ACTIVE_CUSTOMER_EMAIL, verifiedCustomer.email);
    await refreshData();
    addToast('success', 'Account Verified!', 'Your account has been successfully verified. You can now checkout exclusive merch.');
    return verifiedCustomer;
  };

  const logoutCustomer = () => {
    setCurrentCustomer(null);
    sessionStorage.removeItem(BROWSER_SESSION_KEYS.ACTIVE_CUSTOMER_EMAIL);
    addToast('info', 'Logged Out', 'You have been logged out of your customer account.');
  };

  const refreshCustomerOrders = async () => {
    if (currentCustomer) {
      const orders = await googleSheetsApi.getCustomerOrders(currentCustomer.email);
      setCustomerOrders(orders);
    }
  };

  // Admin Auth (Reads from APMERCH_DATABASE, uses session memory)
  const loginAdmin = async (email: string) => {
    const admins = await googleSheetsApi.getAllAdmins();
    const found = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    
    // Default super admin yeojeam@gmail.com
    if (!found && email.toLowerCase() === 'yeojeam@gmail.com') {
      const defaultAdmin: AdminUser = {
        id: 'ADM-001',
        email: 'yeojeam@gmail.com',
        name: 'Yeo Jeam',
        role: 'Super Admin',
        active: true,
        createdAt: new Date().toISOString()
      };
      await googleSheetsApi.addAdminUser(defaultAdmin);
      setCurrentAdmin(defaultAdmin);
      sessionStorage.setItem(BROWSER_SESSION_KEYS.ACTIVE_ADMIN_EMAIL, defaultAdmin.email);
      addToast('success', 'Super Admin Authenticated', `Welcome Yeo Jeam (Super Admin)`);
      return defaultAdmin;
    }

    if (!found) {
      throw new Error('Unauthorized admin email. Only authorized organizers have dashboard access.');
    }

    setCurrentAdmin(found);
    sessionStorage.setItem(BROWSER_SESSION_KEYS.ACTIVE_ADMIN_EMAIL, found.email);
    addToast('success', 'Admin Access Granted', `Welcome ${found.name} (${found.role})`);
    return found;
  };

  const logoutAdmin = () => {
    setCurrentAdmin(null);
    sessionStorage.removeItem(BROWSER_SESSION_KEYS.ACTIVE_ADMIN_EMAIL);
    addToast('info', 'Admin Logged Out', 'Admin session terminated.');
  };

  const isSuperAdmin = currentAdmin?.role === 'Super Admin';

  // Order operations - Strictly server-side sequential generation in Google Sheet
  const createOrder = async (orderData: {
    customerName: string;
    customerEmail: string;
    customerMobile: string;
    customerFacebook?: string;
    paymentMethod: string;
    paymentProofUrl?: string;
    paymentReferenceNumber?: string;
    paymentSenderName?: string;
    paymentSenderNumber?: string;
    notes?: string;
  }) => {
    if (cart.length === 0) {
      throw new Error('Your cart is empty. Please add items before checking out.');
    }

    const orderItems = cart.map((item, idx) => ({
      id: `ITEM-${Date.now()}-${idx}`,
      productId: item.productId,
      productTitle: item.product.title,
      productCategory: item.product.category,
      variant: item.selectedSize ? { size: item.selectedSize } : undefined,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.unitPrice * item.quantity,
      imageUrl: item.product.imageUrl
    }));

    const orderInput = {
      customerId: currentCustomer?.id || `CUST-GUEST-${Date.now()}`,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerMobile: orderData.customerMobile,
      customerFacebook: orderData.customerFacebook || '',
      items: orderItems,
      subtotal: cartSubtotal,
      totalAmount: cartSubtotal,
      paymentMethod: orderData.paymentMethod,
      paymentProofUrl: orderData.paymentProofUrl,
      paymentReferenceNumber: orderData.paymentReferenceNumber,
      paymentSenderName: orderData.paymentSenderName,
      paymentSenderNumber: orderData.paymentSenderNumber,
      paymentStatus: orderData.paymentProofUrl ? 'Under Verification' as PaymentStatus : 'Pending Payment' as PaymentStatus,
      status: orderData.paymentProofUrl ? 'Under Verification' as OrderStatus : 'Pending Payment' as OrderStatus,
      pickupDate: settings.pickupDate || 'October 11, 2026',
      pickupLocation: settings.pickupLocation || "A'TIN Panay BlockScreening Venue (Cinema Panay / Iloilo Hub)",
      deliveryMethod: 'Pickup Only' as const,
      notes: orderData.notes || ''
    };

    const newOrder = await googleSheetsApi.createOrder(orderInput);
    
    // Clear cart upon successful order creation
    clearCart();
    await refreshData();

    addToast('success', 'Order Submitted Successfully!', `Order ${newOrder.orderNumber} (Conf: ${newOrder.confirmationNumber}) recorded in APMERCH_DATABASE.`);
    return newOrder;
  };

  const submitPaymentProof = async (
    orderNumber: string, 
    proofUrl: string, 
    referenceNumber: string, 
    senderName: string, 
    senderNumber: string
  ) => {
    const updated = await googleSheetsApi.submitPaymentProof(orderNumber, proofUrl, referenceNumber, senderName, senderNumber);
    await refreshData();
    addToast('success', 'Payment Proof Submitted', `Payment verification submitted for order ${orderNumber}.`);
    return updated;
  };

  const searchOrderByNumber = async (orderNumber: string) => {
    return await googleSheetsApi.getOrderByIdOrConfirmation(orderNumber);
  };

  // Admin Management Operations
  const saveProduct = async (product: Product) => {
    const saved = await googleSheetsApi.saveProduct(product);
    await refreshData();
    addToast('success', 'Product Saved', `"${product.title}" updated in APMERCH_DATABASE.`);
    return saved;
  };

  const addNewProduct = async (productData: Omit<Product, 'id' | 'slug' | 'isAvailable' | 'galleryImages'> & Partial<Product>) => {
    const newProduct: Product = {
      id: `PROD-${Date.now()}`,
      slug: productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      isAvailable: true,
      galleryImages: productData.galleryImages || [{ label: 'Product View', url: productData.imageUrl || '' }],
      imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      title: productData.title,
      category: productData.category || 'Apparel',
      description: productData.description || '',
      price: productData.price || productData.basePrice || 550,
      basePrice: productData.basePrice || productData.price || 550,
      xxlPrice: productData.xxlPrice,
      color: productData.color,
      capacity: productData.capacity,
      dimensions: productData.dimensions,
      material: productData.material,
      sizes: productData.sizes,
      sizeChart: productData.sizeChart
    };
    return await saveProduct(newProduct);
  };

  const updateProduct = async (product: Product) => {
    return await saveProduct(product);
  };

  const deleteProduct = async (productId: string) => {
    const deleted = await googleSheetsApi.deleteProduct(productId);
    await refreshData();
    addToast('info', 'Product Removed', 'Product deleted from catalog in APMERCH_DATABASE.');
    return deleted;
  };

  const saveCollection = async (col: CollectionItem) => {
    const saved = await googleSheetsApi.saveCollection(col);
    await refreshData();
    addToast('success', 'Collection Saved', `Collection "${col.title}" updated in APMERCH_DATABASE.`);
    return saved;
  };

  const saveFanProject = async (fp: FanProject) => {
    const saved = await googleSheetsApi.saveFanProject(fp);
    await refreshData();
    addToast('success', 'Fan Project Saved', `Fan project "${fp.title}" updated in APMERCH_DATABASE.`);
    return saved;
  };

  const saveLibraryItem = async (item: TeamKAALLibraryItem) => {
    const saved = await googleSheetsApi.saveLibraryItem(item);
    await refreshData();
    addToast('success', 'Library Item Saved', `"${item.title}" saved to Team KAAL Corner.`);
    return saved;
  };

  const updateOrderStatus = async (
    orderNumber: string, 
    status: OrderStatus, 
    paymentStatus?: PaymentStatus, 
    notes?: string, 
    sendEmail: boolean = true
  ) => {
    const defaultPayStatus: PaymentStatus = 
      status === 'Paid' || status === 'Ready For Pickup' || status === 'Claimed' 
        ? 'Paid' 
        : status === 'Cancelled' 
        ? 'Rejected' 
        : status === 'Under Verification' 
        ? 'Under Verification' 
        : 'Pending Payment';

    const finalPayStatus = paymentStatus || defaultPayStatus;
    const verifiedBy = currentAdmin?.email || 'yeojeam@gmail.com';
    const updated = await googleSheetsApi.updateOrderStatus(orderNumber, status, finalPayStatus, verifiedBy, notes, sendEmail);
    await refreshData();
    addToast('success', 'Order Status Updated', `Order ${orderNumber} set to "${status}".`);
    return updated;
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await googleSheetsApi.updateSettings(newSettings);
    setSettings(updated);
    addToast('success', 'Settings Saved', 'System configurations updated in APMERCH_DATABASE.');
    return updated;
  };

  const sendManualEmail = async (
    toEmail: string,
    recipientName: string,
    subject: string,
    templateType: EmailTemplateType,
    orderNumber?: string,
    customBody?: string
  ) => {
    const log = await googleSheetsApi.sendManualEmail(toEmail, recipientName, subject, templateType, orderNumber, customBody);
    await refreshData();
    addToast('success', 'Email Sent', `Dispatched "${templateType}" to ${toEmail}`);
    return log;
  };

  const addAdminUser = async (admin: { email: string; name: string; role: 'Super Admin' | 'Admin' }) => {
    const created = await googleSheetsApi.addAdminUser({
      ...admin,
      active: true
    });
    await refreshData();
    addToast('success', 'Admin Added', `Granted ${admin.role} privileges to ${admin.email}`);
    return created;
  };

  const resetDatabaseDefaults = async () => {
    googleSheetsApi.resetToFactoryDefaults();
    await refreshData();
    addToast('info', 'Database Reset', 'Reset APMERCH_DATABASE in-memory state.');
  };

  // Toast UI
  const addToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = `TOAST-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Modal UI
  const openModal = (modalName: string, data: any = null) => {
    setActiveModal(modalName);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        isPreorderActive,
        isPreorderClosed,
        isPreorderUpcoming,
        timeRemaining,
        themePreference,
        toggleThemePreference,
        recentlyViewed,
        addRecentlyViewed,
        products,
        collections,
        fanProjects,
        libraryItems,
        teamKaalItems: libraryItems,
        refreshData,
        syncWithGoogleSheets,
        currentCustomer,
        customerOrders,
        isCustomerLoggedIn: !!currentCustomer,
        loginCustomer,
        registerCustomer,
        verifyCustomerEmail,
        logoutCustomer,
        refreshCustomerOrders,
        currentAdmin,
        isAdminLoggedIn: !!currentAdmin,
        isSuperAdmin,
        loginAdmin,
        logoutAdmin,
        cart,
        cartCount,
        cartSubtotal,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        createOrder,
        submitPaymentProof,
        searchOrderByNumber,
        allOrders,
        orders: allOrders,
        allPayments,
        allCustomers,
        allAdmins,
        emailLogs,
        saveProduct,
        addNewProduct,
        updateProduct,
        deleteProduct,
        saveCollection,
        saveFanProject,
        saveLibraryItem,
        updateOrderStatus,
        updateSettings,
        sendManualEmail,
        addAdminUser,
        resetDatabaseDefaults,
        activeModal,
        modalData,
        openModal,
        closeModal,
        toasts,
        addToast,
        removeToast,
        activeView,
        setActiveView
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
