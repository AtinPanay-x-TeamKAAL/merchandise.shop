import React, { useState } from 'react';
import { Product, ProductSize } from '../types';
import { useApp } from '../context/AppContext';
import { 
  X, 
  ShoppingBag, 
  Ruler, 
  Check, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product;
  initialSize?: ProductSize;
  viewSizeChartDefault?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
  product, 
  initialSize,
  viewSizeChartDefault = false 
}) => {
  const { closeModal, addToCart, isPreorderClosed } = useApp();
  
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(
    initialSize || (product.sizes && product.sizes.length > 0 ? (product.sizes.includes('M') ? 'M' : product.sizes[0]) : undefined)
  );
  
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'size-chart' | 'specs'>(
    viewSizeChartDefault ? 'size-chart' : 'overview'
  );

  const images = product.galleryImages && product.galleryImages.length > 0 
    ? product.galleryImages 
    : [{ label: 'Product View', url: product.imageUrl }];

  const currentPrice = selectedSize === 'XXL' && product.xxlPrice 
    ? product.xxlPrice 
    : (product.basePrice || product.price);

  const handleAddToCart = () => {
    if (isPreorderClosed) return;
    addToCart(product, selectedSize, quantity);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-[#0b0f19] border border-[#232f4b] rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232f4b] bg-[#131b2e]/60">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-[#7c5cb7]/30 text-[#e0d7f5] border border-[#7c5cb7]/40">
              {product.category}
            </span>
            <span className="text-xs text-slate-400">Official Pre-Order Merch</span>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Gallery */}
          <div className="md:col-span-6 space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-[#232f4b] group">
              <img
                src={images[activeImageIndex]?.url || product.imageUrl}
                alt={images[activeImageIndex]?.label || product.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
              
              {/* Image Label Pill */}
              <div className="absolute bottom-3 left-3 bg-[#0b0f19]/80 backdrop-blur-md px-3 py-1 rounded-lg border border-[#232f4b] text-xs font-semibold text-white">
                {images[activeImageIndex]?.label || 'Product View'}
              </div>

              {/* Prev / Next Arrows */}
              {images.length > 1 && (
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="p-2 rounded-full bg-[#0b0f19]/80 text-white hover:bg-[#7c5cb7] border border-[#232f4b] pointer-events-auto transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="p-2 rounded-full bg-[#0b0f19]/80 text-white hover:bg-[#7c5cb7] border border-[#232f4b] pointer-events-auto transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx
                        ? 'border-[#f472b6] scale-105 shadow-md shadow-[#f472b6]/20'
                        : 'border-[#232f4b] opacity-60 hover:opacity-100 hover:border-[#7c5cb7]'
                    }`}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] text-center text-slate-200 truncate px-1 py-0.5">
                      {img.label}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Event Assurance note */}
            <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#232f4b] text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Calendar className="w-3.5 h-3.5 text-[#f472b6]" />
                <span>Claiming: October 11, 2026</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pick up in-person during the A'TIN Panay BlockScreening event with your digital E-Order ticket.
              </p>
            </div>
          </div>

          {/* Right Column: Details & Ordering */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {product.title}
                </h1>
                
                {/* Price Display */}
                <div className="flex items-baseline gap-3 mt-2">
                  <div className="text-2xl sm:text-3xl font-black text-[#f472b6]">
                    ₱{currentPrice.toLocaleString()} PHP
                  </div>
                  {product.xxlPrice && product.basePrice && (
                    <span className="text-xs text-slate-400">
                      (S-XL: ₱{product.basePrice} | XXL: ₱{product.xxlPrice})
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex border-b border-[#232f4b] gap-4 text-xs font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2 transition-colors border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-[#f472b6] text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Description
                </button>
                {product.sizeChart && product.sizeChart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('size-chart')}
                    className={`pb-2 transition-colors border-b-2 flex items-center gap-1 ${
                      activeTab === 'size-chart'
                        ? 'border-[#f472b6] text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5 text-[#b19cd9]" />
                    Size Chart
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 transition-colors border-b-2 ${
                    activeTab === 'specs'
                      ? 'border-[#f472b6] text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Specifications
                </button>
              </div>

              {/* Tab Content 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                  <p>{product.description}</p>
                  
                  {product.color && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Colorway:</span>
                      <span className="font-semibold text-white px-2 py-0.5 rounded bg-[#1e1b4b] border border-[#3b2b73]">
                        {product.color}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content 2: Size Chart */}
              {activeTab === 'size-chart' && product.sizeChart && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Measurements in <strong>inches (width × length)</strong></span>
                    <span className="text-[#f472b6]">Unisex Regular Fit</span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[#232f4b] bg-[#131b2e]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#1e1b4b] text-[#b19cd9] font-bold uppercase">
                        <tr>
                          <th className="px-3 py-2.5">Size</th>
                          <th className="px-3 py-2.5">Width (in)</th>
                          <th className="px-3 py-2.5">Length (in)</th>
                          <th className="px-3 py-2.5">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#232f4b] text-slate-200">
                        {product.sizeChart.map(row => (
                          <tr 
                            key={row.size}
                            className={`hover:bg-[#1e1b4b]/50 cursor-pointer transition-colors ${
                              selectedSize === row.size ? 'bg-[#7c5cb7]/20 font-bold text-white' : ''
                            }`}
                            onClick={() => setSelectedSize(row.size)}
                          >
                            <td className="px-3 py-2 flex items-center gap-1.5">
                              {selectedSize === row.size && <Check className="w-3 h-3 text-[#f472b6]" />}
                              <span>{row.size}</span>
                            </td>
                            <td className="px-3 py-2">{row.width}"</td>
                            <td className="px-3 py-2">{row.length}"</td>
                            <td className="px-3 py-2 text-[#f472b6]">
                              {row.size === 'XXL' ? '₱580' : '₱550'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab Content 3: Specs */}
              {activeTab === 'specs' && (
                <div className="space-y-2 text-xs text-slate-300">
                  {product.material && (
                    <div className="flex justify-between py-1.5 border-b border-[#232f4b]">
                      <span className="text-slate-400">Material</span>
                      <span className="font-semibold text-white">{product.material}</span>
                    </div>
                  )}
                  {product.capacity && (
                    <div className="flex justify-between py-1.5 border-b border-[#232f4b]">
                      <span className="text-slate-400">Capacity</span>
                      <span className="font-semibold text-white">{product.capacity}</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="flex justify-between py-1.5 border-b border-[#232f4b]">
                      <span className="text-slate-400">Dimensions</span>
                      <span className="font-semibold text-white">{product.dimensions}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-b border-[#232f4b]">
                    <span className="text-slate-400">Printing / Production</span>
                    <span className="font-semibold text-white">High-Density Sublimation / Laser Etch</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Fulfillment</span>
                    <span className="font-semibold text-emerald-400">A'TIN Panay Organizers Team</span>
                  </div>
                </div>
              )}

              {/* Size Selector if product has sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Choose Size: <span className="text-[#f472b6] font-extrabold">{selectedSize}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          selectedSize === size
                            ? 'bg-[#7c5cb7] text-white border border-[#9381ff] shadow-lg shadow-[#7c5cb7]/40'
                            : 'bg-[#131b2e] text-slate-300 border border-[#232f4b] hover:border-[#7c5cb7]'
                        }`}
                      >
                        {size}
                        {size === 'XXL' && <span className="text-[10px] text-[#f472b6] ml-1">(+₱30)</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quantity:</span>
                <div className="flex items-center border border-[#232f4b] rounded-xl bg-[#131b2e] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 text-slate-300 hover:bg-[#1e1b4b] hover:text-white"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-sm font-bold text-white min-w-[36px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="px-3 py-1.5 text-slate-300 hover:bg-[#1e1b4b] hover:text-white"
                  >
                    +
                  </button>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Subtotal: <strong className="text-white">₱{(currentPrice * quantity).toLocaleString()} PHP</strong>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-4 border-t border-[#232f4b] flex items-center gap-3">
              <button
                type="button"
                disabled={isPreorderClosed}
                onClick={handleAddToCart}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                  isPreorderClosed
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#7c5cb7] via-[#9381ff] to-[#f472b6] text-white hover:opacity-95 shadow-[#7c5cb7]/30'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isPreorderClosed ? 'Pre-Order Window Closed' : `Add ${quantity} to Bag • ₱${(currentPrice * quantity).toLocaleString()}`}
                </span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
