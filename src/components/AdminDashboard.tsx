import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Package, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  Settings as SettingsIcon, 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileSpreadsheet, 
  ExternalLink, 
  Copy, 
  Save, 
  TrendingUp, 
  RefreshCw,
  Eye,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Code,
  MapPin,
  Clock
} from 'lucide-react';
import { Product, Order, OrderStatus, ProductCategory, ProductSize, ProductGalleryItem, PaymentMethodConfig } from '../types';
import { GOOGLE_APPS_SCRIPT_SOURCE } from '../services/googleAppsScriptCode';
import { ProductImageManager, GALLERY_PRESETS } from './ProductImageManager';
import { PaymentMethodManager } from './PaymentMethodManager';
import { INITIAL_PAYMENT_METHODS } from '../data/initialData';

export const AdminDashboard: React.FC = () => {
  const { 
    currentAdmin, 
    logoutAdmin, 
    products, 
    orders, 
    settings, 
    emailLogs, 
    updateOrderStatus, 
    addNewProduct, 
    updateProduct, 
    deleteProduct, 
    updateSettings, 
    syncWithGoogleSheets, 
    addToast,
    openModal
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'sheets' | 'emails' | 'settings'>('overview');
  
  // Orders filter & search
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | OrderStatus>('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);

  // Products state & modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // New/Edit product form fields
  const [pTitle, setPTitle] = useState('');
  const [pCategory, setPCategory] = useState<ProductCategory>('Apparel');
  const [pPrice, setPPrice] = useState('550');
  const [pXxlPrice, setPXxlPrice] = useState('580');
  const [pColor, setPColor] = useState('Lavender');
  const [pCapacity, setPCapacity] = useState('');
  const [pDimensions, setPDimensions] = useState('');
  const [pMaterial, setPMaterial] = useState('');
  const [pImageUrl, setPImageUrl] = useState('');
  const [pGalleryImages, setPGalleryImages] = useState<ProductGalleryItem[]>([]);
  const [pDescription, setPDescription] = useState('');
  const [pHasSizes, setPHasSizes] = useState(true);

  // Settings form fields
  const [gasUrl, setGasUrl] = useState(settings.appsScriptUrl);
  const [sheetName, setSheetName] = useState(settings.sheetName);
  const [preorderDeadline, setPreorderDeadline] = useState(settings.preorderCloseDate);
  const [pickupDate, setPickupDate] = useState(settings.pickupDate);
  const [pickupLocation, setPickupLocation] = useState(settings.pickupLocation);
  const [paymentMethodsList, setPaymentMethodsList] = useState<PaymentMethodConfig[]>(
    settings.paymentMethods && settings.paymentMethods.length > 0
      ? settings.paymentMethods
      : INITIAL_PAYMENT_METHODS
  );
  const [copiedScript, setCopiedScript] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Metrics Calculations
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const paidOrders = orders.filter(o => o.status === 'Paid' || o.status === 'Ready For Pickup' || o.status === 'Claimed');
    const pendingOrders = orders.filter(o => o.status === 'Pending Payment' || o.status === 'Under Verification');
    const grossRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingRevenue = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Size Breakdown for T-Shirts
    const sizeCounts: Record<string, number> = {
      TS: 0,
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0
    };

    orders.forEach(order => {
      if (order.status !== 'Cancelled') {
        order.items.forEach(item => {
          if (item.variant?.size && sizeCounts[item.variant.size] !== undefined) {
            sizeCounts[item.variant.size] += item.quantity;
          }
        });
      }
    });

    const totalShirts = Object.values(sizeCounts).reduce((a, b) => a + b, 0);

    return {
      totalOrders,
      paidOrdersCount: paidOrders.length,
      pendingOrdersCount: pendingOrders.length,
      grossRevenue,
      pendingRevenue,
      sizeCounts,
      totalShirts
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
      const matchSearch = 
        o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.confirmationNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.paymentReferenceNumber && o.paymentReferenceNumber.toLowerCase().includes(orderSearch.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  const handleCopyGasCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SOURCE);
    setCopiedScript(true);
    addToast('success', 'Google Apps Script Copied', 'Paste this code into script.google.com for your APMERCH_DATABASE Sheet.');
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      appsScriptUrl: gasUrl,
      sheetName,
      preorderCloseDate: preorderDeadline,
      pickupDate,
      pickupLocation,
      paymentMethods: paymentMethodsList,
      gcashAccountName: paymentMethodsList[0]?.accountName || 'Mae Joey Balla',
      gcashNumber: paymentMethodsList[0]?.accountNumber || '09203963249',
      gcashQrUrl: paymentMethodsList[0]?.qrCodeUrl,
      maribankAccountName: paymentMethodsList.find(p => p.name.toLowerCase().includes('mari'))?.accountName || paymentMethodsList[1]?.accountName || 'Mae Joey Balla',
      maribankNumber: paymentMethodsList.find(p => p.name.toLowerCase().includes('mari'))?.accountNumber || paymentMethodsList[1]?.accountNumber || '09203963249',
      maribankQrUrl: paymentMethodsList.find(p => p.name.toLowerCase().includes('mari'))?.qrCodeUrl
    });
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncWithGoogleSheets();
    setIsSyncing(false);
  };

  const handleOpenAddProduct = (presetCat: ProductCategory = 'Apparel') => {
    setEditingProduct(null);
    setPTitle('');
    setPCategory(presetCat);
    setPPrice('550');
    setPXxlPrice('580');
    setPColor('Lavender');
    setPCapacity('');
    setPDimensions('');
    setPMaterial('Polydex / 100% Combed Cotton');
    
    // Default gallery images based on category preset
    const defaultGallery: ProductGalleryItem[] = [
      { label: 'Front Mockup', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80' },
      { label: 'Back Mockup', url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80' },
      { label: 'Actual Shirt', url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80' },
      { label: 'Size Chart', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80' }
    ];

    setPGalleryImages(defaultGallery);
    setPImageUrl(defaultGallery[0].url);
    setPDescription('');
    setPHasSizes(true);
    setShowAddProductModal(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setPTitle(p.title);
    setPCategory(p.category);
    setPPrice(String(p.price || p.basePrice || 0));
    setPXxlPrice(String(p.xxlPrice || ''));
    setPColor(p.color || '');
    setPCapacity(p.capacity || '');
    setPDimensions(p.dimensions || '');
    setPMaterial(p.material || '');
    
    const existingGallery: ProductGalleryItem[] = (p.galleryImages && p.galleryImages.length > 0)
      ? p.galleryImages
      : [{ label: 'Product View', url: p.imageUrl }];

    setPGalleryImages(existingGallery);
    setPImageUrl(p.imageUrl || existingGallery[0]?.url || '');
    setPDescription(p.description);
    setPHasSizes(Boolean(p.sizes && p.sizes.length > 0));
    setShowAddProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const sizes: ProductSize[] | undefined = pHasSizes ? ['TS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'] : undefined;
    const finalCover = pImageUrl || pGalleryImages[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
    const finalGallery: ProductGalleryItem[] = pGalleryImages.length > 0
      ? pGalleryImages
      : [{ label: 'Product View', url: finalCover }];

    if (editingProduct) {
      await updateProduct({
        ...editingProduct,
        title: pTitle,
        category: pCategory,
        price: Number(pPrice),
        basePrice: Number(pPrice),
        xxlPrice: pXxlPrice ? Number(pXxlPrice) : undefined,
        color: pColor,
        capacity: pCapacity,
        dimensions: pDimensions,
        material: pMaterial,
        imageUrl: finalCover,
        galleryImages: finalGallery,
        description: pDescription,
        sizes
      });
    } else {
      await addNewProduct({
        title: pTitle,
        category: pCategory,
        price: Number(pPrice),
        basePrice: Number(pPrice),
        xxlPrice: pXxlPrice ? Number(pXxlPrice) : undefined,
        color: pColor,
        capacity: pCapacity,
        dimensions: pDimensions,
        material: pMaterial,
        imageUrl: finalCover,
        galleryImages: finalGallery,
        description: pDescription,
        sizes,
        sizeChart: pHasSizes ? [
          { size: 'TS', width: 17, length: 24 },
          { size: 'XS', width: 18, length: 25 },
          { size: 'S', width: 19, length: 26 },
          { size: 'M', width: 20, length: 27 },
          { size: 'L', width: 21, length: 28 },
          { size: 'XL', width: 22, length: 29 },
          { size: 'XXL', width: 23, length: 30 }
        ] : undefined
      });
    }
    setShowAddProductModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Admin Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1e1b4b] via-[#131b2e] to-[#0b0f19] border border-[#3b2b73] p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#7c5cb7]/30 border border-[#7c5cb7]/50 flex items-center justify-center text-[#e0d7f5]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Admin Command Center
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#f472b6]/20 text-[#f472b6] text-[10px] font-extrabold border border-[#f472b6]/40 uppercase">
                {currentAdmin?.role || 'Super Admin'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Logged in as: <strong className="text-slate-200">{currentAdmin?.email}</strong> • Google Sheet: <strong className="text-[#b19cd9]">APMERCH_DATABASE</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-[#131b2e] hover:bg-[#1e1b4b] border border-[#232f4b] text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Sheet'}</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-xs font-bold text-rose-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#232f4b] pb-2 overflow-x-auto scrollbar-none text-xs font-bold uppercase tracking-wider">
        {[
          { key: 'overview', label: 'Overview & Metrics', icon: TrendingUp },
          { key: 'orders', label: `Orders (${orders.length})`, icon: Package },
          { key: 'products', label: `Merch Catalog (${products.length})`, icon: ShoppingBag },
          { key: 'sheets', label: 'Google Sheets Integration', icon: FileSpreadsheet },
          { key: 'emails', label: `Email Logs (${emailLogs.length})`, icon: Mail },
          { key: 'settings', label: 'Settings', icon: SettingsIcon },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl whitespace-nowrap flex items-center gap-2 transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white shadow-md shadow-[#7c5cb7]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#131b2e]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Total Orders</span>
                <Package className="w-4 h-4 text-[#b19cd9]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {metrics.totalOrders}
              </div>
              <div className="text-[11px] text-slate-400">
                {metrics.paidOrdersCount} Paid • {metrics.pendingOrdersCount} Pending
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Verified Revenue</span>
                <CreditCard className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                ₱{metrics.grossRevenue.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">
                Paid & Verified in GCash / MariBank
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Pending Verification</span>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                ₱{metrics.pendingRevenue.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">
                {metrics.pendingOrdersCount} orders awaiting admin review
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Total T-Shirts Ordered</span>
                <ShoppingBag className="w-4 h-4 text-[#f472b6]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#f472b6] font-mono">
                {metrics.totalShirts} pcs
              </div>
              <div className="text-[11px] text-slate-400">
                Ready for batch supplier production
              </div>
            </div>
          </div>

          {/* T-Shirt Size Matrix Breakdown Table (Essential for Supplier) */}
          <div className="rounded-2xl bg-[#131b2e] border border-[#232f4b] p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232f4b] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#f472b6]" />
                  <span>T-Shirt Size Matrix & Manufacturing Counts</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Exact tally per size for supplier purchase order
                </p>
              </div>
              <div className="text-xs font-mono font-bold text-[#b19cd9] bg-[#1e1b4b] px-3 py-1 rounded-lg border border-[#3b2b73]">
                Total: {metrics.totalShirts} shirts
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(metrics.sizeCounts).map(([sz, count]) => {
                const countNum = Number(count);
                return (
                  <div key={sz} className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#232f4b] text-center space-y-1">
                    <div className="text-xs font-bold text-slate-400 uppercase">Size {sz}</div>
                    <div className="text-2xl font-black font-mono text-white">{countNum}</div>
                    <div className="text-[10px] text-[#f472b6]">
                      {metrics.totalShirts > 0 ? Math.round((countNum / metrics.totalShirts) * 100) : 0}% of batch
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#131b2e] p-4 rounded-2xl border border-[#232f4b]">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                placeholder="Search Order #, Conf #, Customer, Ref #..."
                className="w-full pl-10 pr-4 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#7c5cb7]"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              {(['All', 'Pending Payment', 'Under Verification', 'Paid', 'Ready For Pickup', 'Claimed', 'Cancelled'] as ('All' | OrderStatus)[]).map(st => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    orderStatusFilter === st
                      ? 'bg-[#7c5cb7] text-white shadow-sm'
                      : 'bg-[#0b0f19] text-slate-400 border border-[#232f4b] hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-2xl bg-[#131b2e] border border-[#232f4b] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-[#0b0f19] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-[#232f4b]">
                  <tr>
                    <th className="px-4 py-3.5">Order ID & Date</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Items & Sizes</th>
                    <th className="px-4 py-3.5">Total & Payment</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232f4b]/60">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-[#1e1b4b]/30 transition-colors">
                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="font-mono font-black text-white">{order.orderNumber}</div>
                        <div className="font-mono text-[10px] text-[#b19cd9]">Conf: {order.confirmationNumber}</div>
                        <div className="text-[10px] text-slate-500">{order.createdAt.split('T')[0]}</div>
                      </td>

                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="font-bold text-white">{order.customerName}</div>
                        <div className="text-[11px] text-slate-400">{order.customerEmail}</div>
                        <div className="text-[10px] text-slate-500">{order.customerMobile}</div>
                      </td>

                      <td className="px-4 py-3.5 space-y-1">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-bold text-[#f472b6]">{it.quantity}x</span> {it.productTitle}
                            {it.variant?.size && (
                              <span className="ml-1 px-1.5 py-0.2 rounded bg-[#0b0f19] border border-[#232f4b] text-[10px] font-bold text-white">
                                {it.variant.size}
                              </span>
                            )}
                          </div>
                        ))}
                      </td>

                      <td className="px-4 py-3.5 space-y-1">
                        <div className="font-black text-[#f472b6] font-mono text-sm">
                          ₱{order.totalAmount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {order.paymentMethod} • Ref: <span className="font-mono text-slate-200">{order.paymentReferenceNumber || 'N/A'}</span>
                        </div>
                        {order.paymentProofUrl && (
                          <button
                            onClick={() => setSelectedProofOrder(order)}
                            className="text-[10px] text-[#b19cd9] hover:underline font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> View Receipt
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <select
                          value={order.status}
                          onChange={e => updateOrderStatus(order.orderNumber, e.target.value as OrderStatus)}
                          className="px-2.5 py-1 rounded-lg bg-[#0b0f19] border border-[#232f4b] text-xs font-bold text-white focus:outline-none focus:border-[#7c5cb7]"
                        >
                          <option value="Pending Payment">Pending Payment</option>
                          <option value="Under Verification">Under Verification</option>
                          <option value="Paid">Paid (Verified)</option>
                          <option value="Ready For Pickup">Ready For Pickup</option>
                          <option value="Claimed">Claimed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => openModal('e-ticket', { order })}
                          className="px-2.5 py-1 rounded-lg bg-[#1e1b4b] hover:bg-[#2d1b69] border border-[#3b2b73] text-[11px] font-bold text-[#e0d7f5]"
                        >
                          Ticket
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#131b2e] p-4 rounded-2xl border border-[#232f4b]">
            <div>
              <h3 className="text-base font-bold text-white">Merchandise Catalog</h3>
              <p className="text-xs text-slate-400">
                Admin can add new products directly to the Google Sheet without code modifications
              </p>
            </div>
            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map(p => {
              const gallery = (p.galleryImages && p.galleryImages.length > 0)
                ? p.galleryImages
                : [{ label: 'Product View', url: p.imageUrl }];
              const coverUrl = p.imageUrl || gallery[0]?.url;

              return (
                <div key={p.id} className="p-4 rounded-2xl bg-[#131b2e] border border-[#232f4b] hover:border-[#7c5cb7]/60 transition-all space-y-3 flex flex-col justify-between shadow-lg">
                  <div className="space-y-2.5">
                    {/* Image Stage & Gallery Badge */}
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-[#232f4b] group">
                      <img src={coverUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#0b0f19]/80 backdrop-blur-sm text-[#b19cd9] border border-[#7c5cb7]/40 shadow-sm">
                          {p.category}
                        </span>
                      </div>

                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e1b4b]/90 backdrop-blur-sm text-white border border-[#3b2b73] shadow-sm flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#f472b6]" />
                          <span>{gallery.length} {gallery.length === 1 ? 'photo' : 'photos'}</span>
                        </span>
                      </div>

                      {/* Mini Thumbnail Strip on hover */}
                      {gallery.length > 1 && (
                        <div className="absolute bottom-2 inset-x-2 flex gap-1 justify-center bg-black/60 backdrop-blur-sm p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          {gallery.slice(0, 4).map((g, gi) => (
                            <div key={gi} className="w-7 h-7 rounded overflow-hidden border border-white/20">
                              <img src={g.url} alt={g.label} className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {gallery.length > 4 && (
                            <div className="w-7 h-7 rounded bg-[#1e1b4b] border border-white/20 flex items-center justify-center text-[9px] font-bold text-white">
                              +{gallery.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white mt-1 leading-snug">{p.title}</h4>
                      <div className="text-xs text-slate-400 line-clamp-2 mt-1">{p.description}</div>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div className="text-sm font-black text-[#f472b6]">
                        ₱{(p.price || p.basePrice || 0).toLocaleString()} PHP
                        {p.xxlPrice && <span className="text-xs text-slate-400 font-normal ml-1">(XXL: ₱{p.xxlPrice})</span>}
                      </div>

                      {p.color && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#0b0f19] text-slate-300 border border-[#232f4b]">
                          {p.color}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#232f4b] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      className="flex-1 py-1.5 rounded-lg bg-[#1e1b4b] hover:bg-[#2d1b69] border border-[#3b2b73] text-xs font-bold text-[#e0d7f5] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Manage Images & Details
                    </button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-500/40 text-xs font-bold text-rose-300 flex items-center gap-1 transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE SHEETS & BACKEND SCRIPT SETUP */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          
          <div className="p-6 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-4">
            <div className="flex items-center justify-between border-b border-[#232f4b] pb-4">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Google Sheets Database (APMERCH_DATABASE)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Direct sync with Google Apps Script Web App for single database truth.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyGasCode}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Code className="w-4 h-4" />
                <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Apps Script Code'}</span>
              </button>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-3 text-xs text-slate-300">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                Setup Instructions (3 Simple Steps):
              </h4>
              <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
                <li>
                  Create a Google Sheet named <strong>APMERCH_DATABASE</strong> in your Google Drive.
                </li>
                <li>
                  Click <strong>Extensions &gt; Apps Script</strong>, replace the default code with the copied script, and save.
                </li>
                <li>
                  Click <strong>Deploy &gt; New deployment &gt; Select type: Web App</strong>. Set <em>Execute as: Me</em> and <em>Who has access: Anyone</em>. Copy the Web App URL and paste it into the Settings tab.
                </li>
              </ol>
            </div>

            {/* 11 Tabs Architecture Specs */}
            <div className="pt-2">
              <div className="text-xs font-bold text-[#b19cd9] uppercase tracking-wider mb-2">
                Provisioned 11 Database Tabs in APMERCH_DATABASE:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                {[
                  'Customers', 'Products', 'Orders', 'OrderItems', 
                  'Payments', 'Admins', 'Settings', 'Collections', 
                  'FanProjects', 'TeamKAALLibrary', 'EmailLogs'
                ].map(tabName => (
                  <div key={tabName} className="p-2.5 rounded-lg bg-[#0b0f19] border border-[#232f4b] text-slate-200 flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{tabName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: EMAIL LOGS */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#131b2e] p-4 rounded-2xl border border-[#232f4b]">
            <div>
              <h3 className="text-base font-bold text-white">Automated Email Dispatch Logs</h3>
              <p className="text-xs text-slate-400">
                Log of order confirmations, payment approval notices, and claiming readiness reminders
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#b19cd9] bg-[#0b0f19] px-3 py-1 rounded-lg border border-[#232f4b]">
              {emailLogs.length} Dispatches Logged
            </span>
          </div>

          <div className="rounded-2xl bg-[#131b2e] border border-[#232f4b] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-[#0b0f19] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-[#232f4b]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Subject & Type</th>
                    <th className="px-4 py-3">Order Ref</th>
                    <th className="px-4 py-3">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232f4b]/60 font-mono">
                  {emailLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#1e1b4b]/20">
                      <td className="px-4 py-3 text-slate-400">{log.sentAt ? log.sentAt.replace('T', ' ').slice(0, 19) : 'Just now'}</td>
                      <td className="px-4 py-3 text-white font-sans">{log.toEmail}</td>
                      <td className="px-4 py-3 text-[#b19cd9] font-sans font-bold">{log.subject}</td>
                      <td className="px-4 py-3 text-slate-300">{log.orderNumber || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          {/* Event Configuration */}
          <div className="p-6 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-4">
            <div className="flex items-center justify-between border-b border-[#232f4b] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#b19cd9]" />
                  <span>Event & Pre-Order Schedule</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Configure pre-order cutoffs, pickup schedules, and venue information for customer tickets.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#f472b6]" />
                  <span>Pre-order Deadline (Cut-off Date)</span>
                </label>
                <input
                  type="date"
                  value={preorderDeadline}
                  onChange={e => setPreorderDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#f472b6]" />
                  <span>Event Pickup Date</span>
                </label>
                <input
                  type="text"
                  value={pickupDate}
                  onChange={e => setPickupDate(e.target.value)}
                  placeholder="October 11, 2026"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#f472b6]" />
                  <span>Pickup Venue & Booth Location</span>
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  placeholder="Cinema Panay Screen 1 Lobby (SM City Iloilo)"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Payment Methods Manager */}
          <div className="p-6 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-4">
            <PaymentMethodManager
              methods={paymentMethodsList}
              onChange={setPaymentMethodsList}
            />
          </div>

          {/* Google Sheets APMERCH_DATABASE Integration */}
          <div className="p-6 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-4">
            <div className="border-b border-[#232f4b] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>APMERCH_DATABASE Cloud Sync Settings</span>
              </h3>
              <p className="text-xs text-slate-400">
                Connected Google Apps Script Web App for real-time bidirectional syncing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">
                  Google Apps Script Web App URL
                </label>
                <input
                  type="url"
                  value={gasUrl}
                  onChange={e => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Database Sheet Name
                </label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={e => setSheetName(e.target.value)}
                  placeholder="APMERCH_DATABASE"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCopyGasCode}
                  className="w-full px-4 py-2 bg-[#1e1b4b] hover:bg-[#2d1b69] border border-[#3b2b73] rounded-xl text-xs font-bold text-[#b19cd9] flex items-center justify-center gap-2"
                >
                  <Code className="w-4 h-4" />
                  <span>{copiedScript ? 'Script Copied!' : 'Copy Apps Script Code'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 rounded-2xl bg-[#0b0f19] border border-[#232f4b] flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Changes will immediately take effect for the checkout flow and customer portal.
            </p>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold shadow-lg shadow-[#7c5cb7]/25 hover:opacity-95 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save All Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Add / Edit Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-[#0b0f19] border border-[#232f4b] rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#232f4b] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#f472b6]" />
                  <span>{editingProduct ? 'Edit Merchandise Item & Gallery' : 'Add New Merchandise Item'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure product specifications, pricing, and multi-angle high-resolution gallery images.
                </p>
              </div>
              <button 
                onClick={() => setShowAddProductModal(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
              
              {/* Product Information Section */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-[#232f4b]/80 pb-2">
                  1. Basic Details & Pricing
                </h4>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Item Title</label>
                  <input
                    type="text"
                    required
                    value={pTitle}
                    onChange={e => setPTitle(e.target.value)}
                    placeholder="e.g. A'TIN Panay Commemorative T-Shirt"
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Category</label>
                    <select
                      value={pCategory}
                      onChange={e => {
                        const newCat = e.target.value as ProductCategory;
                        setPCategory(newCat);
                      }}
                      className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                    >
                      <option value="Apparel">Apparel</option>
                      <option value="Drinkware">Drinkware</option>
                      <option value="Merchandise">Merchandise</option>
                      <option value="Collections">Collections</option>
                      <option value="Fan Projects">Fan Projects</option>
                      <option value="Digital Products">Digital Products</option>
                      <option value="Team KAAL Publications">Team KAAL Publications</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Base Price (PHP)</label>
                    <input
                      type="number"
                      required
                      value={pPrice}
                      onChange={e => setPPrice(e.target.value)}
                      placeholder="550"
                      className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                    />
                  </div>
                </div>

                {pCategory === 'Apparel' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">XXL Special Price (PHP)</label>
                      <input
                        type="number"
                        value={pXxlPrice}
                        onChange={e => setPXxlPrice(e.target.value)}
                        placeholder="580"
                        className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Colorway</label>
                      <input
                        type="text"
                        value={pColor}
                        onChange={e => setPColor(e.target.value)}
                        placeholder="Lavender"
                        className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Capacity / Dimensions</label>
                    <input
                      type="text"
                      value={pCapacity || pDimensions}
                      onChange={e => { setPCapacity(e.target.value); setPDimensions(e.target.value); }}
                      placeholder="1200ml or 55cm x 55cm"
                      className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Material</label>
                    <input
                      type="text"
                      value={pMaterial}
                      onChange={e => setPMaterial(e.target.value)}
                      placeholder="Polydex / Stainless Steel"
                      className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={pDescription}
                    onChange={e => setPDescription(e.target.value)}
                    placeholder="Product description and highlights..."
                    className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="hasSizes"
                    checked={pHasSizes}
                    onChange={e => setPHasSizes(e.target.checked)}
                    className="rounded border-slate-700 text-[#7c5cb7]"
                  />
                  <label htmlFor="hasSizes" className="text-slate-300 font-medium">
                    Include TS to XXL Sizing Matrix (TS, XS, S, M, L, XL, XXL)
                  </label>
                </div>
              </div>

              {/* Product Image & Gallery Management */}
              <div className="pt-3 border-t border-[#232f4b]">
                <ProductImageManager
                  galleryImages={pGalleryImages}
                  coverImageUrl={pImageUrl}
                  category={pCategory}
                  onChange={(newImages, newCover) => {
                    setPGalleryImages(newImages);
                    setPImageUrl(newCover);
                  }}
                />
              </div>

              {/* Submit / Cancel Footer */}
              <div className="pt-4 border-t border-[#232f4b] flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  {pGalleryImages.length} gallery {pGalleryImages.length === 1 ? 'image' : 'images'} will be saved to Google Sheet.
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity"
                  >
                    {editingProduct ? 'Save Product Changes' : 'Create Merchandise Item'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Proof View Modal */}
      {selectedProofOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0b0f19] border border-[#232f4b] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#232f4b] pb-3">
              <h3 className="text-sm font-bold text-white">
                Payment Proof • {selectedProofOrder.orderNumber}
              </h3>
              <button onClick={() => setSelectedProofOrder(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Sender:</span>
                <span className="font-bold text-white">{selectedProofOrder.paymentSenderName || selectedProofOrder.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Reference #:</span>
                <span className="font-mono text-[#f472b6] font-bold">{selectedProofOrder.paymentReferenceNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Amount:</span>
                <span className="font-bold text-emerald-400 font-mono">₱{selectedProofOrder.totalAmount} PHP</span>
              </div>
            </div>

            {selectedProofOrder.paymentProofUrl ? (
              <div className="rounded-xl overflow-hidden border border-[#232f4b] bg-black max-h-80 flex items-center justify-center">
                <img
                  src={selectedProofOrder.paymentProofUrl}
                  alt="Payment proof screenshot"
                  className="max-h-80 object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">No image uploaded</div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  updateOrderStatus(selectedProofOrder.orderNumber, 'Paid');
                  setSelectedProofOrder(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
              >
                Approve Payment (Mark Paid)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
