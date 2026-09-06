import React, { useState, useMemo, useEffect } from 'react';
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
  Clock,
  Heart,
  BookOpen,
  RotateCcw,
  Folder,
  Image as ImageIcon
} from 'lucide-react';
import { Product, Order, OrderStatus, ProductCategory, ProductSize, ProductGalleryItem, PaymentMethodConfig } from '../types';
import { GOOGLE_APPS_SCRIPT_SOURCE } from '../services/googleAppsScriptCode';
import { googleSheetsApi } from '../services/googleSheetsApi';
import { ProductImageManager, GALLERY_PRESETS } from './ProductImageManager';
import { PaymentMethodManager } from './PaymentMethodManager';
import { INITIAL_PAYMENT_METHODS } from '../data/initialData';
import { AdminCollectionsTab } from './admin/AdminCollectionsTab';
import { AdminFanProjectsTab } from './admin/AdminFanProjectsTab';
import { AdminLibraryTab } from './admin/AdminLibraryTab';
import { AdminOrderModal } from './admin/AdminOrderModal';
import { AdminOrderDeleteModal } from './admin/AdminOrderDeleteModal';
import { ImageUploadField } from './ImageUploadField';
import { LockInModal } from './LockInModal';

export const AdminDashboard: React.FC = () => {
  const { 
    currentAdmin, 
    logoutAdmin, 
    products, 
    orders, 
    settings, 
    emailLogs, 
    collections,
    fanProjects,
    teamKaalItems,
    updateOrderStatus, 
    addAdminOrder,
    updateOrder,
    deleteOrder,
    addNewProduct, 
    updateProduct, 
    deleteProduct, 
    resetProductToDefault,
    saveCollection,
    deleteCollection,
    saveFanProject,
    deleteFanProject,
    saveLibraryItem,
    deleteLibraryItem,
    updateSettings, 
    syncWithGoogleSheets, 
    addToast,
    openModal
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'products' | 'collections' | 'fanprojects' | 'library' | 'sheets' | 'emails' | 'settings'
  >('overview');
  
  // Orders filter & search
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | OrderStatus>('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);

  // Order CRUD modals
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  // Products state & modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductLockModal, setShowProductLockModal] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  
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
  const [preorderOpenDate, setPreorderOpenDate] = useState(settings.preorderOpenDate || '2026-09-01T00:00:00+08:00');
  const [preorderWindowText, setPreorderWindowText] = useState(settings.preorderWindowText || 'Sept 1 – Sept 20, 2026');
  const [preorderStatusManual, setPreorderStatusManual] = useState<'auto' | 'open' | 'closed'>(settings.preorderStatusManual || 'auto');
  const [preorderOpenDescription, setPreorderOpenDescription] = useState(settings.preorderOpenDescription || "Lock in your exclusive A'TIN Panay x Team KAAL BlockScreening merchandise before slots close on September 20, 2026 at 11:59 PM PHT.");
  const [preorderClosedDescription, setPreorderClosedDescription] = useState(settings.preorderClosedDescription || 'All slots for this production batch are officially sealed. Orders are now in queue for production and October 11, 2026 claiming.');
  const [pickupDate, setPickupDate] = useState(settings.pickupDate || 'October 11, 2026');
  const [pickupLocation, setPickupLocation] = useState(settings.pickupLocation || 'Cinema Panay Screen 1 Lobby (SM City Iloilo)');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [teamKaalLogoUrl, setTeamKaalLogoUrl] = useState(settings.teamKaalLogoUrl || '');
  const [homepageHeroImageUrl, setHomepageHeroImageUrl] = useState(settings.homepageHeroImageUrl || '');
  const [homepageTagline, setHomepageTagline] = useState(settings.homepageTagline || "Official Panay Merch Capsule & Team KAAL Corner");
  const [homepageHeroTitle, setHomepageHeroTitle] = useState(settings.homepageHeroTitle || "A'TIN Panay Community Hub");
  const [homepageDescription, setHomepageDescription] = useState(settings.homepageDescription || "Official merchandise, fan projects, collections, stories and community updates for A'TIN Panay.");
  const [headerBrandName, setHeaderBrandName] = useState(settings.headerBrandName || "A'TIN PANAY");
  const [headerSubtitle, setHeaderSubtitle] = useState(settings.headerSubtitle || "Community Hub & Exclusive Merch");
  const [headerBadgeText, setHeaderBadgeText] = useState(settings.headerBadgeText || "x KAAL");
  const [capsuleBrandName, setCapsuleBrandName] = useState(settings.capsuleBrandName || "A'TIN Panay");
  const [capsuleSubtitle, setCapsuleSubtitle] = useState(settings.capsuleSubtitle || "Official Merch Capsule");
  const [capsuleBadgeText, setCapsuleBadgeText] = useState(settings.capsuleBadgeText || "EXCLUSIVE BATCH");
  const [capsuleFlagshipBadgeText, setCapsuleFlagshipBadgeText] = useState(settings.capsuleFlagshipBadgeText || "Flagship Drop");
  const [capsuleFeaturedTitle, setCapsuleFeaturedTitle] = useState(settings.capsuleFeaturedTitle || "BlockScreening T-Shirt (Lavender)");
  const [capsuleFeaturedSubtitle, setCapsuleFeaturedSubtitle] = useState(settings.capsuleFeaturedSubtitle || "Premium Cotton • Sizes TS to XXL");
  const [capsuleFeaturedPriceText, setCapsuleFeaturedPriceText] = useState(settings.capsuleFeaturedPriceText || "₱550 - ₱580");
  const [capsulePartnershipText, setCapsulePartnershipText] = useState(settings.capsulePartnershipText || "In partnership with Team KAAL");
  const [capsuleFanKitButtonText, setCapsuleFanKitButtonText] = useState(settings.capsuleFanKitButtonText || "View Fan Kit");
  const [adminContactEmail, setAdminContactEmail] = useState(settings.adminContactEmail || 'admin@atinpanay.com');
  const [paymentMethodsList, setPaymentMethodsList] = useState<PaymentMethodConfig[]>(() => {
    let list: any = settings.paymentMethods;
    if (typeof list === 'string') {
      try { list = JSON.parse(list); } catch { list = null; }
    }
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
    return INITIAL_PAYMENT_METHODS;
  });

  // Keep settings states in sync if updated from cloud sync (only when not editing settings tab)
  useEffect(() => {
    if (settings && activeTab !== 'settings') {
      if (settings.appsScriptUrl) setGasUrl(settings.appsScriptUrl);
      if (settings.sheetName) setSheetName(settings.sheetName);
      if (settings.preorderCloseDate) setPreorderDeadline(settings.preorderCloseDate);
      if (settings.preorderOpenDate) setPreorderOpenDate(settings.preorderOpenDate);
      if (settings.preorderWindowText) setPreorderWindowText(settings.preorderWindowText);
      if (settings.preorderStatusManual) setPreorderStatusManual(settings.preorderStatusManual);
      if (settings.preorderOpenDescription) setPreorderOpenDescription(settings.preorderOpenDescription);
      if (settings.preorderClosedDescription) setPreorderClosedDescription(settings.preorderClosedDescription);
      if (settings.pickupDate) setPickupDate(settings.pickupDate);
      if (settings.pickupLocation) setPickupLocation(settings.pickupLocation);
      if (settings.logoUrl !== undefined) setLogoUrl(settings.logoUrl || '');
      if (settings.teamKaalLogoUrl !== undefined) setTeamKaalLogoUrl(settings.teamKaalLogoUrl || '');
      if (settings.homepageHeroImageUrl !== undefined) setHomepageHeroImageUrl(settings.homepageHeroImageUrl || '');
      if (settings.homepageTagline !== undefined) setHomepageTagline(settings.homepageTagline || '');
      if (settings.homepageHeroTitle !== undefined) setHomepageHeroTitle(settings.homepageHeroTitle || '');
      if (settings.homepageDescription !== undefined) setHomepageDescription(settings.homepageDescription || '');
      if (settings.headerBrandName !== undefined) setHeaderBrandName(settings.headerBrandName || '');
      if (settings.headerSubtitle !== undefined) setHeaderSubtitle(settings.headerSubtitle || '');
      if (settings.headerBadgeText !== undefined) setHeaderBadgeText(settings.headerBadgeText || '');
      if (settings.capsuleBrandName !== undefined) setCapsuleBrandName(settings.capsuleBrandName || '');
      if (settings.capsuleSubtitle !== undefined) setCapsuleSubtitle(settings.capsuleSubtitle || '');
      if (settings.capsuleBadgeText !== undefined) setCapsuleBadgeText(settings.capsuleBadgeText || '');
      if (settings.capsuleFlagshipBadgeText !== undefined) setCapsuleFlagshipBadgeText(settings.capsuleFlagshipBadgeText || '');
      if (settings.capsuleFeaturedTitle !== undefined) setCapsuleFeaturedTitle(settings.capsuleFeaturedTitle || '');
      if (settings.capsuleFeaturedSubtitle !== undefined) setCapsuleFeaturedSubtitle(settings.capsuleFeaturedSubtitle || '');
      if (settings.capsuleFeaturedPriceText !== undefined) setCapsuleFeaturedPriceText(settings.capsuleFeaturedPriceText || '');
      if (settings.capsulePartnershipText !== undefined) setCapsulePartnershipText(settings.capsulePartnershipText || '');
      if (settings.capsuleFanKitButtonText !== undefined) setCapsuleFanKitButtonText(settings.capsuleFanKitButtonText || '');
      if (settings.adminContactEmail) setAdminContactEmail(settings.adminContactEmail);
    }
  }, [settings, activeTab]);

  // Keep paymentMethodsList in sync if settings updates from cloud sync
  useEffect(() => {
    if (settings.paymentMethods) {
      let list: any = settings.paymentMethods;
      if (typeof list === 'string') {
        try { list = JSON.parse(list); } catch { list = null; }
      }
      if (Array.isArray(list) && list.length > 0) {
        setPaymentMethodsList(list);
      }
    }
  }, [settings.paymentMethods]);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSettingsLockModal, setShowSettingsLockModal] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTestingGas, setIsTestingGas] = useState(false);
  const [gasTestStatus, setGasTestStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    sheetTitle?: string;
    supportsUploadImage?: boolean;
    durationMs?: number;
  } | null>(null);

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

  const handleTestGasConnection = async () => {
    setIsTestingGas(true);
    setGasTestStatus(null);
    try {
      const res = await googleSheetsApi.testConnection();
      setGasTestStatus({
        tested: true,
        success: res.success,
        message: res.message,
        sheetTitle: res.sheetTitle,
        supportsUploadImage: res.supportsUploadImage,
        durationMs: res.durationMs
      });
      if (res.success) {
        if (res.supportsUploadImage) {
          addToast('success', 'Backend Connected', `Connected to "${res.sheetTitle || 'APMERCH_DATABASE'}" in ${res.durationMs}ms with Drive image upload enabled.`);
        } else {
          addToast('info', 'Backend Connected (Update Available)', `Connected to "${res.sheetTitle || 'APMERCH_DATABASE'}" in ${res.durationMs}ms. Redeploy Apps Script to enable direct Google Drive folder uploads.`);
        }
      } else {
        addToast('error', 'Connection Failed', res.message || 'Unable to connect to Google Apps Script. Please check your Web App URL and permissions.');
      }
    } catch (err: any) {
      setGasTestStatus({
        tested: true,
        success: false,
        message: err?.message || 'Connection test failed',
        durationMs: 0
      });
      addToast('error', 'Connection Test Failed', err?.message || 'Check Web App URL.');
    } finally {
      setIsTestingGas(false);
    }
  };

  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setShowSettingsLockModal(true);
  };

  const handleConfirmLockSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateSettings({
        appsScriptUrl: gasUrl,
        sheetName,
        preorderCloseDate: preorderDeadline,
        preorderOpenDate,
        preorderWindowText,
        preorderStatusManual,
        preorderOpenDescription,
        preorderClosedDescription,
        pickupDate,
        pickupLocation,
        logoUrl,
        teamKaalLogoUrl,
        homepageHeroImageUrl,
        homepageHeroTitle,
        homepageTagline,
        homepageDescription,
        headerBrandName,
        headerSubtitle,
        headerBadgeText,
        capsuleBrandName,
        capsuleSubtitle,
        capsuleBadgeText,
        capsuleFlagshipBadgeText,
        capsuleFeaturedTitle,
        capsuleFeaturedSubtitle,
        capsuleFeaturedPriceText,
        capsulePartnershipText,
        capsuleFanKitButtonText,
        adminContactEmail,
        paymentMethods: paymentMethodsList,
        gcashAccountName: paymentMethodsList[0]?.accountName || 'Mae Joey Balla',
        gcashNumber: paymentMethodsList[0]?.accountNumber || '09203963249',
        gcashQrUrl: paymentMethodsList[0]?.qrCodeUrl,
        maribankAccountName: paymentMethodsList.find(p => p.name.toLowerCase().includes('mari'))?.accountName || paymentMethodsList[1]?.accountName || 'Mae Joey Balla',
        maribankNumber: paymentMethodsList.find(p => p.name.toLowerCase().includes('mari'))?.accountNumber || paymentMethodsList[1]?.accountNumber || '09203963249',
        maribankQrUrl: paymentMethodsList.find(p => p.name.toLowerCase().includes('mari'))?.qrCodeUrl
      });
      setShowSettingsLockModal(false);
      addToast('success', 'Settings Locked In', 'All header branding, merch capsule texts, logos, and schedule settings are permanently locked in.');
    } catch (err: any) {
      console.error('Failed to lock in settings:', err);
      alert(err.message || 'Failed to lock in settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncWithGoogleSheets();
    setIsSyncing(false);
  };

  const handleOpenAddProduct = (presetCat?: ProductCategory | any) => {
    const safeCat: ProductCategory = (typeof presetCat === 'string' && ['Apparel', 'Drinkware', 'Merchandise', 'Collections', 'Fan Projects', 'Digital Products', 'Team KAAL Publications'].includes(presetCat))
      ? (presetCat as ProductCategory)
      : 'Apparel';

    setEditingProduct(null);
    setPTitle('');
    setPCategory(safeCat);
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
    setPTitle(p.title || '');
    setPCategory(p.category || 'Apparel');
    setPPrice(String(p.price || p.basePrice || 0));
    setPXxlPrice(String(p.xxlPrice || ''));
    setPColor(p.color || '');
    setPCapacity(p.capacity || '');
    setPDimensions(p.dimensions || '');
    setPMaterial(p.material || '');
    
    const existingGallery: ProductGalleryItem[] = (Array.isArray(p.galleryImages) && p.galleryImages.length > 0)
      ? p.galleryImages
          .filter(Boolean)
          .map((item: any, idx: number) => typeof item === 'string' ? { label: `Photo #${idx + 1}`, url: item } : { label: item?.label || `Photo #${idx + 1}`, url: item?.url || '' })
          .filter(item => Boolean(item.url))
      : (p.imageUrl ? [{ label: 'Product View', url: p.imageUrl }] : []);

    setPGalleryImages(existingGallery);
    setPImageUrl(p.imageUrl || existingGallery[0]?.url || '');
    setPDescription(p.description || '');
    setPHasSizes(Boolean(p.sizes && p.sizes.length > 0));
    setShowAddProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle.trim()) {
      alert('Please enter a product title.');
      return;
    }
    setShowProductLockModal(true);
  };

  const handleConfirmLockProduct = async () => {
    setIsSavingProduct(true);
    try {
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
      setShowProductLockModal(false);
      setShowAddProductModal(false);
      addToast('success', 'Product Locked In', `"${pTitle}" is locked in and will not revert.`);
    } catch (err: any) {
      console.error('Failed to lock in product:', err);
      alert(err.message || 'Failed to save product.');
    } finally {
      setIsSavingProduct(false);
    }
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
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 mt-1">
              <span>Logged in as: <strong className="text-slate-200">{currentAdmin?.email}</strong></span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <span>Google Sheet:</span>
                <span className="inline-flex items-center gap-1 font-mono text-[#b19cd9] font-bold bg-[#0b0f19] px-2 py-0.5 rounded-lg border border-[#232f4b] text-[11px]">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  {settings.sheetName || 'APMERCH_DATABASE'}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'settings'
                ? 'bg-[#7c5cb7] border-[#9381ff] text-white shadow-md shadow-[#7c5cb7]/30'
                : 'bg-[#131b2e] hover:bg-[#1e1b4b] border-[#232f4b] text-[#b19cd9]'
            }`}
            title="Configure header branding, capsule texts, logos and schedule"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>⚙️ Settings &amp; Branding</span>
          </button>

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

      {/* Mobile Tab Select Dropdown (Ensures Settings is instantly accessible on mobile) */}
      <div className="md:hidden">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Active Section:
        </label>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as any)}
          className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#7c5cb7]/60 rounded-xl text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#9381ff]"
        >
          <option value="overview">📊 Overview &amp; Metrics</option>
          <option value="orders">📦 Orders ({orders.length})</option>
          <option value="products">🛍️ Official Merch Capsule ({products.length})</option>
          <option value="collections">🗂️ Exclusive Collections ({collections.length})</option>
          <option value="fanprojects">💖 Panay Community ({fanProjects.length})</option>
          <option value="library">📖 KAAL Library ({teamKaalItems.length})</option>
          <option value="sheets">📊 Google Sheets Integration</option>
          <option value="emails">✉️ Email Logs ({emailLogs.length})</option>
          <option value="settings">⚙️ Editable Settings, Logos &amp; Capsule</option>
        </select>
      </div>

      {/* Navigation Tabs (Responsive Wrap Bar with clean badges - never cuts off) */}
      <div className="hidden md:flex flex-wrap items-center gap-2 border-b border-[#232f4b] pb-3 text-xs font-bold uppercase tracking-wider">
        {[
          { key: 'overview', label: 'Overview & Metrics', icon: TrendingUp },
          { key: 'orders', label: `Orders (${orders.length})`, icon: Package },
          { key: 'products', label: `Merch Capsule (${products.length})`, icon: ShoppingBag },
          { key: 'collections', label: `Collections (${collections.length})`, icon: Layers },
          { key: 'fanprojects', label: `Panay Community (${fanProjects.length})`, icon: Heart },
          { key: 'library', label: `KAAL Library (${teamKaalItems.length})`, icon: BookOpen },
          { key: 'sheets', label: 'Google Sheets Sync', icon: FileSpreadsheet },
          { key: 'emails', label: `Email Logs (${emailLogs.length})`, icon: Mail },
          { key: 'settings', label: '⚙️ Settings & Capsule', icon: SettingsIcon },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap flex items-center gap-2 transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white shadow-md shadow-[#7c5cb7]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#131b2e] border border-transparent hover:border-[#232f4b]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
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

          {/* Quick Admin Navigation Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div 
              onClick={() => setActiveTab('settings')}
              className="p-5 rounded-2xl bg-[#131b2e] hover:bg-[#1a233b] border border-[#232f4b] hover:border-[#7c5cb7] cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#b19cd9]">Branding &amp; Capsule</span>
                <SettingsIcon className="w-5 h-5 text-[#9381ff] group-hover:rotate-45 transition-transform" />
              </div>
              <h4 className="text-sm font-black text-white">⚙️ Editable Settings &amp; Logos</h4>
              <p className="text-xs text-slate-400">
                Change header logo, brand names, capsule text badges, schedules, and lock them in permanently.
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('products')}
              className="p-5 rounded-2xl bg-[#131b2e] hover:bg-[#1a233b] border border-[#232f4b] hover:border-[#f472b6] cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#f472b6]">Inventory &amp; Merch</span>
                <ShoppingBag className="w-5 h-5 text-[#f472b6] group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="text-sm font-black text-white">🛍️ Official Merch Capsule ({products.length})</h4>
              <p className="text-xs text-slate-400">
                Add, edit prices, update gallery angles and manage sizes for all merchandise items.
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('orders')}
              className="p-5 rounded-2xl bg-[#131b2e] hover:bg-[#1a233b] border border-[#232f4b] hover:border-emerald-500 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Order Verification</span>
                <Package className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="text-sm font-black text-white">📦 Review Orders ({orders.length})</h4>
              <p className="text-xs text-slate-400">
                Verify customer GCash/bank payment receipts and mark ready for pickup.
              </p>
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

            {/* Filter & Add Order */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setShowAddOrderModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#f472b6] text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:opacity-95 transition-opacity shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Manual Order</span>
              </button>

              <div className="h-5 w-px bg-[#232f4b] mx-1 shrink-0" />

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
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No orders found matching the filter or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-[#1e1b4b]/30 transition-colors">
                        <td className="px-4 py-3.5 space-y-0.5">
                          <div className="font-mono font-black text-white">{order.id}</div>
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

                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => openModal('e-ticket', { order })}
                            className="px-2.5 py-1 rounded-lg bg-[#1e1b4b] hover:bg-[#2d1b69] border border-[#3b2b73] text-[11px] font-bold text-[#e0d7f5] transition-colors"
                            title="View E-Ticket"
                          >
                            Ticket
                          </button>
                          <button
                            onClick={() => setEditingOrder(order)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-700/50 text-[11px] font-bold text-indigo-200 transition-colors inline-flex items-center gap-1"
                            title="Edit Order Details & Items"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingOrder(order)}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-[11px] font-bold text-rose-300 transition-colors inline-flex items-center gap-1"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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
              onClick={() => handleOpenAddProduct()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map(p => {
              const rawGallery = Array.isArray(p.galleryImages) && p.galleryImages.length > 0
                ? p.galleryImages
                : (p.imageUrl ? [{ label: 'Product View', url: p.imageUrl }] : []);

              const gallery: ProductGalleryItem[] = rawGallery
                .filter(Boolean)
                .map((item: any, idx: number) => typeof item === 'string' ? { label: `Photo #${idx + 1}`, url: item } : { label: item?.label || `Photo #${idx + 1}`, url: item?.url || '' })
                .filter(item => Boolean(item.url));

              const coverUrl = p.imageUrl || gallery[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';

              return (
                <div key={p.id} className="p-4 rounded-2xl bg-[#131b2e] border border-[#232f4b] hover:border-[#7c5cb7]/60 transition-all space-y-3 flex flex-col justify-between shadow-lg">
                  <div className="space-y-2.5">
                    {/* Image Stage & Gallery Badge */}
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-[#232f4b] group">
                      <img src={coverUrl} alt={p.title || 'Product'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      
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
                              <img src={g.url || coverUrl} alt={g.label || 'Product thumbnail'} className="w-full h-full object-cover" />
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
                      onClick={() => {
                        if (confirm(`Reset "${p.title}" to its original default preset template? Any uploaded photo or custom edits will be restored to default.`)) {
                          resetProductToDefault(p.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center gap-1 transition-colors"
                      title="Reset to Default Preset"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete product "${p.title}" from APMERCH_DATABASE?`)) {
                          deleteProduct(p.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-500/40 text-xs font-bold text-rose-300 flex items-center gap-1 transition-colors"
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

      {/* EXCLUSIVE COLLECTIONS TAB */}
      {activeTab === 'collections' && (
        <AdminCollectionsTab
          collections={collections}
          onSave={saveCollection}
          onDelete={deleteCollection}
        />
      )}

      {/* PANAY COMMUNITY & FAN PROJECTS TAB */}
      {activeTab === 'fanprojects' && (
        <AdminFanProjectsTab
          fanProjects={fanProjects}
          onSave={saveFanProject}
          onDelete={deleteFanProject}
        />
      )}

      {/* TEAM KAAL LIBRARY CORNER TAB */}
      {activeTab === 'library' && (
        <AdminLibraryTab
          items={teamKaalItems}
          onSave={saveLibraryItem}
          onDelete={deleteLibraryItem}
        />
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
        <div className="space-y-6 max-w-4xl">
          {/* Event & Pre-Order Schedule Configuration */}
          <div className="p-6 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-4">
            <div className="flex items-center justify-between border-b border-[#232f4b] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#b19cd9]" />
                  <span>Event & Pre-Order Schedule</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Configure the pre-order timeline, live countdown deadlines, status overrides, descriptions, and venue information.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Pre-Order Status Mode */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#f472b6]" />
                  <span>Pre-Order Window Status Mode</span>
                </label>
                <select
                  value={preorderStatusManual}
                  onChange={e => setPreorderStatusManual(e.target.value as 'auto' | 'open' | 'closed')}
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white font-semibold focus:outline-none focus:border-[#7c5cb7]"
                >
                  <option value="auto">Automatic (Live countdown based on deadline cutoff date)</option>
                  <option value="open">Force OPEN (Pre-order window open and active)</option>
                  <option value="closed">Force CLOSED (Pre-order window sealed / in production queue)</option>
                </select>
              </div>

              {/* Pre-order Window Display Text */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#f472b6]" />
                  <span>Pre-Order Window Display Text</span>
                </label>
                <input
                  type="text"
                  value={preorderWindowText}
                  onChange={e => setPreorderWindowText(e.target.value)}
                  placeholder="Sept 1 – Sept 20, 2026"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Shown on countdown badges, header banners, and order confirmation.
                </span>
              </div>

              {/* Pre-order Deadline */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#f472b6]" />
                  <span>Pre-order Cut-off Deadline (Date &amp; Time)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={preorderDeadline}
                    onChange={e => setPreorderDeadline(e.target.value)}
                    placeholder="2026-09-20T23:59:59+08:00"
                    className="flex-1 px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white font-mono focus:outline-none focus:border-[#7c5cb7]"
                  />
                  <input
                    type="date"
                    onChange={e => {
                      if (e.target.value) {
                        setPreorderDeadline(`${e.target.value}T23:59:59+08:00`);
                      }
                    }}
                    className="px-2 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-slate-400 cursor-pointer text-xs"
                    title="Pick Date"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  ISO format e.g. <code className="text-[#b19cd9]">2026-09-20T23:59:59+08:00</code> or pick from calendar.
                </span>
              </div>

              {/* Pre-order Start Date */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#f472b6]" />
                  <span>Pre-order Start Date (Optional)</span>
                </label>
                <input
                  type="text"
                  value={preorderOpenDate}
                  onChange={e => setPreorderOpenDate(e.target.value)}
                  placeholder="2026-09-01T00:00:00+08:00"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white font-mono focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              {/* Event Pickup Date */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#f472b6]" />
                  <span>Event Claiming / Pickup Date</span>
                </label>
                <input
                  type="text"
                  value={pickupDate}
                  onChange={e => setPickupDate(e.target.value)}
                  placeholder="October 11, 2026"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              {/* Pickup Venue & Booth Location */}
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

              {/* Pre-order Open Description */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">
                  Announcement Description (When Pre-Order is Open)
                </label>
                <textarea
                  rows={2}
                  value={preorderOpenDescription}
                  onChange={e => setPreorderOpenDescription(e.target.value)}
                  placeholder="Lock in your exclusive A'TIN Panay x Team KAAL BlockScreening merchandise before slots close..."
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              {/* Pre-order Closed Description */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">
                  Announcement Description (When Pre-Order is Closed)
                </label>
                <textarea
                  rows={2}
                  value={preorderClosedDescription}
                  onChange={e => setPreorderClosedDescription(e.target.value)}
                  placeholder="All slots for this production batch are officially sealed. Orders are now in queue for production and claiming."
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

          {/* Official Header Branding & Logos */}
          <div className="p-6 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-4">
            <div className="border-b border-[#232f4b] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Folder className="w-5 h-5 text-[#f472b6]" />
                <span>Header Branding, Logos &amp; Identity</span>
              </h3>
              <p className="text-xs text-slate-400">
                Customise the top navigation brand name, subtitle badge, and official logo graphics. These update in real time and lock in permanently.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Header Brand Name
                </label>
                <input
                  type="text"
                  value={headerBrandName}
                  onChange={e => setHeaderBrandName(e.target.value)}
                  placeholder="A'TIN PANAY"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white font-bold text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Header Subtitle
                </label>
                <input
                  type="text"
                  value={headerSubtitle}
                  onChange={e => setHeaderSubtitle(e.target.value)}
                  placeholder="Community Hub & Exclusive Merch"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Header Collaboration Badge
                </label>
                <input
                  type="text"
                  value={headerBadgeText}
                  onChange={e => setHeaderBadgeText(e.target.value)}
                  placeholder="x KAAL"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <ImageUploadField
                label="A'TIN Panay Main Community Logo"
                folder="Logos"
                value={logoUrl}
                onChange={setLogoUrl}
                aspectRatio="square"
                hint="Upload official Panay logo (PNG/SVG recommended)"
              />
              <ImageUploadField
                label="Team KAAL Official Logo / Crest"
                folder="Logos"
                value={teamKaalLogoUrl}
                onChange={setTeamKaalLogoUrl}
                aspectRatio="square"
                hint="Upload official Team KAAL insignia"
              />
            </div>
          </div>

          {/* Official Merch Capsule (Featured Showcase Section) */}
          <div className="p-6 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-4">
            <div className="border-b border-[#232f4b] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#b19cd9]" />
                <span>A'TIN Panay Official Merch Capsule (Featured Section)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Edit the text, headlines, badges, and pricing shown on the right-hand hero Merch Capsule card.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Capsule Brand Name
                </label>
                <input
                  type="text"
                  value={capsuleBrandName}
                  onChange={e => setCapsuleBrandName(e.target.value)}
                  placeholder="A'TIN Panay"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white font-bold text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Capsule Subtitle
                </label>
                <input
                  type="text"
                  value={capsuleSubtitle}
                  onChange={e => setCapsuleSubtitle(e.target.value)}
                  placeholder="Official Merch Capsule"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Capsule Top Badge
                </label>
                <input
                  type="text"
                  value={capsuleBadgeText}
                  onChange={e => setCapsuleBadgeText(e.target.value)}
                  placeholder="EXCLUSIVE BATCH"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white font-semibold text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Flagship Drop Badge
                </label>
                <input
                  type="text"
                  value={capsuleFlagshipBadgeText}
                  onChange={e => setCapsuleFlagshipBadgeText(e.target.value)}
                  placeholder="Flagship Drop"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Featured Product Title
                </label>
                <input
                  type="text"
                  value={capsuleFeaturedTitle}
                  onChange={e => setCapsuleFeaturedTitle(e.target.value)}
                  placeholder="BlockScreening T-Shirt (Lavender)"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white font-semibold text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Featured Product Subtitle
                </label>
                <input
                  type="text"
                  value={capsuleFeaturedSubtitle}
                  onChange={e => setCapsuleFeaturedSubtitle(e.target.value)}
                  placeholder="Premium Cotton • Sizes TS to XXL"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Featured Price Text
                </label>
                <input
                  type="text"
                  value={capsuleFeaturedPriceText}
                  onChange={e => setCapsuleFeaturedPriceText(e.target.value)}
                  placeholder="₱550 - ₱580"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white font-bold text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Partnership Marker Text
                </label>
                <input
                  type="text"
                  value={capsulePartnershipText}
                  onChange={e => setCapsulePartnershipText(e.target.value)}
                  placeholder="In partnership with Team KAAL"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Fan Kit Button Label
                </label>
                <input
                  type="text"
                  value={capsuleFanKitButtonText}
                  onChange={e => setCapsuleFanKitButtonText(e.target.value)}
                  placeholder="View Fan Kit"
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white text-xs focus:outline-none focus:border-[#7c5cb7]"
                />
              </div>
            </div>
          </div>

          {/* Homepage Hero & Experience (APMERCH_DATAFOLDER/Homepage) */}
          <div className="p-6 rounded-2xl bg-[#131b2e] border border-[#232f4b] space-y-4">
            <div className="border-b border-[#232f4b] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#9381ff]" />
                <span>Homepage Hero &amp; Experience (APMERCH_DATAFOLDER/Homepage)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Custom hero graphics, banners, and editable community headlines.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <ImageUploadField
                label="Homepage Hero Showcase Banner"
                folder="Homepage"
                value={homepageHeroImageUrl}
                onChange={setHomepageHeroImageUrl}
                aspectRatio="banner"
                hint="High-resolution wide banner for landing hero section"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Homepage Hero Title
                  </label>
                  <input
                    type="text"
                    value={homepageHeroTitle}
                    onChange={e => setHomepageHeroTitle(e.target.value)}
                    placeholder="A'TIN Panay Community Hub"
                    className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white text-xs focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Homepage Slogan / Tagline
                  </label>
                  <input
                    type="text"
                    value={homepageTagline}
                    onChange={e => setHomepageTagline(e.target.value)}
                    placeholder="BlockScreening Exclusive Merchandise"
                    className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white text-xs focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Homepage Description Paragraph
                  </label>
                  <textarea
                    rows={2}
                    value={homepageDescription}
                    onChange={e => setHomepageDescription(e.target.value)}
                    placeholder="Official merchandise, fan projects, collections, stories and community updates for A'TIN Panay."
                    className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white text-xs focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Customer Support Email
                  </label>
                  <input
                    type="email"
                    value={adminContactEmail}
                    onChange={e => setAdminContactEmail(e.target.value)}
                    placeholder="admin@atinpanay.com"
                    className="w-full px-3 py-2 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-white text-xs focus:outline-none focus:border-[#7c5cb7]"
                  />
                </div>
              </div>
            </div>
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

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleTestGasConnection}
                  disabled={isTestingGas || !gasUrl}
                  className="flex-1 px-3 py-2 bg-[#172554] hover:bg-[#1e3a8a] border border-[#2563eb]/40 rounded-xl text-xs font-bold text-blue-300 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingGas ? 'animate-spin' : ''}`} />
                  <span>{isTestingGas ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyGasCode}
                  className="flex-1 px-3 py-2 bg-[#1e1b4b] hover:bg-[#2d1b69] border border-[#3b2b73] rounded-xl text-xs font-bold text-[#b19cd9] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{copiedScript ? 'Copied!' : 'Copy Script Code'}</span>
                </button>
              </div>
            </div>

            {/* Test Connection Result Box */}
            {gasTestStatus && gasTestStatus.tested && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
                gasTestStatus.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}>
                {gasTestStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="font-bold">
                    {gasTestStatus.success ? 'Google Apps Script Connected' : 'Connection Failed'}
                    {gasTestStatus.durationMs ? ` (${gasTestStatus.durationMs}ms)` : ''}
                  </p>
                  <p className="text-[11px] opacity-90">{gasTestStatus.message}</p>
                  {gasTestStatus.success && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-[#0b0f19] border border-[#232f4b] text-slate-300">
                        Sheet: <strong>{gasTestStatus.sheetTitle || sheetName}</strong>
                      </span>
                      <span className={`px-2 py-0.5 rounded-md border ${
                        gasTestStatus.supportsUploadImage 
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                          : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                      }`}>
                        Drive Folder Upload: <strong>{gasTestStatus.supportsUploadImage ? 'Enabled' : 'Update Available'}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Apps Script Update Notice if uploadImage is not yet supported */}
            {(googleSheetsApi.getIsUploadImageSupported() === false || (gasTestStatus && gasTestStatus.tested && !gasTestStatus.supportsUploadImage)) && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-300">Google Apps Script Deployment Update Available</p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Your current deployed Web App is running an earlier script version without the direct Drive folder uploader (<code className="text-amber-300 font-mono">uploadImage</code>). Photos uploaded in the app are currently safely saved and synced as optimized web data URLs.
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    To store photos directly in your Google Drive folders (<code className="text-amber-300 font-mono">APMERCH_DATAFOLDER</code>):
                    <br />
                    1. Click <strong>Copy Script Code</strong> above.
                    <br />
                    2. In your Google Sheet, click <strong>Extensions &gt; Apps Script</strong> and paste the updated code.
                    <br />
                    3. Click <strong>Deploy &gt; Manage deployments &gt; Edit (pencil icon) &gt; Version: New version &gt; Deploy</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Deployment Guide */}
            <div className="p-3 bg-[#0b0f19] border border-[#232f4b] rounded-xl text-xs text-slate-300 space-y-1.5">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-[#b19cd9]" />
                <span>How to Deploy or Update Google Apps Script</span>
              </p>
              <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1">
                <li>Click <strong>Copy Script Code</strong> and open your Google Sheet (<strong>Extensions &gt; Apps Script</strong>).</li>
                <li>Paste all code into <code>Code.gs</code> and click <strong>Save</strong>.</li>
                <li>Click <strong>Deploy &gt; Manage deployments &gt; Edit (pencil) &gt; Version: New version &gt; Deploy</strong>.</li>
                <li>Ensure <em>Who has access</em> is set to <strong>Anyone</strong>.</li>
              </ol>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 rounded-2xl bg-[#0b0f19] border border-[#232f4b] flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Changes will be permanently locked in to APMERCH_DATABASE and your Google Drive structure.
            </p>
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white text-xs font-bold shadow-lg shadow-[#7c5cb7]/25 hover:opacity-95 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & Lock In All Settings</span>
            </button>
          </div>
        </div>
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

      {/* Lock-In Confirmation for Merchandise Items */}
      <LockInModal
        isOpen={showProductLockModal}
        title={editingProduct ? 'Lock In Merchandise Changes?' : 'Lock In New Merchandise Item?'}
        itemDescription={`"${pTitle || 'Merchandise Item'}" will have its gallery photos and specs permanently preserved in APMERCH_DATAFOLDER/Merchandise and APMERCH_DATABASE.`}
        folderName="Merchandise"
        isSaving={isSavingProduct}
        onConfirm={handleConfirmLockProduct}
        onCancel={() => setShowProductLockModal(false)}
      />

      {/* Lock-In Confirmation for Admin Settings */}
      <LockInModal
        isOpen={showSettingsLockModal}
        title="Lock In Global Settings & Logos?"
        itemDescription="This will commit the schedule cut-offs, payment QR codes, branding logos, and hero graphics to the APMERCH_DATABASE and APMERCH_DATAFOLDER. The settings will NOT revert upon refresh."
        folderName="Homepage / Logos"
        isSaving={isSavingSettings}
        onConfirm={handleConfirmLockSettings}
        onCancel={() => setShowSettingsLockModal(false)}
      />

      {/* Admin Order Create / Edit Modal */}
      {(showAddOrderModal || editingOrder) && (
        <AdminOrderModal
          isOpen={showAddOrderModal || !!editingOrder}
          initialOrder={editingOrder}
          products={products}
          onClose={() => {
            setShowAddOrderModal(false);
            setEditingOrder(null);
          }}
          onSave={async (orderData) => {
            if (editingOrder) {
              await updateOrder(orderData);
            } else {
              await addAdminOrder(orderData);
            }
          }}
        />
      )}

      {/* Admin Order Delete Confirmation Modal */}
      {deletingOrder && (
        <AdminOrderDeleteModal
          isOpen={!!deletingOrder}
          order={deletingOrder}
          onClose={() => setDeletingOrder(null)}
          onConfirm={async () => {
            if (deletingOrder) {
              await deleteOrder(deletingOrder.orderNumber);
              setDeletingOrder(null);
            }
          }}
        />
      )}

    </div>
  );
};
