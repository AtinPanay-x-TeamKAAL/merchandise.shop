import { 
  Product, 
  Order, 
  Customer, 
  AdminUser, 
  PaymentRecord, 
  AppSettings, 
  CollectionItem, 
  FanProject, 
  TeamKAALLibraryItem, 
  EmailLog, 
  OrderStatus, 
  PaymentStatus,
  EmailTemplateType
} from '../types';
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

/**
 * ============================================================================
 * Single Source of Truth API Service for APMERCH_DATABASE (Google Sheets & Apps Script)
 * 
 * CRITICAL DATABASE MANDATES:
 * 1. Google Sheets / Apps Script is the primary database and single source of truth.
 * 2. No localStorage is used for storing orders, customers, payments, or admins.
 * 3. Customer portal and Admin dashboard read and write to the same Google Sheet.
 * 4. Sequential Order IDs and Confirmation IDs are generated server-side by inspecting
 *    the latest record in the Orders sheet (APMERCH-ORD-00001, APMERCH-CONF-00001).
 * 5. Concurrency locks prevent duplicate IDs during simultaneous checkouts.
 * ============================================================================
 */
class GoogleSheetsApiService {
  private settings: AppSettings = INITIAL_SETTINGS;
  private products: Product[] = INITIAL_PRODUCTS;
  private orders: Order[] = [];
  private customers: Customer[] = [];
  private admins: AdminUser[] = INITIAL_ADMINS;
  private payments: PaymentRecord[] = [];
  private collections: CollectionItem[] = INITIAL_COLLECTIONS;
  private fanProjects: FanProject[] = INITIAL_FAN_PROJECTS;
  private libraryItems: TeamKAALLibraryItem[] = INITIAL_LIBRARY_ITEMS;
  private emailLogs: EmailLog[] = [];

  constructor() {
    const storedGasUrl = typeof window !== 'undefined' ? localStorage.getItem('APMERCH_APPS_SCRIPT_URL') || '' : '';
    const envGasUrl = import.meta.env.VITE_APPS_SCRIPT_URL || '';
    this.settings.appsScriptUrl = this.normalizeUrl(this.settings.appsScriptUrl || storedGasUrl || envGasUrl);
    if (this.settings.appsScriptUrl) {
      this.syncWithSheet().catch(err => {
        console.warn('[APMERCH_DATABASE] Automatic startup sync error:', err);
      });
    }
  }

  public normalizeUrl(rawUrl: string): string {
    let url = (rawUrl || '').trim();
    if (!url) return '';
    url = url.replace(/^["']|["']$/g, '');
    if (url.includes('/macros/s/') && !url.includes('/exec')) {
      url = url.replace(/\/(edit|dev)(\?.*)?$/, '/exec');
    }
    return url;
  }

  public getAppsScriptUrl(): string {
    if (this.settings.appsScriptUrl) {
      return this.normalizeUrl(this.settings.appsScriptUrl);
    }
    const storedGasUrl = typeof window !== 'undefined' ? localStorage.getItem('APMERCH_APPS_SCRIPT_URL') || '' : '';
    if (storedGasUrl) {
      this.settings.appsScriptUrl = this.normalizeUrl(storedGasUrl);
      return this.settings.appsScriptUrl;
    }
    const envGasUrl = import.meta.env.VITE_APPS_SCRIPT_URL || '';
    if (envGasUrl) {
      this.settings.appsScriptUrl = this.normalizeUrl(envGasUrl);
      return this.settings.appsScriptUrl;
    }
    return '';
  }

  // --- Remote Apps Script API Client ---
  public async executeAppsScript(action: string, payload: any = {}): Promise<any> {
    const url = this.getAppsScriptUrl();
    if (!url) {
      console.warn(`[APMERCH_DATABASE] executeAppsScript: No Apps Script URL configured for action "${action}".`);
      return null;
    }

    const postPayload = {
      action,
      ...payload
    };

    // 1. Primary: POST request with text/plain to avoid preflight (CORS simple request)
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(postPayload),
        redirect: 'follow'
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.warn(`[APMERCH_DATABASE] POST non-JSON response for action "${action}":`, text);
      }

      if (data) {
        return data;
      }
    } catch (postError) {
      console.warn(`[APMERCH_DATABASE] POST failed on action "${action}", attempting GET fallback:`, postError);
    }

    // 2. Secondary fallback: GET request (simple request, bypasses any POST redirect/CORS issues)
    try {
      const getUrl = new URL(url);
      getUrl.searchParams.set('action', action);
      getUrl.searchParams.set('data', JSON.stringify(payload));
      if (payload.customer) {
        getUrl.searchParams.set('customer', typeof payload.customer === 'string' ? payload.customer : JSON.stringify(payload.customer));
      }
      if (payload.email) {
        getUrl.searchParams.set('email', payload.email);
      }

      const getRes = await fetch(getUrl.toString(), {
        method: 'GET',
        redirect: 'follow'
      });

      const getText = await getRes.text();
      try {
        const getData = JSON.parse(getText);
        if (getData) {
          return getData;
        }
      } catch (e) {
        console.warn(`[APMERCH_DATABASE] GET fallback non-JSON response for action "${action}":`, getText);
      }
    } catch (getError) {
      console.warn(`[APMERCH_DATABASE] Remote sync error on action "${action}":`, getError);
    }

    return null;
  }

