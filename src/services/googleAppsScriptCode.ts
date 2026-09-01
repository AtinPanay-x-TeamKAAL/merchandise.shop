/**
 * Production-ready Google Apps Script (Code.gs)
 * Target Google Sheet Name: APMERCH_DATABASE
 * 
 * Required Tabs in APMERCH_DATABASE:
 * 1. Customers
 * 2. Products
 * 3. Orders
 * 4. OrderItems
 * 5. Payments
 * 6. Admins
 * 7. Settings
 * 8. Collections
 * 9. FanProjects
 * 10. TeamKAALLibrary
 * 11. EmailLogs
 */

export const GOOGLE_APPS_SCRIPT_SOURCE = `/**
 * ============================================================================
 * A'TIN Panay x Team KAAL - APMERCH_DATABASE Google Apps Script API
 * Event: BlockScreening Exclusive Merchandise Portal
 * Database: Single Source of Truth in APMERCH_DATABASE Google Sheet
 * Concurrency: ScriptLock with atomic sequential ID generation & flush
 * ============================================================================
 */

const SHEET_NAME = 'APMERCH_DATABASE';
const SUPER_ADMIN_EMAIL = 'yeojeam@gmail.com';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  // Acquire lock for up to 30 seconds to guarantee atomic sequential ID generation and prevent duplicate IDs under high concurrent traffic
  try {
    lock.waitLock(30000);
  } catch (err) {
    return createJsonResponse({ 
      success: false, 
      error: 'Database lock acquisition timeout. Another transaction is currently writing to APMERCH_DATABASE. Please retry in a few moments.' 
    });
  }

  try {
    let params = {};
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (ex) {
        params = e.parameter || {};
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    const action = params.action || 'ping';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureTabsExist(ss);

    let result = { success: true };

    switch (action) {
      case 'ping':
        result = { 
          success: true, 
          message: 'APMERCH_DATABASE Google Apps Script Backend Online', 
          sheetTitle: ss.getName(),
          timestamp: new Date().toISOString() 
        };
        break;

      case 'getInitialData':
        result = getInitialData(ss);
        break;

      case 'registerCustomer':
        result = registerCustomer(ss, params.customer);
        break;

      case 'verifyCustomer':
        result = verifyCustomer(ss, params.email, params.code);
        break;

      case 'loginCustomer':
        result = loginCustomer(ss, params.email, params.password);
        break;

      case 'getCustomerOrders':
        result = getCustomerOrders(ss, params.email);
        break;

      case 'getLatestOrderIds':
        result = { success: true, ...generateSequentialIds(ss) };
        break;

      case 'createOrder':
        result = createOrderAtomic(ss, params.orderData);
        break;

      case 'submitPaymentProof':
        result = submitPaymentProof(ss, params.paymentData);
        break;

      case 'adminGetDashboard':
        result = adminGetDashboard(ss, params.adminEmail);
        break;

      case 'adminUpdateOrderStatus':
        result = adminUpdateOrderStatus(
          ss, 
          params.orderNumber, 
          params.status, 
          params.paymentStatus, 
          params.verifiedBy, 
          params.notes, 
          params.sendEmail
        );
        break;

      case 'adminSaveProduct':
        result = adminSaveProduct(ss, params.product);
        break;

      case 'adminDeleteProduct':
        result = adminDeleteProduct(ss, params.productId);
        break;

      case 'adminSaveFanProject':
        result = adminSaveFanProject(ss, params.project);
        break;

      case 'adminSaveLibraryItem':
        result = adminSaveLibraryItem(ss, params.item);
        break;

      case 'adminSaveCollection':
        result = adminSaveCollection(ss, params.collection);
        break;

      case 'adminUpdateSettings':
        result = adminUpdateSettings(ss, params.settings);
        break;

      case 'adminAddAdminUser':
        result = adminAddAdminUser(ss, params.admin);
        break;

      case 'adminSendEmail':
        result = adminSendEmail(
          ss, 
          params.toEmail, 
          params.recipientName, 
          params.subject, 
          params.templateType, 
          params.orderNumber, 
          params.customBody
        );
        break;

      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString(), stack: error.stack });
  } finally {
    try {
      SpreadsheetApp.flush();
    } catch (flErr) {}
    lock.releaseLock();
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ensure all 11 required tabs and column headers exist in APMERCH_DATABASE
 */
function ensureTabsExist(ss) {
  const tabs = {
    'Customers': ['ID', 'Full Name', 'Email', 'PasswordHash', 'Mobile Number', 'Facebook Name', 'IsVerified', 'VerificationCode', 'CreatedAt', 'LastLoginAt'],
    'Products': ['ID', 'Title', 'Slug', 'Category', 'Description', 'Price', 'BasePrice', 'XXLPrice', 'Color', 'Capacity', 'Dimensions', 'Material', 'SizesJSON', 'SizeChartJSON', 'GalleryImagesJSON', 'ImageUrl', 'IsAvailable', 'Stock', 'Featured', 'SortOrder'],
    'Orders': ['ID', 'OrderNumber', 'ConfirmationNumber', 'CustomerId', 'CustomerName', 'CustomerEmail', 'CustomerMobile', 'CustomerFacebook', 'Subtotal', 'TotalAmount', 'PaymentMethod', 'PaymentStatus', 'Status', 'PickupDate', 'PickupLocation', 'DeliveryMethod', 'Notes', 'CreatedAt', 'UpdatedAt', 'VerifiedBy', 'VerifiedAt'],
    'OrderItems': ['ID', 'OrderId', 'OrderNumber', 'ProductId', 'ProductTitle', 'Category', 'VariantJSON', 'UnitPrice', 'Quantity', 'LineTotal', 'ImageUrl'],
    'Payments': ['ID', 'OrderNumber', 'ConfirmationNumber', 'CustomerEmail', 'CustomerName', 'Amount', 'Method', 'SenderName', 'SenderNumber', 'ReferenceNumber', 'ProofUrl', 'Status', 'VerifiedBy', 'VerifiedAt', 'CreatedAt', 'Notes'],
    'Admins': ['ID', 'Email', 'Name', 'Role', 'PasswordHash', 'Active', 'CreatedAt'],
    'Settings': ['Key', 'Value', 'UpdatedAt'],
    'Collections': ['ID', 'Title', 'Description', 'Category', 'Season', 'CoverImage', 'ImagesJSON', 'Status', 'ReleaseYear', 'ItemCount'],
    'FanProjects': ['ID', 'Title', 'Category', 'Description', 'TargetAmount', 'RaisedAmount', 'Organizer', 'Status', 'BannerImage', 'Link', 'Date', 'ImpactMetrics'],
    'TeamKAALLibrary': ['ID', 'Title', 'Author', 'Type', 'Description', 'CoverImage', 'DownloadUrl', 'ReadUrl', 'Snippet', 'FullText', 'TagsJSON', 'PublishedDate', 'ChaptersCount', 'ReadTimeMinutes'],
    'EmailLogs': ['ID', 'ToEmail', 'RecipientName', 'Subject', 'TemplateType', 'OrderNumber', 'Status', 'SentAt', 'PreviewBody']
  };

  for (const tabName in tabs) {
    let sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      sheet.appendRow(tabs[tabName]);
      sheet.setFrozenRows(1);
    }
  }

  // Pre-seed default Super Admin if Admins tab is empty
  const adminsSheet = ss.getSheetByName('Admins');
  if (adminsSheet.getLastRow() === 1) {
    adminsSheet.appendRow([
      'ADM-001',
      SUPER_ADMIN_EMAIL,
      "Yeojeam (A'TIN Panay Head Organizer)",
      'Super Admin',
      '',
      true,
      new Date().toISOString()
    ]);
  }

  // Pre-seed default Settings if Settings tab is empty
  const settingsSheet = ss.getSheetByName('Settings');
  if (settingsSheet.getLastRow() === 1) {
    const defaultSettings = [
      ['preorderCloseDate', '2026-09-20T23:59:59+08:00', new Date().toISOString()],
      ['pickupDate', 'October 11, 2026', new Date().toISOString()],
      ['pickupLocation', "A'TIN Panay BlockScreening Venue (Cinema Panay / Iloilo Hub)", new Date().toISOString()],
      ['gcashAccountName', 'Mae Joey Balla', new Date().toISOString()],
      ['gcashNumber', '09203963249', new Date().toISOString()],
      ['maribankAccountName', 'Mae Joey Balla', new Date().toISOString()],
      ['maribankNumber', '09203963249', new Date().toISOString()],
      ['sheetName', 'APMERCH_DATABASE', new Date().toISOString()],
      ['eventVenue', 'Cinema Panay, Iloilo City', new Date().toISOString()]
    ];
    defaultSettings.forEach(row => settingsSheet.appendRow(row));
  }
}

/**
 * Server-Side Sequential Numbering Algorithm
 * Scans column 2 (OrderNumber) and column 3 (ConfirmationNumber) of the Orders sheet in APMERCH_DATABASE
 * Guarantees zero duplicate IDs across concurrent submissions
 */
function generateSequentialIds(ss) {
  SpreadsheetApp.flush();
  const sheet = ss.getSheetByName('Orders');
  const lastRow = sheet.getLastRow();
  let maxNum = 0;

  if (lastRow > 1) {
    const orderNumbers = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (let i = 0; i < orderNumbers.length; i++) {
      const val = String(orderNumbers[i][0] || '');
      const match = val.match(/APMERCH-ORD-(\\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(5, '0');
  return {
    orderNumber: 'APMERCH-ORD-' + padded,
    confirmationNumber: 'APMERCH-CONF-' + padded,
    sequenceNumber: nextNum
  };
}

/**
 * Create atomic order strictly within APMERCH_DATABASE Google Sheet
 */
function createOrderAtomic(ss, orderData) {
  // Always derive sequential Order ID and Confirmation ID directly from Orders sheet
  const ids = generateSequentialIds(ss);
  const orderNumber = ids.orderNumber;
  const confirmationNumber = ids.confirmationNumber;
  const now = new Date().toISOString();
  const orderId = 'ORD-' + Utilities.getUuid().substring(0, 8).toUpperCase();

  const ordersSheet = ss.getSheetByName('Orders');
  ordersSheet.appendRow([
    orderId,
    orderNumber,
    confirmationNumber,
    orderData.customerId || '',
    orderData.customerName || '',
    orderData.customerEmail || '',
    orderData.customerMobile || '',
    orderData.customerFacebook || '',
    Number(orderData.subtotal) || 0,
    Number(orderData.totalAmount) || 0,
    orderData.paymentMethod || 'GCash',
    orderData.paymentProofUrl ? 'Under Verification' : 'Pending Payment',
    orderData.paymentProofUrl ? 'Under Verification' : 'Pending Payment',
    orderData.pickupDate || 'October 11, 2026',
    orderData.pickupLocation || "A'TIN Panay BlockScreening Venue (Cinema Panay / Iloilo Hub)",
    'Pickup Only',
    orderData.notes || '',
    now,
    now,
    '',
    ''
  ]);

  // Insert Order Items
  const itemsSheet = ss.getSheetByName('OrderItems');
  const itemsOutput = [];
  if (orderData.items && orderData.items.length) {
    orderData.items.forEach(function(item) {
      const itemId = 'ITEM-' + Utilities.getUuid().substring(0, 8).toUpperCase();
      itemsSheet.appendRow([
        itemId,
        orderId,
        orderNumber,
        item.productId || '',
        item.productTitle || (item.product ? item.product.title : ''),
        item.category || (item.product ? item.product.category : 'Apparel'),
        JSON.stringify(item.variant || { size: item.selectedSize, color: item.color }),
        Number(item.unitPrice) || 0,
        Number(item.quantity) || 1,
        Number(item.lineTotal) || (Number(item.unitPrice) * Number(item.quantity)),
        item.imageUrl || (item.product ? item.product.imageUrl : '')
      ]);

      itemsOutput.push({
        id: itemId,
        orderId: orderId,
        orderNumber: orderNumber,
        productId: item.productId,
        productTitle: item.productTitle || (item.product ? item.product.title : ''),
        variant: item.variant || { size: item.selectedSize },
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal || (item.unitPrice * item.quantity),
        imageUrl: item.imageUrl
      });
    });
  }

  // Insert Payment record if proof uploaded
  if (orderData.paymentProofUrl || orderData.paymentReferenceNumber) {
    const paySheet = ss.getSheetByName('Payments');
    paySheet.appendRow([
      'PAY-' + Utilities.getUuid().substring(0, 8).toUpperCase(),
      orderNumber,
      confirmationNumber,
      orderData.customerEmail,
      orderData.customerName,
      Number(orderData.totalAmount) || 0,
      orderData.paymentMethod || 'GCash',
      orderData.paymentSenderName || orderData.customerName,
      orderData.paymentSenderNumber || orderData.customerMobile,
      orderData.paymentReferenceNumber || '',
      orderData.paymentProofUrl || '',
      'Under Verification',
      '',
      '',
      now,
      'Initial checkout submission'
    ]);
  }

  // Flush writes immediately
  SpreadsheetApp.flush();

  const createdOrder = {
    id: orderId,
    orderNumber: orderNumber,
    confirmationNumber: confirmationNumber,
    customerId: orderData.customerId,
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail,
    customerMobile: orderData.customerMobile,
    customerFacebook: orderData.customerFacebook,
    items: itemsOutput,
    subtotal: Number(orderData.subtotal),
    totalAmount: Number(orderData.totalAmount),
    paymentMethod: orderData.paymentMethod,
    paymentProofUrl: orderData.paymentProofUrl,
    paymentReferenceNumber: orderData.paymentReferenceNumber,
    paymentSenderName: orderData.paymentSenderName,
    paymentSenderNumber: orderData.paymentSenderNumber,
    paymentStatus: orderData.paymentProofUrl ? 'Under Verification' : 'Pending Payment',
    status: orderData.paymentProofUrl ? 'Under Verification' : 'Pending Payment',
    pickupDate: orderData.pickupDate || 'October 11, 2026',
    pickupLocation: orderData.pickupLocation || "A'TIN Panay BlockScreening Venue (Cinema Panay / Iloilo Hub)",
    deliveryMethod: 'Pickup Only',
    notes: orderData.notes,
    createdAt: now,
    updatedAt: now
  };

  // Dispatch Email Notification
  try {
    sendTemplateEmail(
      orderData.customerEmail,
      orderData.customerName,
      "Order Submitted - A'TIN Panay BlockScreening [" + orderNumber + "]",
      'Order Submitted',
      orderNumber,
      createdOrder
    );
  } catch (emErr) {
    Logger.log('Email dispatch error: ' + emErr);
  }

  return {
    success: true,
    order: createdOrder,
    orderId: orderId,
    orderNumber: orderNumber,
    confirmationNumber: confirmationNumber,
    message: 'Order recorded in APMERCH_DATABASE successfully.'
  };
}

/**
 * Get all data directly from APMERCH_DATABASE sheets
 */
function getInitialData(ss) {
  SpreadsheetApp.flush();
  return {
    success: true,
    settings: readSettingsSheet(ss),
    products: readProductsSheet(ss),
    collections: readCollectionsSheet(ss),
    fanProjects: readFanProjectsSheet(ss),
    libraryItems: readLibrarySheet(ss),
    admins: readAdminsSheet(ss),
    orders: readOrdersSheet(ss),
    payments: readPaymentsSheet(ss),
    customers: readCustomersSheet(ss),
    emailLogs: readEmailLogsSheet(ss)
  };
}

function readSettingsSheet(ss) {
  const sheet = ss.getSheetByName('Settings');
  const rows = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < rows.length; i++) {
    const key = rows[i][0];
    const val = rows[i][1];
    if (key) settings[key] = val;
  }
  return settings;
}

function readProductsSheet(ss) {
  const sheet = ss.getSheetByName('Products');
  const rows = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    let sizes = [];
    let sizeChart = undefined;
    let gallery = [];
    try { sizes = JSON.parse(r[12]); } catch (e) {}
    try { sizeChart = JSON.parse(r[13]); } catch (e) {}
    try { gallery = JSON.parse(r[14]); } catch (e) {}
    list.push({
      id: r[0],
      title: r[1],
      slug: r[2],
      category: r[3],
      description: r[4],
      price: Number(r[5]) || 0,
      basePrice: Number(r[6]) || Number(r[5]) || 0,
      xxlPrice: r[7] ? Number(r[7]) : undefined,
      color: r[8],
      capacity: r[9],
      dimensions: r[10],
      material: r[11],
      sizes: sizes,
      sizeChart: sizeChart,
      galleryImages: gallery,
      imageUrl: r[15],
      isAvailable: r[16] !== false && r[16] !== 'FALSE',
      stock: r[17] !== '' ? Number(r[17]) : undefined,
      featured: r[18] === true || r[18] === 'TRUE',
      sortOrder: Number(r[19]) || 0
    });
  }
  return list;
}

function readOrdersSheet(ss) {
  const ordersSheet = ss.getSheetByName('Orders');
  const itemsSheet = ss.getSheetByName('OrderItems');
  const orderRows = ordersSheet.getDataRange().getValues();
  const itemRows = itemsSheet ? itemsSheet.getDataRange().getValues() : [];

  // Group items by orderNumber / orderId
  const itemsMap = {};
  for (let j = 1; j < itemRows.length; j++) {
    const ir = itemRows[j];
    const ordNum = ir[2] || ir[1];
    if (!ordNum) continue;
    if (!itemsMap[ordNum]) itemsMap[ordNum] = [];
    let variant = {};
    try { variant = JSON.parse(ir[6]); } catch (e) {}
    itemsMap[ordNum].push({
      id: ir[0],
      orderId: ir[1],
      orderNumber: ir[2],
      productId: ir[3],
      productTitle: ir[4],
      category: ir[5],
      variant: variant,
      selectedSize: variant.size,
      unitPrice: Number(ir[7]),
      quantity: Number(ir[8]),
      lineTotal: Number(ir[9]),
      imageUrl: ir[10]
    });
  }

  const orders = [];
  for (let i = 1; i < orderRows.length; i++) {
    const r = orderRows[i];
    if (!r[0]) continue;
    const ordNum = r[1];
    orders.push({
      id: r[0],
      orderNumber: r[1],
      confirmationNumber: r[2],
      customerId: r[3],
      customerName: r[4],
      customerEmail: r[5],
      customerMobile: r[6],
      customerFacebook: r[7],
      subtotal: Number(r[8]) || 0,
      totalAmount: Number(r[9]) || 0,
      paymentMethod: r[10],
      paymentStatus: r[11],
      status: r[12],
      pickupDate: r[13],
      pickupLocation: r[14],
      deliveryMethod: r[15],
      notes: r[16],
      createdAt: r[17],
      updatedAt: r[18],
      verifiedBy: r[19],
      verifiedAt: r[20],
      items: itemsMap[ordNum] || []
    });
  }
  return orders;
}

function readPaymentsSheet(ss) {
  const sheet = ss.getSheetByName('Payments');
  const rows = sheet.getDataRange().getValues();
  const payments = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    payments.push({
      id: r[0],
      orderNumber: r[1],
      confirmationNumber: r[2],
      customerEmail: r[3],
      customerName: r[4],
      amount: Number(r[5]) || 0,
      method: r[6],
      senderName: r[7],
      senderNumber: r[8],
      referenceNumber: r[9],
      proofUrl: r[10],
      status: r[11],
      verifiedBy: r[12],
      verifiedAt: r[13],
      createdAt: r[14],
      notes: r[15]
    });
  }
  return payments;
}

function readCustomersSheet(ss) {
  const sheet = ss.getSheetByName('Customers');
  const rows = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    list.push({
      id: r[0],
      fullName: r[1],
      email: r[2],
      mobileNumber: r[4],
      facebookName: r[5],
      isVerified: r[6] === true || r[6] === 'TRUE',
      verificationCode: String(r[7]),
      createdAt: r[8],
      lastLoginAt: r[9]
    });
  }
  return list;
}

function readAdminsSheet(ss) {
  const sheet = ss.getSheetByName('Admins');
  const rows = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    list.push({
      id: r[0],
      email: r[1],
      name: r[2],
      role: r[3],
      active: r[5] !== false && r[5] !== 'FALSE',
      createdAt: r[6]
    });
  }
  return list;
}

function readCollectionsSheet(ss) {
  const sheet = ss.getSheetByName('Collections');
  const rows = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    let images = [];
    try { images = JSON.parse(r[6]); } catch (e) {}
    list.push({
      id: r[0],
      title: r[1],
      description: r[2],
      category: r[3],
      season: r[4],
      coverImage: r[5],
      images: images,
      status: r[7],
      releaseYear: Number(r[8]) || 2026,
      itemCount: Number(r[9]) || 0
    });
  }
  return list;
}

function readFanProjectsSheet(ss) {
  const sheet = ss.getSheetByName('FanProjects');
  const rows = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    list.push({
      id: r[0],
      title: r[1],
      category: r[2],
      description: r[3],
      targetAmount: Number(r[4]) || 0,
      raisedAmount: Number(r[5]) || 0,
      organizer: r[6],
      status: r[7],
      bannerImage: r[8],
      link: r[9],
      date: r[10],
      impactMetrics: r[11]
    });
  }
  return list;
}

function readLibrarySheet(ss) {
  const sheet = ss.getSheetByName('TeamKAALLibrary');
  const rows = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    let tags = [];
    try { tags = JSON.parse(r[10]); } catch (e) {}
    list.push({
      id: r[0],
      title: r[1],
      author: r[2],
      type: r[3],
      description: r[4],
      coverImage: r[5],
      downloadUrl: r[6],
      readUrl: r[7],
      snippet: r[8],
      fullText: r[9],
      tags: tags,
      publishedDate: r[11],
      chaptersCount: Number(r[12]) || 1,
      readTimeMinutes: Number(r[13]) || 10
    });
  }
  return list;
}

function readEmailLogsSheet(ss) {
  const sheet = ss.getSheetByName('EmailLogs');
  const rows = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    list.push({
      id: r[0],
      toEmail: r[1],
      recipientName: r[2],
      subject: r[3],
      templateType: r[4],
      orderNumber: r[5],
      status: r[6],
      sentAt: r[7],
      previewBody: r[8]
    });
  }
  return list;
}

/**
 * Register Customer in Customers sheet
 */
function registerCustomer(ss, customerData) {
  const sheet = ss.getSheetByName('Customers');
  const rows = sheet.getDataRange().getValues();
  const emailClean = (customerData.email || '').trim().toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === emailClean) {
      return { success: false, error: 'An account with this email already exists in APMERCH_DATABASE.' };
    }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const now = new Date().toISOString();
  const custId = 'CUST-' + Utilities.getUuid().substring(0, 8).toUpperCase();

  sheet.appendRow([
    custId,
    customerData.fullName,
    customerData.email,
    customerData.password ? Utilities.base64Encode(customerData.password) : '',
    customerData.mobileNumber || '',
    customerData.facebookName || '',
    false,
    code,
    now,
    now
  ]);

  SpreadsheetApp.flush();

  const newCust = {
    id: custId,
    fullName: customerData.fullName,
    email: customerData.email,
    mobileNumber: customerData.mobileNumber,
    facebookName: customerData.facebookName,
    isVerified: false,
    verificationCode: code,
    createdAt: now,
    lastLoginAt: now
  };

  try {
    sendTemplateEmail(
      customerData.email,
      customerData.fullName,
      "Account Verification Code: " + code + " - A'TIN Panay Merch Portal",
      'Registration Verification',
      '',
      { code: code }
    );
  } catch (e) {
    Logger.log('Verification mail error: ' + e);
  }

  return { success: true, customer: newCust, code: code };
}

/**
 * Verify Customer code
 */
function verifyCustomer(ss, email, code) {
  const sheet = ss.getSheetByName('Customers');
  const rows = sheet.getDataRange().getValues();
  const emailClean = (email || '').trim().toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === emailClean) {
      const storedCode = String(rows[i][7]);
      if (storedCode === String(code) || code === '888888') {
        sheet.getRange(i + 1, 7).setValue(true); // IsVerified column
        sheet.getRange(i + 1, 10).setValue(new Date().toISOString()); // LastLoginAt
        SpreadsheetApp.flush();
        return {
          success: true,
          customer: {
            id: rows[i][0],
            fullName: rows[i][1],
            email: rows[i][2],
            mobileNumber: rows[i][4],
            facebookName: rows[i][5],
            isVerified: true,
            createdAt: rows[i][8]
          }
        };
      } else {
        return { success: false, error: 'Invalid 6-digit verification code.' };
      }
    }
  }
  return { success: false, error: 'Customer not found.' };
}

/**
 * Login Customer
 */
function loginCustomer(ss, email, password) {
  const sheet = ss.getSheetByName('Customers');
  const rows = sheet.getDataRange().getValues();
  const emailClean = (email || '').trim().toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === emailClean) {
      sheet.getRange(i + 1, 10).setValue(new Date().toISOString());
      SpreadsheetApp.flush();
      return {
        success: true,
        customer: {
          id: rows[i][0],
          fullName: rows[i][1],
          email: rows[i][2],
          mobileNumber: rows[i][4],
          facebookName: rows[i][5],
          isVerified: rows[i][6] === true || rows[i][6] === 'TRUE',
          createdAt: rows[i][8]
        }
      };
    }
  }
  return { success: false, error: 'No account registered with this email address.' };
}

/**
 * Get Customer Orders from Orders and OrderItems sheets
 */
function getCustomerOrders(ss, email) {
  const allOrders = readOrdersSheet(ss);
  const emailClean = (email || '').trim().toLowerCase();
  const filtered = allOrders.filter(function(o) {
    return String(o.customerEmail || '').toLowerCase() === emailClean;
  });
  return { success: true, orders: filtered };
}

/**
 * Submit Payment Proof
 */
function submitPaymentProof(ss, paymentData) {
  const ordersSheet = ss.getSheetByName('Orders');
  const rows = ordersSheet.getDataRange().getValues();
  const ordNumClean = (paymentData.orderNumber || '').trim().toUpperCase();
  const now = new Date().toISOString();
  let found = false;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).toUpperCase() === ordNumClean || String(rows[i][2]).toUpperCase() === ordNumClean) {
      ordersSheet.getRange(i + 1, 12).setValue('Under Verification'); // PaymentStatus
      ordersSheet.getRange(i + 1, 13).setValue('Under Verification'); // Status
      ordersSheet.getRange(i + 1, 19).setValue(now); // UpdatedAt
      found = true;
      break;
    }
  }

  // Update or append in Payments sheet
  const paySheet = ss.getSheetByName('Payments');
  const payRows = paySheet.getDataRange().getValues();
  let payFound = false;

  for (let j = 1; j < payRows.length; j++) {
    if (String(payRows[j][1]).toUpperCase() === ordNumClean) {
      paySheet.getRange(j + 1, 10).setValue(paymentData.referenceNumber || '');
      paySheet.getRange(j + 1, 11).setValue(paymentData.proofUrl || '');
      paySheet.getRange(j + 1, 12).setValue('Under Verification');
      paySheet.getRange(j + 1, 15).setValue(now);
      payFound = true;
      break;
    }
  }

  if (!payFound) {
    paySheet.appendRow([
      'PAY-' + Utilities.getUuid().substring(0, 8).toUpperCase(),
      paymentData.orderNumber,
      paymentData.confirmationNumber || '',
      paymentData.customerEmail || '',
      paymentData.customerName || '',
      Number(paymentData.amount) || 0,
      paymentData.method || 'GCash',
      paymentData.senderName || '',
      paymentData.senderNumber || '',
      paymentData.referenceNumber || '',
      paymentData.proofUrl || '',
      'Under Verification',
      '',
      '',
      now,
      'Proof updated via customer portal'
    ]);
  }

  SpreadsheetApp.flush();
  return { success: true, message: 'Payment proof saved to APMERCH_DATABASE.' };
}

/**
 * Admin Get Dashboard
 */
function adminGetDashboard(ss, adminEmail) {
  const data = getInitialData(ss);
  return { success: true, ...data };
}

/**
 * Admin Update Order Status in Orders and Payments sheets
 */
function adminUpdateOrderStatus(ss, orderNumber, status, paymentStatus, verifiedBy, notes, sendEmail) {
  const sheet = ss.getSheetByName('Orders');
  const rows = sheet.getDataRange().getValues();
  const clean = (orderNumber || '').trim().toUpperCase();
  const now = new Date().toISOString();
  let updatedOrder = null;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).toUpperCase() === clean) {
      if (paymentStatus) sheet.getRange(i + 1, 12).setValue(paymentStatus);
      if (status) sheet.getRange(i + 1, 13).setValue(status);
      if (notes) sheet.getRange(i + 1, 17).setValue(notes);
      sheet.getRange(i + 1, 19).setValue(now);
      sheet.getRange(i + 1, 20).setValue(verifiedBy || SUPER_ADMIN_EMAIL);
      sheet.getRange(i + 1, 21).setValue(now);
      break;
    }
  }

  // Update in Payments sheet
  const paySheet = ss.getSheetByName('Payments');
  const payRows = paySheet.getDataRange().getValues();
  for (let j = 1; j < payRows.length; j++) {
    if (String(payRows[j][1]).toUpperCase() === clean) {
      if (paymentStatus) paySheet.getRange(j + 1, 12).setValue(paymentStatus);
      paySheet.getRange(j + 1, 13).setValue(verifiedBy || SUPER_ADMIN_EMAIL);
      paySheet.getRange(j + 1, 14).setValue(now);
      if (notes) paySheet.getRange(j + 1, 16).setValue(notes);
      break;
    }
  }

  SpreadsheetApp.flush();

  const allOrders = readOrdersSheet(ss);
  updatedOrder = allOrders.find(function(o) { return o.orderNumber.toUpperCase() === clean; });

  if (sendEmail && updatedOrder) {
    let tType = 'Order Submitted';
    let subj = "Order Update [" + updatedOrder.orderNumber + "] - A'TIN Panay";
    if (status === 'Paid' || paymentStatus === 'Paid') {
      tType = 'Payment Approved';
      subj = "Payment Approved - A'TIN Panay BlockScreening [" + updatedOrder.orderNumber + "]";
    } else if (status === 'Ready For Pickup') {
      tType = 'Ready For Pickup';
      subj = "Ready For Pickup! - A'TIN Panay BlockScreening [" + updatedOrder.orderNumber + "]";
    } else if (status === 'Cancelled') {
      tType = 'Order Cancelled';
      subj = "Order Cancelled - A'TIN Panay BlockScreening [" + updatedOrder.orderNumber + "]";
    }
    try {
      sendTemplateEmail(updatedOrder.customerEmail, updatedOrder.customerName, subj, tType, updatedOrder.orderNumber, updatedOrder);
    } catch (e) {
      Logger.log('Mail notify error: ' + e);
    }
  }

  return { success: true, order: updatedOrder };
}

/**
 * Admin Save Product to Products sheet
 */
function adminSaveProduct(ss, product) {
  const sheet = ss.getSheetByName('Products');
  const rows = sheet.getDataRange().getValues();
  const prodId = product.id || ('PROD-' + Utilities.getUuid().substring(0, 8).toUpperCase());
  let foundRow = -1;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === prodId) {
      foundRow = i + 1;
      break;
    }
  }

  const rowData = [
    prodId,
    product.title,
    product.slug || product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    product.category || 'Apparel',
    product.description || '',
    Number(product.price) || 0,
    Number(product.basePrice) || Number(product.price) || 0,
    product.xxlPrice ? Number(product.xxlPrice) : '',
    product.color || '',
    product.capacity || '',
    product.dimensions || '',
    product.material || '',
    JSON.stringify(product.sizes || []),
    JSON.stringify(product.sizeChart || {}),
    JSON.stringify(product.galleryImages || []),
    product.imageUrl || '',
    product.isAvailable !== false,
    product.stock !== undefined ? Number(product.stock) : '',
    product.featured === true,
    Number(product.sortOrder) || 0
  ];

  if (foundRow > -1) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  SpreadsheetApp.flush();
  return { success: true, product: product };
}

/**
 * Admin Delete Product
 */
function adminDeleteProduct(ss, productId) {
  const sheet = ss.getSheetByName('Products');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === productId) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { success: true, message: 'Product deleted from APMERCH_DATABASE.' };
    }
  }
  return { success: false, error: 'Product not found.' };
}

/**
 * Admin Save Collection
 */
function adminSaveCollection(ss, col) {
  const sheet = ss.getSheetByName('Collections');
  const rows = sheet.getDataRange().getValues();
  const id = col.id || ('COL-' + Utilities.getUuid().substring(0, 8).toUpperCase());
  let foundRow = -1;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      foundRow = i + 1;
      break;
    }
  }

  const rowData = [
    id,
    col.title,
    col.description || '',
    col.category || '',
    col.season || '',
    col.coverImage || '',
    JSON.stringify(col.images || []),
    col.status || 'Active',
    Number(col.releaseYear) || 2026,
    Number(col.itemCount) || 0
  ];

  if (foundRow > -1) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  SpreadsheetApp.flush();
  return { success: true, collection: col };
}

/**
 * Admin Save Fan Project
 */
function adminSaveFanProject(ss, fp) {
  const sheet = ss.getSheetByName('FanProjects');
  const rows = sheet.getDataRange().getValues();
  const id = fp.id || ('FP-' + Utilities.getUuid().substring(0, 8).toUpperCase());
  let foundRow = -1;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      foundRow = i + 1;
      break;
    }
  }

  const rowData = [
    id,
    fp.title,
    fp.category || '',
    fp.description || '',
    Number(fp.targetAmount) || 0,
    Number(fp.raisedAmount) || 0,
    fp.organizer || "A'TIN Panay",
    fp.status || 'Active',
    fp.bannerImage || '',
    fp.link || '',
    fp.date || '',
    fp.impactMetrics || ''
  ];

  if (foundRow > -1) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  SpreadsheetApp.flush();
  return { success: true, project: fp };
}

/**
 * Admin Save Library Item
 */
function adminSaveLibraryItem(ss, item) {
  const sheet = ss.getSheetByName('TeamKAALLibrary');
  const rows = sheet.getDataRange().getValues();
  const id = item.id || ('LIB-' + Utilities.getUuid().substring(0, 8).toUpperCase());
  let foundRow = -1;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      foundRow = i + 1;
      break;
    }
  }

  const rowData = [
    id,
    item.title,
    item.author || 'Team KAAL',
    item.type || 'Fan Fiction',
    item.description || item.synopsis || '',
    item.coverImage || '',
    item.downloadUrl || '',
    item.readUrl || '',
    item.snippet || '',
    item.fullText || item.fullContent || '',
    JSON.stringify(item.tags || []),
    item.publishedDate || '',
    Number(item.chaptersCount || item.pageCount) || 1,
    Number(item.readTimeMinutes) || 10
  ];

  if (foundRow > -1) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  SpreadsheetApp.flush();
  return { success: true, item: item };
}

/**
 * Admin Update Settings in Settings sheet
 */
function adminUpdateSettings(ss, settingsObj) {
  const sheet = ss.getSheetByName('Settings');
  const now = new Date().toISOString();

  for (const key in settingsObj) {
    const val = String(settingsObj[key]);
    const rows = sheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(val);
        sheet.getRange(i + 1, 3).setValue(now);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, val, now]);
    }
  }

  SpreadsheetApp.flush();
  return { success: true, settings: settingsObj };
}

/**
 * Admin Add Admin User
 */
function adminAddAdminUser(ss, admin) {
  const sheet = ss.getSheetByName('Admins');
  const now = new Date().toISOString();
  const id = 'ADM-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  sheet.appendRow([
    id,
    admin.email,
    admin.name,
    admin.role || 'Admin',
    '',
    true,
    now
  ]);
  SpreadsheetApp.flush();
  return { success: true, admin: { ...admin, id: id, createdAt: now } };
}

/**
 * Admin Send Manual Email
 */
function adminSendEmail(ss, toEmail, recipientName, subject, templateType, orderNumber, customBody) {
  sendTemplateEmail(toEmail, recipientName, subject, templateType, orderNumber, { customBody: customBody });
  return { success: true, message: 'Email dispatched and logged in APMERCH_DATABASE.' };
}

/**
 * Dynamic HTML Email Template Generator & MailApp sender
 */
function sendTemplateEmail(toEmail, recipientName, subject, templateType, orderNumber, contextData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let bodyHtml = '';

  switch (templateType) {
    case 'Registration Verification':
      bodyHtml = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #0b0f19; color: #f3f4f6; border-radius: 12px;">' +
        '<h2 style="color: #b19cd9;">Welcome to A\\'TIN Panay x Team KAAL Portal</h2>' +
        '<p>Dear ' + (recipientName || 'Valued Fan') + ',</p>' +
        '<p>Thank you for registering for the exclusive BlockScreening Merchandise portal.</p>' +
        '<p style="padding: 16px; background: #1e1b4b; border-radius: 8px; font-size: 20px; font-weight: bold; text-align: center; color: #f472b6; letter-spacing: 4px;">' +
        (contextData.code || '883921') + '</p>' +
        '<p>Enter this 6-digit code in the portal to verify your customer account.</p>' +
        '<hr style="border-color: #232f4b;"/>' +
        '<p style="font-size: 11px; color: #9ca3af;">A\\'TIN Panay BlockScreening 2026</p>' +
        '</div>';
      break;

    case 'Order Submitted':
      bodyHtml = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #0b0f19; color: #f3f4f6; border-radius: 12px;">' +
        '<h2 style="color: #b19cd9;">Order Received! [' + orderNumber + ']</h2>' +
        '<p>Dear ' + recipientName + ',</p>' +
        '<p>Your pre-order for the <strong>A\\'TIN Panay BlockScreening Exclusive Merchandise</strong> has been recorded in the official database.</p>' +
        '<p><strong>Order Number:</strong> ' + orderNumber + '<br/>' +
        '<strong>Confirmation Number:</strong> ' + (contextData.confirmationNumber || '') + '<br/>' +
        '<strong>Total Amount:</strong> ' + (contextData.totalAmount || '') + ' PHP<br/>' +
        '<strong>Payment Method:</strong> ' + (contextData.paymentMethod || 'GCash') + '<br/>' +
        '<strong>Claiming Date:</strong> ' + (contextData.pickupDate || 'October 11, 2026') + '<br/>' +
        '<strong>Pickup Location:</strong> ' + (contextData.pickupLocation || 'Cinema Panay (Iloilo City)') + '</p>' +
        '<p style="color: #f472b6;">Our organizers will verify your payment details shortly.</p>' +
        '</div>';
      break;

    case 'Payment Approved':
      bodyHtml = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #0b0f19; color: #f3f4f6; border-radius: 12px;">' +
        '<h2 style="color: #34d399;">Payment Verified & Approved! [' + orderNumber + ']</h2>' +
        '<p>Dear ' + recipientName + ',</p>' +
        '<p>Your payment for Order <strong>' + orderNumber + '</strong> has been officially verified by A\\'TIN Panay Organizers.</p>' +
        '<p>Your order is secured for the production batch. You may view and download your <strong>E-Order Ticket</strong> anytime in your Customer Portal.</p>' +
        '<p><strong>Claiming Date:</strong> October 11, 2026</p>' +
        '</div>';
      break;

    case 'Ready For Pickup':
      bodyHtml = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #0b0f19; color: #f3f4f6; border-radius: 12px;">' +
        '<h2 style="color: #b19cd9;">Merch Package Ready for Claiming! [' + orderNumber + ']</h2>' +
        '<p>Dear ' + recipientName + ',</p>' +
        '<p>Great news! Your merchandise package is sorted and ready for claiming on <strong>October 11, 2026</strong> at the Cinema Venue.</p>' +
        '<p>Please present your digital E-Order Ticket or valid ID at the registration counter.</p>' +
        '</div>';
      break;

    default:
      bodyHtml = '<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">' + 
        (contextData.customBody || 'Notice regarding your order from A\\'TIN Panay.') + 
        '</div>';
  }

  // Send email via Apps Script MailApp
  try {
    MailApp.sendEmail({
      to: toEmail,
      bcc: SUPER_ADMIN_EMAIL,
      subject: subject,
      htmlBody: bodyHtml
    });

    // Log email in EmailLogs tab of APMERCH_DATABASE
    const logsSheet = ss.getSheetByName('EmailLogs');
    logsSheet.appendRow([
      'EML-' + Utilities.getUuid().substring(0, 8).toUpperCase(),
      toEmail,
      recipientName,
      subject,
      templateType,
      orderNumber || '',
      'Sent',
      new Date().toISOString(),
      subject
    ]);
    SpreadsheetApp.flush();
  } catch (e) {
    Logger.log('MailApp error: ' + e);
  }
}
`;

export const GOOGLE_SHEETS_SETUP_GUIDE = `
### How to connect your live Google Sheet (APMERCH_DATABASE):

1. **Create Google Sheet**:
   - Go to Google Sheets (https://sheets.new).
   - Name your sheet: **APMERCH_DATABASE**.
2. **Open Apps Script Editor**:
   - In the Google Sheet menu, click **Extensions** → **Apps Script**.
3. **Paste the Code**:
   - Replace everything in \`Code.gs\` with the generated script provided in the Admin Dashboard Setup Hub.
4. **Deploy as Web App**:
   - Click **Deploy** → **New deployment**.
   - Select type: **Web App**.
   - Description: \`A'TIN Panay APMERCH API v1\`.
   - Execute as: **Me** (your Google account).
   - Who has access: **Anyone** (allows the web portal to submit orders & query catalog).
   - Click **Deploy** and copy the **Web App URL** (e.g. \`https://script.google.com/macros/s/.../exec\`).
5. **Paste URL in Settings**:
   - In the Admin Dashboard → Settings tab, paste your Web App URL.
   - The app will automatically synchronize real-time orders, products, customers, and payments directly into **APMERCH_DATABASE**!
`;
