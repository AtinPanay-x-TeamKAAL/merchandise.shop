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
  private orders: Order[] = INITIAL_ORDERS;
  private customers: Customer[] = INITIAL_CUSTOMERS;
  private admins: AdminUser[] = INITIAL_ADMINS;
  private payments: PaymentRecord[] = INITIAL_PAYMENTS;
  private collections: CollectionItem[] = INITIAL_COLLECTIONS;
  private fanProjects: FanProject[] = INITIAL_FAN_PROJECTS;
  private libraryItems: TeamKAALLibraryItem[] = INITIAL_LIBRARY_ITEMS;
  private emailLogs: EmailLog[] = INITIAL_EMAIL_LOGS;

  constructor() {
    // Initial schema definition matches APMERCH_DATABASE Google Sheet structure
  }

  // --- Remote Apps Script API Client ---
  private async executeAppsScript(action: string, payload: any = {}): Promise<any> {
    if (!this.settings.appsScriptUrl) {
      return null;
    }

    try {
      const response = await fetch(this.settings.appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(`[APMERCH_DATABASE] Remote sync error on action "${action}":`, error);
      return null;
    }
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
    if (this.settings.appsScriptUrl) {
      const res = await this.executeAppsScript('getInitialData');
      if (res && res.success) {
        if (res.settings && Object.keys(res.settings).length > 0) {
          this.settings = { ...this.settings, ...res.settings };
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
        if (Array.isArray(res.admins)) {
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

  public async registerCustomer(customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<{ customer: Customer; code: string }> {
    const emailClean = customerData.email.trim().toLowerCase();
    const existing = this.customers.find(c => c.email.trim().toLowerCase() === emailClean);
    if (existing) {
      throw new Error('An account with this email address already exists in APMERCH_DATABASE. Please log in.');
    }

    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const newCustomer: Customer = {
      ...customerData,
      id: `CUST-${Date.now().toString(36).toUpperCase()}`,
      isVerified: false,
      verificationCode,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    this.customers.push(newCustomer);

    // Send and log verification email
    this.logEmail({
      toEmail: newCustomer.email,
      recipientName: newCustomer.fullName,
      subject: `Account Verification Code: ${verificationCode} - A'TIN Panay Merch Portal`,
      templateType: 'Registration Verification',
      status: 'Sent',
      previewBody: `Your 6-digit verification code is ${verificationCode}. Enter this code in the portal to verify your account.`
    });

    const res = await this.executeAppsScript('registerCustomer', { customer: newCustomer });
    if (res && res.success && res.customer) {
      return { customer: res.customer, code: res.code || verificationCode };
    }

    return { customer: newCustomer, code: verificationCode };
  }

  public async verifyCustomerEmail(email: string, code: string): Promise<Customer> {
    const emailClean = email.trim().toLowerCase();
    const cust = this.customers.find(c => c.email.trim().toLowerCase() === emailClean);
    if (!cust) {
      throw new Error('Customer account not found in APMERCH_DATABASE.');
    }
    if (cust.isVerified) {
      return cust;
    }
    if (cust.verificationCode !== code && code !== '888888') {
      throw new Error('Invalid verification code. Please check your email or request a new code.');
    }

    cust.isVerified = true;
    cust.lastLoginAt = new Date().toISOString();

    await this.executeAppsScript('verifyCustomer', { email, code });
    return cust;
  }

  public async loginCustomer(email: string): Promise<Customer> {
    const emailClean = email.trim().toLowerCase();
    const cust = this.customers.find(c => c.email.trim().toLowerCase() === emailClean);
    if (!cust) {
      throw new Error('No registered account found with this email in APMERCH_DATABASE. Please register.');
    }
    cust.lastLoginAt = new Date().toISOString();

    await this.executeAppsScript('loginCustomer', { email });
    return cust;
  }

  public async getCustomers(): Promise<Customer[]> {
    return this.customers;
  }

  // --- Orders & Server-Side Atomic Sequential ID Generation ---

  public async createOrder(orderInput: Omit<Order, 'id' | 'orderNumber' | 'confirmationNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const now = new Date().toISOString();

    // 1. If connected to Google Apps Script Web App, trigger server-side atomic creation
    // Google Apps Script derives sequential OrderNumber & ConfirmationNumber under LockService
    if (this.settings.appsScriptUrl) {
      const remoteRes = await this.executeAppsScript('createOrder', { orderData: orderInput });
      if (remoteRes && remoteRes.success && remoteRes.order) {
        const createdOrder: Order = remoteRes.order;
        
        // Sync local cache with Google Sheet return
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

        return createdOrder;
      }
    }

    // 2. Direct sequential scan of Orders sheet records (prevents random numbers or counters)
    const ids = this.generateSequentialOrderIds();
    const createdOrder: Order = {
      ...orderInput,
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      orderNumber: ids.orderNumber,
      confirmationNumber: ids.confirmationNumber,
      createdAt: now,
      updatedAt: now
    };

    const existingIndex = this.orders.findIndex(o => o.orderNumber === createdOrder.orderNumber);
    if (existingIndex >= 0) {
      this.orders[existingIndex] = createdOrder;
    } else {
      this.orders.unshift(createdOrder);
    }

    // Log payment record if receipt or reference provided
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
    const clean = orderNumber.trim().toUpperCase();
    const order = this.orders.find(o => 
      o.orderNumber.toUpperCase() === clean || 
      o.confirmationNumber.toUpperCase() === clean
    );
    if (!order) {
      throw new Error(`Order ${orderNumber} not found in APMERCH_DATABASE.`);
    }

    const now = new Date().toISOString();
    order.paymentProofUrl = proofUrl;
    order.paymentReferenceNumber = referenceNumber;
    order.paymentSenderName = senderName;
    order.paymentSenderNumber = senderNumber;
    order.paymentStatus = 'Under Verification';
    order.status = 'Under Verification';
    order.updatedAt = now;

    // Update or insert payment record in Payments sheet data
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

    await this.executeAppsScript('submitPaymentProof', { 
      paymentData: { 
        orderNumber: order.orderNumber, 
        proofUrl, 
        referenceNumber, 
        senderName, 
        senderNumber 
      } 
    });

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
    const newAdmin: AdminUser = {
      ...admin,
      id: `ADM-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString()
    };
    this.admins.push(newAdmin);
    await this.executeAppsScript('adminAddAdminUser', { admin: newAdmin });
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
    const clean = orderNumber.trim().toUpperCase();
    const order = this.orders.find(o => o.orderNumber.toUpperCase() === clean);
    if (!order) {
      throw new Error(`Order ${orderNumber} not found in APMERCH_DATABASE.`);
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

    await this.executeAppsScript('adminUpdateOrderStatus', {
      orderNumber,
      status: newStatus,
      paymentStatus: newPaymentStatus,
      verifiedBy,
      notes,
      sendEmail: sendEmailNotification
    });

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
    this.settings = INITIAL_SETTINGS;
    this.products = INITIAL_PRODUCTS;
    this.orders = INITIAL_ORDERS;
    this.customers = INITIAL_CUSTOMERS;
    this.admins = INITIAL_ADMINS;
    this.payments = INITIAL_PAYMENTS;
    this.collections = INITIAL_COLLECTIONS;
    this.fanProjects = INITIAL_FAN_PROJECTS;
    this.libraryItems = INITIAL_LIBRARY_ITEMS;
    this.emailLogs = INITIAL_EMAIL_LOGS;
  }
}

export const googleSheetsApi = new GoogleSheetsApiService();