  /**
   * Derive sequential order ID from Orders sheet records.
   * Format: APMERCH-ORD-00001, APMERCH-CONF-00001
   */
  public generateSequentialOrderIds(): { orderNumber: string; confirmationNumber: string; sequenceNumber: number } {
    let maxNumber = 0;
    // Scan all rows in the Orders sheet
    this.orders.forEach(order => {
      const match = String(order.orderNumber || '').match(/APMERCH-ORD-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });

    const nextNumber = maxNumber + 1;
    const formattedNumber = String(nextNumber).padStart(5, '0');
    return {
      orderNumber: `APMERCH-ORD-${formattedNumber}`,
      confirmationNumber: `APMERCH-CONF-${formattedNumber}`,
      sequenceNumber: nextNumber
    };
  }

  // --- Data Synchronization & Initial Data from APMERCH_DATABASE ---

  public async syncWithSheet(): Promise<{
    settings: AppSettings;
    products: Product[];
    orders: Order[];
    customers: Customer[];
    admins: AdminUser[];
    payments: PaymentRecord[];
    collections: CollectionItem[];
    fanProjects: FanProject[];
    libraryItems: TeamKAALLibraryItem[];
    emailLogs: EmailLog[];
  }> {
    const url = this.settings.appsScriptUrl || import.meta.env.VITE_APPS_SCRIPT_URL || '';
    if (url) {
      this.settings.appsScriptUrl = url;
      const res = await this.executeAppsScript('getInitialData');
      if (res && res.success) {
        if (res.settings && Object.keys(res.settings).length > 0) {
          this.settings = { ...this.settings, ...res.settings, appsScriptUrl: url };
        }
        if (Array.isArray(res.products) && res.products.length > 0) {
          this.products = res.products;
        }
        if (Array.isArray(res.orders)) {
          this.orders = res.orders;
        }
        if (Array.isArray(res.customers)) {
          this.customers = res.customers;
        }
        if (Array.isArray(res.admins) && res.admins.length > 0) {
          this.admins = res.admins;
        }
        if (Array.isArray(res.payments)) {
          this.payments = res.payments;
        }
        if (Array.isArray(res.collections) && res.collections.length > 0) {
          this.collections = res.collections;
        }
        if (Array.isArray(res.fanProjects) && res.fanProjects.length > 0) {
          this.fanProjects = res.fanProjects;
        }
        if (Array.isArray(res.libraryItems) && res.libraryItems.length > 0) {
          this.libraryItems = res.libraryItems;
        }
        if (Array.isArray(res.emailLogs)) {
          this.emailLogs = res.emailLogs;
        }
      }
    }

    return {
      settings: this.settings,
      products: this.products,
      orders: this.orders,
      customers: this.customers,
      admins: this.admins,
      payments: this.payments,
      collections: this.collections,
      fanProjects: this.fanProjects,
      libraryItems: this.libraryItems,
      emailLogs: this.emailLogs
    };
  }

  // --- Settings ---

  public async getSettings(): Promise<AppSettings> {
    return this.settings;
  }

  public async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
    if (newSettings.appsScriptUrl !== undefined) {
      const normalized = this.normalizeUrl(newSettings.appsScriptUrl);
      newSettings.appsScriptUrl = normalized;
      if (typeof window !== 'undefined' && normalized) {
        localStorage.setItem('APMERCH_APPS_SCRIPT_URL', normalized);
      }
    }
    this.settings = { ...this.settings, ...newSettings };
    await this.executeAppsScript('adminUpdateSettings', { settings: this.settings });
    return this.settings;
  }

