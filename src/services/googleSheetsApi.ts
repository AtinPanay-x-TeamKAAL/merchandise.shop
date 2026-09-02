import { 
  Product, 
  Order, 
  Customer, 
  AdminUser, 
  PaymentRecord, 
  AppSettings, 
  PaymentMethodConfig,
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
  INITIAL_PAYMENT_METHODS,
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
const STORAGE_KEYS = {
  LOCKED_PRODUCTS: 'APMERCH_LOCKED_PRODUCTS',
  LOCKED_COLLECTIONS: 'APMERCH_LOCKED_COLLECTIONS',
  LOCKED_FAN_PROJECTS: 'APMERCH_LOCKED_FAN_PROJECTS',
  LOCKED_LIBRARY_ITEMS: 'APMERCH_LOCKED_LIBRARY_ITEMS',
  LOCKED_SETTINGS: 'APMERCH_LOCKED_SETTINGS'
};

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
  private isUploadImageSupported: boolean | null = null;
  private activeSyncPromise: Promise<any> | null = null;

  /**
   * Sanitizes settings to ensure nested objects like paymentMethods are always valid arrays,
   * even if serialized as a JSON string by Google Sheets or localStorage.
   */
  private sanitizeSettings(rawSettings: any): AppSettings {
    if (!rawSettings || typeof rawSettings !== 'object') {
      return { ...INITIAL_SETTINGS };
    }

    let paymentMethods = rawSettings.paymentMethods;
    if (typeof paymentMethods === 'string') {
      try {
        paymentMethods = JSON.parse(paymentMethods);
      } catch {
        paymentMethods = null;
      }
    }

    if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
      paymentMethods = INITIAL_PAYMENT_METHODS;
    }

    const safePaymentMethods: PaymentMethodConfig[] = paymentMethods
      .filter((pm: any) => pm && typeof pm === 'object')
      .map((pm: any, idx: number) => ({
        id: String(pm.id || `pm-${idx + 1}`),
        name: String(pm.name || 'Payment Option'),
        accountName: String(pm.accountName || rawSettings.gcashAccountName || 'Mae Joey Balla'),
        accountNumber: String(pm.accountNumber || rawSettings.gcashNumber || '09203963249'),
        qrCodeUrl: pm.qrCodeUrl || '',
        instructions: pm.instructions || '',
        active: pm.active !== false,
        sortOrder: typeof pm.sortOrder === 'number' ? pm.sortOrder : idx + 1,
        badge: pm.badge || undefined
      }));

    return {
      ...INITIAL_SETTINGS,
      ...rawSettings,
      paymentMethods: safePaymentMethods.length > 0 ? safePaymentMethods : INITIAL_PAYMENT_METHODS
    };
  }

  constructor() {
    // Load locked persistent state so user uploads and edits NEVER revert on restart
    try {
      if (typeof window !== 'undefined') {
        const storedProducts = localStorage.getItem(STORAGE_KEYS.LOCKED_PRODUCTS);
        if (storedProducts) {
          const parsed = JSON.parse(storedProducts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.products = parsed;
          }
        }
        const storedCollections = localStorage.getItem(STORAGE_KEYS.LOCKED_COLLECTIONS);
        if (storedCollections) {
          const parsed = JSON.parse(storedCollections);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.collections = parsed;
          }
        }
        const storedFanProjects = localStorage.getItem(STORAGE_KEYS.LOCKED_FAN_PROJECTS);
        if (storedFanProjects) {
          const parsed = JSON.parse(storedFanProjects);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.fanProjects = parsed;
          }
        }
        const storedLibraryItems = localStorage.getItem(STORAGE_KEYS.LOCKED_LIBRARY_ITEMS);
        if (storedLibraryItems) {
          const parsed = JSON.parse(storedLibraryItems);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.libraryItems = parsed;
          }
        }
        const storedSettings = localStorage.getItem(STORAGE_KEYS.LOCKED_SETTINGS);
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          if (parsed && typeof parsed === 'object') {
            this.settings = this.sanitizeSettings({ ...this.settings, ...parsed });
          }
        }
      }
    } catch (e) {
      console.warn('[APMERCH_DATABASE] Error loading locked persistence cache:', e);
    }

    const storedGasUrl = typeof window !== 'undefined' ? localStorage.getItem('APMERCH_APPS_SCRIPT_URL') || '' : '';
    const envGasUrl = import.meta.env.VITE_APPS_SCRIPT_URL || '';
    this.settings.appsScriptUrl = this.normalizeUrl(this.settings.appsScriptUrl || storedGasUrl || envGasUrl);
  }

  public persistLockedData(key: string, data: any): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`[APMERCH_DATABASE] Persistent lock cache write warning (${key}):`, e);
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
    const envGasUrl = (import.meta.env.VITE_APPS_SCRIPT_URL || '').trim();
    if (envGasUrl) {
      this.settings.appsScriptUrl = this.normalizeUrl(envGasUrl);
      return this.settings.appsScriptUrl;
    }
    if (this.settings.appsScriptUrl) {
      return this.normalizeUrl(this.settings.appsScriptUrl);
    }
    const storedGasUrl = typeof window !== 'undefined' ? (localStorage.getItem('APMERCH_APPS_SCRIPT_URL') || '').trim() : '';
    if (storedGasUrl) {
      this.settings.appsScriptUrl = this.normalizeUrl(storedGasUrl);
      return this.settings.appsScriptUrl;
    }
    return '';
  }

  // --- Remote Apps Script API Client ---
  /**
   * Executes a remote call to Google Apps Script.
   * Sends a POST request with Content-Type text/plain to avoid preflight (CORS simple request).
   * Provides detailed error logging (HTTP status, response body, Apps Script error, fetch error).
   * Throws an explicit error on failure — NEVER returns null silently.
   */
  public async executeAppsScript(
    action: string, 
    payload: any = {}, 
    options?: { silentError?: boolean },
    retryCount: number = 0
  ): Promise<any> {
    const url = this.getAppsScriptUrl();
    if (!url) {
      const errMessage = `[APMERCH_DATABASE] executeAppsScript error: Google Apps Script Web App URL is not configured. Please set import.meta.env.VITE_APPS_SCRIPT_URL or configure the Apps Script URL in Settings.`;
      if (options?.silentError || action === 'uploadImage') {
        console.warn(errMessage);
      } else {
        console.error(errMessage, { action, payload });
      }
      throw new Error(errMessage);
    }

    const READ_ACTIONS = [
      'getInitialData',
      'ping',
      'verifyCustomer',
      'loginCustomer',
      'getCustomerOrders',
      'getLatestOrderIds',
      'trackOrder',
      'checkPendingOrder'
    ];
    const isReadAction = READ_ACTIONS.includes(action);

    const postPayload = {
      action,
      ...payload
    };
    const bodyString = JSON.stringify(postPayload);

    const buildGetUrl = () => {
      const separator = url.includes('?') ? '&' : '?';
      let reqUrl = `${url}${separator}action=${encodeURIComponent(action)}`;
      if (payload && Object.keys(payload).length > 0) {
        reqUrl += `&data=${encodeURIComponent(JSON.stringify(payload))}`;
      }
      return reqUrl;
    };

    let response: Response | null = null;
    let lastFetchErr: any = null;

    // Strategy 1: For read-only actions, prefer GET to prevent 302 POST redirect CORS issues in browsers
    if (isReadAction) {
      const getUrl = buildGetUrl();
      console.log(`[APMERCH_DATABASE] executeAppsScript: Sending GET request for action="${action}" to ${getUrl}`);
      try {
        response = await fetch(getUrl, {
          method: 'GET',
          redirect: 'follow'
        });
      } catch (getErr: any) {
        lastFetchErr = getErr;
        console.warn(`[APMERCH_DATABASE] GET attempt failed for action="${action}". Attempting POST fallback...`);
      }
    }

    // Strategy 2: If not read action, or if GET attempt failed, send standard POST request
    if (!response) {
      console.log(`[APMERCH_DATABASE] executeAppsScript: Sending POST request for action="${action}" to ${url}`, {
        action,
        payloadPreview: bodyString && bodyString.length > 300 ? bodyString.substring(0, 300) + '...' : (bodyString || '')
      });

      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: bodyString,
          redirect: 'follow'
        });
      } catch (postErr: any) {
        lastFetchErr = postErr;

        // If POST failed with network error and payload is small, attempt GET as last resort
        if (!isReadAction && bodyString.length < 1500) {
          try {
            console.warn(`[APMERCH_DATABASE] POST failed for action="${action}". Attempting GET fallback...`);
            const fallbackGetUrl = buildGetUrl();
            response = await fetch(fallbackGetUrl, {
              method: 'GET',
              redirect: 'follow'
            });
          } catch (fallbackErr: any) {
            lastFetchErr = fallbackErr;
          }
        }
      }
    }

    // If both failed and we can retry, wait and retry once
    if (!response) {
      if (retryCount < 1) {
        console.warn(`[APMERCH_DATABASE] Network request failed for action="${action}". Retrying in 1s (attempt ${retryCount + 1}/1)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.executeAppsScript(action, payload, options, retryCount + 1);
      }

      const fetchErrMsg = `[APMERCH_DATABASE] Fetch error for action="${action}": ${lastFetchErr?.message || lastFetchErr || 'Network error'}`;
      if (options?.silentError || action === 'uploadImage' || isReadAction) {
        console.warn(fetchErrMsg);
      } else {
        console.error(fetchErrMsg, {
          action,
          url,
          error: lastFetchErr
        });
      }
      throw new Error(
        `Failed to reach Google Apps Script (${action}): ${lastFetchErr?.message || 'Network/CORS error'}. ` +
        `Please verify that your Google Apps Script Web App is deployed with "Who has access: Anyone" and "Execute as: Me".`
      );
    }

    const httpStatus = response.status;
    const httpStatusText = response.statusText;
    let responseBody = '';

    try {
      responseBody = await response.text();
    } catch (readErr: any) {
      const readErrMsg = `[APMERCH_DATABASE] Failed to read response stream for action="${action}" (HTTP ${httpStatus}): ${readErr?.message || readErr}`;
      if (options?.silentError || action === 'uploadImage') {
        console.warn(readErrMsg);
      } else {
        console.error(readErrMsg, readErr);
      }
      throw new Error(readErrMsg);
    }

    const safeResBody = typeof responseBody === 'string' ? responseBody : '';

    console.log(`[APMERCH_DATABASE] executeAppsScript response for action="${action}":`, {
      httpStatus,
      httpStatusText,
      responseBodyLength: safeResBody.length,
      responseBodyPreview: safeResBody.length > 500 ? safeResBody.substring(0, 500) + '...' : safeResBody
    });

    if (!response.ok) {
      const httpErrMsg = `[APMERCH_DATABASE] Google Apps Script returned HTTP error ${httpStatus} (${httpStatusText}) for action="${action}": ${safeResBody}`;
      if (options?.silentError || action === 'uploadImage') {
        console.warn(httpErrMsg);
      } else {
        console.error(httpErrMsg);
      }
      throw new Error(`Google Apps Script HTTP Error ${httpStatus} (${httpStatusText}): ${safeResBody.substring(0, 300)}`);
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(safeResBody);
    } catch (jsonErr: any) {
      if (options?.silentError || action === 'uploadImage') {
        console.warn(`[APMERCH_DATABASE] Google Apps Script returned non-JSON response for action="${action}": HTTP ${httpStatus}`);
      } else {
        console.error(`[APMERCH_DATABASE] Google Apps Script returned non-JSON response for action="${action}":`, {
          httpStatus,
          responseBody: safeResBody
        });
      }
      const titleMatch = safeResBody.match(/<title>([^<]+)<\/title>/i);
      const errorDetail = titleMatch && titleMatch[1] ? titleMatch[1].trim() : safeResBody.substring(0, 250);
      throw new Error(
        `Google Apps Script returned invalid JSON (HTTP ${httpStatus}): ${errorDetail}. Please check deployment and permissions.`
      );
    }

    if (!parsedData || typeof parsedData !== 'object') {
      const invalidDataMsg = `[APMERCH_DATABASE] Google Apps Script returned invalid payload structure for action="${action}": ${responseBody}`;
      if (options?.silentError || action === 'uploadImage') {
        console.warn(invalidDataMsg);
      } else {
        console.error(invalidDataMsg);
      }
      throw new Error(invalidDataMsg);
    }

    if (parsedData.success === false) {
      const scriptErrorMsg = parsedData.error || parsedData.message || 'Unknown error occurred in Apps Script';
      const isLockTimeout = typeof scriptErrorMsg === 'string' && (
        scriptErrorMsg.toLowerCase().includes('lock acquisition timeout') ||
        scriptErrorMsg.toLowerCase().includes('database lock')
      );

      if (isLockTimeout && retryCount < 2) {
        console.warn(`[APMERCH_DATABASE] Database lock acquisition busy for action="${action}". Retrying in 1.5s (attempt ${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return this.executeAppsScript(action, payload, options, retryCount + 1);
      }

      if (options?.silentError || action === 'uploadImage') {
        console.warn(`[APMERCH_DATABASE] Apps Script notice for action="${action}": ${scriptErrorMsg}`);
      } else {
        console.error(`[APMERCH_DATABASE] Apps Script returned failure for action="${action}":`, {
          error: scriptErrorMsg,
          data: parsedData
        });
      }
      throw new Error(`Google Apps Script Error: ${scriptErrorMsg}`);
    }

    return parsedData;
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
    if (this.activeSyncPromise) {
      return this.activeSyncPromise;
    }

    this.activeSyncPromise = (async () => {
      const url = this.getAppsScriptUrl();
      if (url) {
        this.settings.appsScriptUrl = url;
        try {
          const res = await this.executeAppsScript('getInitialData');
          if (res && res.success) {
            if (res.settings && Object.keys(res.settings).length > 0) {
              this.settings = this.sanitizeSettings({ ...this.settings, ...res.settings, appsScriptUrl: url });
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
        } catch (err: any) {
          console.warn('[APMERCH_DATABASE] syncWithSheet: Unable to fetch live data from Google Sheets (' + (err?.message || err) + '). Using in-memory and persistent cache.');
        }
      } else {
        console.warn('[APMERCH_DATABASE] syncWithSheet: VITE_APPS_SCRIPT_URL is not set. Default in-memory data will be used.');
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
    })().finally(() => {
      this.activeSyncPromise = null;
    });

    return this.activeSyncPromise;
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
    this.settings = this.sanitizeSettings({ ...this.settings, ...newSettings });
    this.persistLockedData(STORAGE_KEYS.LOCKED_SETTINGS, this.settings);
    try {
      await this.executeAppsScript('adminUpdateSettings', { settings: this.settings });
    } catch (err) {
      console.warn('[APMERCH_DATABASE] Warning syncing settings to Apps Script:', err);
    }
    return this.settings;
  }

  // --- Image Upload to Drive APMERCH_DATAFOLDER ---
  public getIsUploadImageSupported(): boolean | null {
    return this.isUploadImageSupported;
  }

  public async uploadImage(
    fileData: string, 
    fileName: string, 
    folder: 'Payment_Qr' | 'Logos' | 'Merchandise' | 'Collection' | 'FanProjects' | 'Homepage' | 'TeamKAAL' = 'Merchandise'
  ): Promise<string> {
    // If we have verified that the current Apps Script deployment doesn't support uploadImage yet,
    // immediately return the optimized base64 image without sending a failing request.
    if (this.isUploadImageSupported === false) {
      return fileData;
    }

    const url = this.getAppsScriptUrl();
    if (url && fileData && fileData.startsWith('data:image')) {
      try {
        const res = await this.executeAppsScript(
          'uploadImage', 
          { fileData, fileName, folder },
          { silentError: true }
        );
        if (res && res.success && res.url) {
          this.isUploadImageSupported = true;
          return res.url;
        }
      } catch (err: any) {
        const errMsg = String(err?.message || err);
        if (errMsg.includes('Unknown action: uploadImage') || errMsg.includes('Unknown action')) {
          this.isUploadImageSupported = false;
          console.warn('[APMERCH_DATABASE] Note: Deployed Google Apps Script has an earlier version without the uploadImage action. Using optimized base64 image as safe fallback. Update and redeploy your Apps Script to enable Google Drive storage.');
        } else {
          console.warn(`[APMERCH_DATABASE] Drive upload to ${folder} notice, using optimized data URL:`, errMsg);
        }
      }
    }
    return fileData;
  }

  /**
   * Ping / Test connection to Google Apps Script
   */
  public async testConnection(): Promise<{ 
    success: boolean; 
    message: string; 
    sheetTitle?: string; 
    supportsUploadImage?: boolean; 
    durationMs: number 
  }> {
    const startTime = Date.now();
    try {
      const res = await this.executeAppsScript('ping', {}, { silentError: true });
      const durationMs = Date.now() - startTime;
      const supportsUploadImage = Array.isArray(res?.capabilities) && res.capabilities.includes('uploadImage');
      if (supportsUploadImage) {
        this.isUploadImageSupported = true;
      }
      return {
        success: true,
        message: res?.message || 'Apps Script Backend Connected Successfully',
        sheetTitle: res?.sheetTitle || 'APMERCH_DATABASE',
        supportsUploadImage: supportsUploadImage || (this.isUploadImageSupported === true),
        durationMs
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Connection test failed',
        durationMs: Date.now() - startTime
      };
    }
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
    // Lock in persistent storage immediately
    this.persistLockedData(STORAGE_KEYS.LOCKED_PRODUCTS, this.products);

    try {
      const res = await this.executeAppsScript('adminSaveProduct', { product });
      if (res && res.product) {
        const updated = res.product;
        const idx = this.products.findIndex(p => p.id === updated.id);
        if (idx >= 0) {
          this.products[idx] = updated;
          this.persistLockedData(STORAGE_KEYS.LOCKED_PRODUCTS, this.products);
        }
        return updated;
      }
    } catch (err) {
      console.warn('[APMERCH_DATABASE] Warning syncing product to sheet, kept in locked persistence:', err);
    }
    return product;
  }

  public async deleteProduct(productId: string): Promise<boolean> {
    this.products = this.products.filter(p => p.id !== productId);
    this.persistLockedData(STORAGE_KEYS.LOCKED_PRODUCTS, this.products);
    try {
      await this.executeAppsScript('adminDeleteProduct', { productId });
    } catch (err) {
      console.warn('[APMERCH_DATABASE] Warning deleting product from sheet:', err);
    }
    return true;
  }

  public resetProductToDefault(productId: string): Product | null {
    const defaultProd = INITIAL_PRODUCTS.find(p => p.id === productId);
    if (defaultProd) {
      const idx = this.products.findIndex(p => p.id === productId);
      if (idx >= 0) {
        this.products[idx] = { ...defaultProd };
        this.persistLockedData(STORAGE_KEYS.LOCKED_PRODUCTS, this.products);
        this.executeAppsScript('adminSaveProduct', { product: this.products[idx] }).catch(() => {});
        return this.products[idx];
      }
    }
    return null;
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
    this.persistLockedData(STORAGE_KEYS.LOCKED_COLLECTIONS, this.collections);

    try {
      const res = await this.executeAppsScript('adminSaveCollection', { collection });
      if (res && res.collection) {
        const updated = res.collection;
        const i = this.collections.findIndex(c => c.id === updated.id);
        if (i >= 0) {
          this.collections[i] = updated;
          this.persistLockedData(STORAGE_KEYS.LOCKED_COLLECTIONS, this.collections);
        }
        return updated;
      }
    } catch (err) {
      console.warn('[APMERCH_DATABASE] Warning syncing collection to sheet:', err);
    }
    return collection;
  }

  public async deleteCollection(id: string): Promise<boolean> {
    this.collections = this.collections.filter(c => c.id !== id);
    this.persistLockedData(STORAGE_KEYS.LOCKED_COLLECTIONS, this.collections);
    return true;
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
    this.persistLockedData(STORAGE_KEYS.LOCKED_FAN_PROJECTS, this.fanProjects);

    try {
      const res = await this.executeAppsScript('adminSaveFanProject', { project });
      if (res && res.project) {
        const updated = res.project;
        const i = this.fanProjects.findIndex(p => p.id === updated.id);
        if (i >= 0) {
          this.fanProjects[i] = updated;
          this.persistLockedData(STORAGE_KEYS.LOCKED_FAN_PROJECTS, this.fanProjects);
        }
        return updated;
      }
    } catch (err) {
      console.warn('[APMERCH_DATABASE] Warning syncing fan project to sheet:', err);
    }
    return project;
  }

  public async deleteFanProject(id: string): Promise<boolean> {
    this.fanProjects = this.fanProjects.filter(p => p.id !== id);
    this.persistLockedData(STORAGE_KEYS.LOCKED_FAN_PROJECTS, this.fanProjects);
    return true;
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
    this.persistLockedData(STORAGE_KEYS.LOCKED_LIBRARY_ITEMS, this.libraryItems);

    try {
      const res = await this.executeAppsScript('adminSaveLibraryItem', { item });
      if (res && res.item) {
        const updated = res.item;
        const i = this.libraryItems.findIndex(l => l.id === updated.id);
        if (i >= 0) {
          this.libraryItems[i] = updated;
          this.persistLockedData(STORAGE_KEYS.LOCKED_LIBRARY_ITEMS, this.libraryItems);
        }
        return updated;
      }
    } catch (err) {
      console.warn('[APMERCH_DATABASE] Warning syncing library item to sheet:', err);
    }
    return item;
  }

  public async deleteLibraryItem(id: string): Promise<boolean> {
    this.libraryItems = this.libraryItems.filter(l => l.id !== id);
    this.persistLockedData(STORAGE_KEYS.LOCKED_LIBRARY_ITEMS, this.libraryItems);
    return true;
  }

  public resetAllToDefault(): void {
    this.products = [...INITIAL_PRODUCTS];
    this.collections = [...INITIAL_COLLECTIONS];
    this.fanProjects = [...INITIAL_FAN_PROJECTS];
    this.libraryItems = [...INITIAL_LIBRARY_ITEMS];
    this.settings = { ...INITIAL_SETTINGS };
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.LOCKED_PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.LOCKED_COLLECTIONS);
      localStorage.removeItem(STORAGE_KEYS.LOCKED_FAN_PROJECTS);
      localStorage.removeItem(STORAGE_KEYS.LOCKED_LIBRARY_ITEMS);
      localStorage.removeItem(STORAGE_KEYS.LOCKED_SETTINGS);
    }
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

    if (!res || !res.success || !res.customer) {
      const errMsg = res?.error || res?.message || 'Failed to register customer in Google Sheets Customers tab. Single source of truth write failed.';
      console.error('[APMERCH_DATABASE] registerCustomer failed:', errMsg, res);
      throw new Error(errMsg);
    }

    const savedCustomer: Customer = res.customer;

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