  // --- Products ---

  public async getProducts(): Promise<Product[]> {
    return this.products;
  }

  public async saveProduct(product: Product): Promise<Product> {
    const existingIndex = this.products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      this.products[existingIndex] = product;
    } else {
      this.products.unshift(product);
    }
    await this.executeAppsScript('adminSaveProduct', { product });
    return product;
  }

  public async deleteProduct(productId: string): Promise<boolean> {
    this.products = this.products.filter(p => p.id !== productId);
    await this.executeAppsScript('adminDeleteProduct', { productId });
    return true;
  }

  // --- Collections ---

  public async getCollections(): Promise<CollectionItem[]> {
    return this.collections;
  }

  public async saveCollection(collection: CollectionItem): Promise<CollectionItem> {
    const idx = this.collections.findIndex(c => c.id === collection.id);
    if (idx >= 0) {
      this.collections[idx] = collection;
    } else {
      this.collections.unshift(collection);
    }
    await this.executeAppsScript('adminSaveCollection', { collection });
    return collection;
  }

  // --- Fan Projects ---

  public async getFanProjects(): Promise<FanProject[]> {
    return this.fanProjects;
  }

  public async saveFanProject(project: FanProject): Promise<FanProject> {
    const idx = this.fanProjects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      this.fanProjects[idx] = project;
    } else {
      this.fanProjects.unshift(project);
    }
    await this.executeAppsScript('adminSaveFanProject', { project });
    return project;
  }

  // --- Team KAAL Library ---

  public async getLibraryItems(): Promise<TeamKAALLibraryItem[]> {
    return this.libraryItems;
  }

  public async saveLibraryItem(item: TeamKAALLibraryItem): Promise<TeamKAALLibraryItem> {
    const idx = this.libraryItems.findIndex(l => l.id === item.id);
    if (idx >= 0) {
      this.libraryItems[idx] = item;
    } else {
      this.libraryItems.unshift(item);
    }
    await this.executeAppsScript('adminSaveLibraryItem', { item });
    return item;
  }

  // --- Customers ---

  public async registerCustomer(customerData: Omit<Customer, 'id' | 'createdAt'> & { password?: string }): Promise<{ customer: Customer; code: string }> {
    const url = this.getAppsScriptUrl();
    if (!url) {
      throw new Error('Google Sheets Apps Script URL is not configured (VITE_APPS_SCRIPT_URL). Customer accounts cannot be stored only in memory.');
    }

    const emailClean = customerData.email.trim().toLowerCase();
    const existing = this.customers.find(c => c.email.trim().toLowerCase() === emailClean);
    if (existing) {
      throw new Error('An account with this email address already exists in APMERCH_DATABASE. Please log in.');
    }

    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const now = new Date().toISOString();
    const newCustomer: Customer & { password?: string } = {
      ...customerData,
      id: `CUST-${Date.now().toString(36).toUpperCase()}`,
      isVerified: false,
      verificationCode,
      createdAt: now,
      lastLoginAt: now
    };

    const res = await this.executeAppsScript('registerCustomer', {
      customer: newCustomer,
      ...newCustomer
    });

    console.log('REGISTER RESPONSE:', res);

    if (!res || !res.success) {
      const errMsg = res?.error || res?.message || 'Failed to register customer in Google Sheets. Please verify your Apps Script connection.';
      throw new Error(errMsg);
    }

    const savedCustomer: Customer = res.customer || {
      id: newCustomer.id,
      fullName: newCustomer.fullName,
      email: newCustomer.email,
      mobileNumber: newCustomer.mobileNumber,
      facebookName: newCustomer.facebookName,
      isVerified: false,
      verificationCode: res.code || verificationCode,
      createdAt: newCustomer.createdAt,
      lastLoginAt: newCustomer.lastLoginAt
    };

    const idx = this.customers.findIndex(c => c.email.trim().toLowerCase() === emailClean);
    if (idx >= 0) {
      this.customers[idx] = savedCustomer;
    } else {
      this.customers.push(savedCustomer);
    }

    const finalCode = res.code || verificationCode;

    // Send and log verification email
    this.logEmail({
      toEmail: savedCustomer.email,
      recipientName: savedCustomer.fullName,
      subject: `Account Verification Code: ${finalCode} - A'TIN Panay Merch Portal`,
      templateType: 'Registration Verification',
      status: 'Sent',
      previewBody: `Your 6-digit verification code is ${finalCode}. Enter this code in the portal to verify your account.`
    });

    return { customer: savedCustomer, code: finalCode };
  }

  public async verifyCustomerEmail(email: string, code: string): Promise<Customer> {
    const emailClean = email.trim().toLowerCase();
    const url = this.getAppsScriptUrl();
    if (!url) {
      throw new Error('Google Sheets Apps Script URL is not configured (VITE_APPS_SCRIPT_URL).');
    }

    const res = await this.executeAppsScript('verifyCustomer', { email: emailClean, code });
    if (!res || !res.success) {
      throw new Error(res?.error || res?.message || 'Invalid verification code or verification failed in Google Sheets.');
    }

    let cust = this.customers.find(c => c.email.trim().toLowerCase() === emailClean);
    if (cust) {
      cust.isVerified = true;
      cust.lastLoginAt = new Date().toISOString();
    } else if (res.customer) {
      cust = res.customer;
      this.customers.push(cust);
    } else {
      cust = {
        id: `CUST-${Date.now().toString(36).toUpperCase()}`,
        fullName: 'Customer',
        email: emailClean,
        mobileNumber: '',
        isVerified: true,
        verificationCode: code,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      this.customers.push(cust);
    }

    return cust;
  }

  public async loginCustomer(email: string): Promise<Customer> {
    const emailClean = email.trim().toLowerCase();
    const url = this.getAppsScriptUrl();
    if (!url) {
      throw new Error('Google Sheets Apps Script URL is not configured (VITE_APPS_SCRIPT_URL). Customer login requires a connected Google Sheet.');
    }

    const res = await this.executeAppsScript('loginCustomer', { email: emailClean });
    if (!res || !res.success || !res.customer) {
      throw new Error(res?.error || res?.message || 'No customer account found with this email in Google Sheets. Please register.');
    }

    const existingIdx = this.customers.findIndex(c => c.email.trim().toLowerCase() === emailClean);
    if (existingIdx >= 0) {
      this.customers[existingIdx] = res.customer;
    } else {
      this.customers.push(res.customer);
    }
    return res.customer;
  }

  public async getCustomers(): Promise<Customer[]> {
    return this.customers;
  }

  // --- Orders & Server-Side Atomic Sequential ID Generation ---

  public async createOrder(orderInput: Omit<Order, 'id' | 'orderNumber' | 'confirmationNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const url = this.getAppsScriptUrl();
    if (!url) {
      throw new Error('Google Sheets Apps Script URL is not configured (VITE_APPS_SCRIPT_URL). Orders cannot be stored only in memory.');
    }

    // Server-side atomic creation in Google Sheets under LockService
    const remoteRes = await this.executeAppsScript('createOrder', { orderData: orderInput });
    if (!remoteRes || !remoteRes.success || !remoteRes.order) {
      throw new Error(remoteRes?.error || remoteRes?.message || 'Failed to submit order to Google Sheets. Orders cannot be stored only in memory.');
    }

    const createdOrder: Order = remoteRes.order;
    const now = new Date().toISOString();

    // Cache confirmed Google Sheets order
    const existingIndex = this.orders.findIndex(o => o.orderNumber === createdOrder.orderNumber);
    if (existingIndex >= 0) {
      this.orders[existingIndex] = createdOrder;
    } else {
      this.orders.unshift(createdOrder);
    }

    if (createdOrder.paymentProofUrl || createdOrder.paymentReferenceNumber) {
      const newPayment: PaymentRecord = {
        id: `PAY-${Date.now().toString(36).toUpperCase()}`,
        orderNumber: createdOrder.orderNumber,
        confirmationNumber: createdOrder.confirmationNumber,
        customerEmail: createdOrder.customerEmail,
        customerName: createdOrder.customerName,
        amount: createdOrder.totalAmount,
        method: createdOrder.paymentMethod,
        senderName: createdOrder.paymentSenderName || createdOrder.customerName,
        senderNumber: createdOrder.paymentSenderNumber || createdOrder.customerMobile,
        referenceNumber: createdOrder.paymentReferenceNumber || 'Pending Ref',
        proofUrl: createdOrder.paymentProofUrl || '',
        status: createdOrder.paymentStatus,
        createdAt: now,
        notes: 'Submitted during checkout'
      };
      this.payments.unshift(newPayment);
    }

    // Log order email
    this.logEmail({
      toEmail: createdOrder.customerEmail,
      recipientName: createdOrder.customerName,
      subject: `Order Submitted - A'TIN Panay BlockScreening [${createdOrder.orderNumber}]`,
      templateType: 'Order Submitted',
      orderNumber: createdOrder.orderNumber,
      status: 'Sent',
      previewBody: `Thank you for your order ${createdOrder.orderNumber} (Conf: ${createdOrder.confirmationNumber}). Total: ₱${createdOrder.totalAmount.toLocaleString()}. Pickup is scheduled for October 11, 2026.`
    });

    return createdOrder;
  }

  public async submitPaymentProof(
    orderNumber: string, 
    proofUrl: string, 
    referenceNumber: string, 
    senderName: string, 
    senderNumber: string
  ): Promise<Order> {
    const url = this.getAppsScriptUrl();
    if (!url) {
      throw new Error('Google Sheets Apps Script URL is not configured (VITE_APPS_SCRIPT_URL). Payment proof cannot be stored only in memory.');
    }

    const clean = orderNumber.trim().toUpperCase();
    const order = this.orders.find(o => 
      o.orderNumber.toUpperCase() === clean || 
      o.confirmationNumber.toUpperCase() === clean
    );
    if (!order) {
      throw new Error(`Order ${orderNumber} not found in APMERCH_DATABASE.`);
    }

    const res = await this.executeAppsScript('submitPaymentProof', { 
      paymentData: { 
        orderNumber: order.orderNumber, 
        proofUrl, 
        referenceNumber, 
        senderName, 
        senderNumber 
      } 
    });

    if (!res || !res.success) {
      throw new Error(res?.error || res?.message || 'Failed to submit payment proof to Google Sheets.');
    }

    const now = new Date().toISOString();
    order.paymentProofUrl = proofUrl;
    order.paymentReferenceNumber = referenceNumber;
    order.paymentSenderName = senderName;
    order.paymentSenderNumber = senderNumber;
    order.paymentStatus = 'Under Verification';
    order.status = 'Under Verification';
    order.updatedAt = now;

    // Cache updated payment record
    let payRecord = this.payments.find(p => p.orderNumber.toUpperCase() === order.orderNumber.toUpperCase());
    if (payRecord) {
      payRecord.proofUrl = proofUrl;
      payRecord.referenceNumber = referenceNumber;
      payRecord.senderName = senderName;
      payRecord.senderNumber = senderNumber;
      payRecord.status = 'Under Verification';
      payRecord.createdAt = now;
    } else {
      this.payments.unshift({
        id: `PAY-${Date.now().toString(36).toUpperCase()}`,
        orderNumber: order.orderNumber,
        confirmationNumber: order.confirmationNumber,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        amount: order.totalAmount,
        method: order.paymentMethod,
        senderName,
        senderNumber,
        referenceNumber,
        proofUrl,
        status: 'Under Verification',
        createdAt: now,
        notes: 'Proof uploaded via customer portal'
      });
    }

    return order;
  }

  public async getCustomerOrders(email: string): Promise<Order[]> {
    const emailClean = email.trim().toLowerCase();
    
    // If connected to live sheet, query customer orders
    if (this.settings.appsScriptUrl) {
      const res = await this.executeAppsScript('getCustomerOrders', { email: emailClean });
      if (res && res.success && Array.isArray(res.orders)) {
        return res.orders;
      }
    }

    return this.orders.filter(o => o.customerEmail.trim().toLowerCase() === emailClean);
  }

  public async getOrderByIdOrConfirmation(query: string): Promise<Order | null> {
    const clean = query.trim().toUpperCase();
    return this.orders.find(o => 
      o.orderNumber.toUpperCase() === clean || 
      o.confirmationNumber.toUpperCase() === clean
    ) || null;
  }

  public async getAllOrders(): Promise<Order[]> {
    return this.orders;
  }

  public async getAllPayments(): Promise<PaymentRecord[]> {
    return this.payments;
  }

  // --- Admins ---

  public async getAllAdmins(): Promise<AdminUser[]> {
    return this.admins;
  }

  public async addAdminUser(admin: Omit<AdminUser, 'id' | 'createdAt'>): Promise<AdminUser> {
    const url = this.getAppsScriptUrl();
    if (!url) {
      throw new Error('Google Sheets Apps Script URL is not configured.');
    }

    const newAdmin: AdminUser = {
      ...admin,
      id: `ADM-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString()
    };

    const res = await this.executeAppsScript('adminAddAdminUser', { admin: newAdmin });
    if (!res || !res.success) {
      throw new Error(res?.error || res?.message || 'Failed to save admin user to Google Sheets.');
    }

    this.admins.push(newAdmin);
    return newAdmin;
  }

  public async updateOrderStatus(
    orderNumber: string,
    newStatus: OrderStatus,
    newPaymentStatus: PaymentStatus,
    verifiedBy: string,
    notes?: string,
    sendEmailNotification: boolean = true
  ): Promise<Order> {
    const url = this.getAppsScriptUrl();
    if (!url) {
      throw new Error('Google Sheets Apps Script URL is not configured (VITE_APPS_SCRIPT_URL). Order status cannot be updated without a connected Google Sheet.');
    }

    const clean = orderNumber.trim().toUpperCase();
    const order = this.orders.find(o => o.orderNumber.toUpperCase() === clean);
    if (!order) {
      throw new Error(`Order ${orderNumber} not found in APMERCH_DATABASE.`);
    }

    const res = await this.executeAppsScript('adminUpdateOrderStatus', {
      orderNumber,
      status: newStatus,
      paymentStatus: newPaymentStatus,
      verifiedBy,
      notes,
      sendEmail: sendEmailNotification
    });

    if (!res || !res.success) {
      throw new Error(res?.error || res?.message || 'Failed to update order status in Google Sheets.');
    }

    const now = new Date().toISOString();
    order.status = newStatus;
    order.paymentStatus = newPaymentStatus;
    order.verifiedBy = verifiedBy;
    order.verifiedAt = now;
    order.updatedAt = now;
    if (notes) order.notes = notes;

    // Update payment record in Payments tab
    const payRecord = this.payments.find(p => p.orderNumber.toUpperCase() === clean);
    if (payRecord) {
      payRecord.status = newPaymentStatus;
      payRecord.verifiedBy = verifiedBy;
      payRecord.verifiedAt = now;
      if (notes) payRecord.notes = notes;
    }

    // Trigger dynamic email template
    if (sendEmailNotification) {
      let templateType: EmailTemplateType = 'Order Submitted';
      let subject = `Order Update [${order.orderNumber}] - A'TIN Panay BlockScreening`;

      if (newStatus === 'Paid' || newPaymentStatus === 'Paid') {
        templateType = 'Payment Approved';
        subject = `Payment Approved - A'TIN Panay BlockScreening [${order.orderNumber}]`;
      } else if (newStatus === 'Ready For Pickup') {
        templateType = 'Ready For Pickup';
        subject = `Ready For Pickup! - A'TIN Panay BlockScreening [${order.orderNumber}]`;
      } else if (newStatus === 'Cancelled') {
        templateType = 'Order Cancelled';
        subject = `Order Cancelled - A'TIN Panay BlockScreening [${order.orderNumber}]`;
      }

      this.logEmail({
        toEmail: order.customerEmail,
        recipientName: order.customerName,
        subject,
        templateType,
        orderNumber: order.orderNumber,
        status: 'Sent',
        previewBody: `Status for order ${order.orderNumber} is now: ${newStatus}. Verified by: ${verifiedBy}.`
      });
    }

    return order;
  }

  // --- Email Logs in APMERCH_DATABASE ---

  public async getEmailLogs(): Promise<EmailLog[]> {
    return this.emailLogs;
  }

  public logEmail(logData: Omit<EmailLog, 'id' | 'sentAt'>): EmailLog {
    const newLog: EmailLog = {
      ...logData,
      id: `EML-${Date.now().toString(36).toUpperCase()}`,
      sentAt: new Date().toISOString()
    };
    this.emailLogs.unshift(newLog);
    return newLog;
  }

  public async sendManualEmail(
    toEmail: string,
    recipientName: string,
    subject: string,
    templateType: EmailTemplateType,
    orderNumber?: string,
    customMessage?: string
  ): Promise<EmailLog> {
    const log = this.logEmail({
      toEmail,
      recipientName,
      subject,
      templateType,
      orderNumber,
      status: 'Sent',
      previewBody: customMessage || `Manual email notification sent for ${templateType}.`
    });

    await this.executeAppsScript('adminSendEmail', {
      toEmail,
      recipientName,
      subject,
      templateType,
      orderNumber,
      customBody: customMessage
    });

    return log;
  }

  public resetToFactoryDefaults() {
    this.settings = {
      ...INITIAL_SETTINGS,
      appsScriptUrl: import.meta.env.VITE_APPS_SCRIPT_URL || ''
    };
    this.products = INITIAL_PRODUCTS;
    this.orders = [];
    this.customers = [];
    this.admins = INITIAL_ADMINS;
    this.payments = [];
    this.collections = INITIAL_COLLECTIONS;
    this.fanProjects = INITIAL_FAN_PROJECTS;
    this.libraryItems = INITIAL_LIBRARY_ITEMS;
    this.emailLogs = [];

    if (this.settings.appsScriptUrl) {
      this.syncWithSheet().catch(err => console.warn('[APMERCH_DATABASE] Reset sync error:', err));
    }
  }
}

export const googleSheetsApi = new GoogleSheetsApiService();
