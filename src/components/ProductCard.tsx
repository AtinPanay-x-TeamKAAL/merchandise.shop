import React, { useState } from 'react';
import { Product, ProductSize } from '../types';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Eye, Sparkles, Layers, Ruler, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, isPreorderClosed, openModal } = useApp();
  
  // Default size selection if apparel
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(
    product.sizes && product.sizes.length > 0 ? (product.sizes.includes('M') ? 'M' : product.sizes[0]) : undefined
  );

  // Dynamic price calculation
  const currentPrice = selectedSize === 'XXL' && product.xxlPrice 
    ? product.xxlPrice 
    : (product.basePrice || product.price);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreorderClosed) return;
    addToCart(product, selectedSize, 1);
  };

  return (
    <div 
      id={`product-card-${product.id}`}
      onClick={() => openModal('product-detail', { product, initialSize: selectedSize })}
      className="group relative rounded-3xl bg-white/90 backdrop-blur-md border border-purple-100 hover:border-purple-300 transition-all duration-300 overflow-hidden shadow-md hover:shadow-xl hover:shadow-purple-500/10 flex flex-col cursor-pointer"
    >
      {/* Top Image Box */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />

        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider text-purple-900 border border-purple-100 shadow-sm">
            {product.category}
          </span>
        </div>

        {/* Quick View Button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="p-2 rounded-full bg-white text-slate-800 hover:text-purple-600 border border-purple-100 shadow-md flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </span>
        </div>

        {/* Closed or Stock Badge */}
        {isPreorderClosed ? (
          <div className="absolute bottom-3 left-3 right-3 bg-rose-600/90 text-white text-xs font-black text-center py-1.5 rounded-xl tracking-wider backdrop-blur-sm uppercase shadow-sm">
            PRE-ORDER CLOSED
          </div>
        ) : product.color ? (
          <div className="absolute bottom-3 left-3 text-[11px] font-semibold text-slate-800 bg-white/90 px-2 py-0.5 rounded-lg backdrop-blur-sm border border-purple-100 shadow-sm">
            Color: <span className="text-purple-900 font-bold">{product.color}</span>
          </div>
        ) : null}
      </div>

      {/* Content Box */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-purple-700 transition-colors leading-snug line-clamp-2">
            {product.title}
          </h3>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
            {product.description}
          </p>

          {/* Specs Snippet */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-slate-600">
            {product.capacity && (
              <span className="bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 font-medium text-purple-800">
                {product.capacity}
              </span>
            )}
            {product.dimensions && (
              <span className="bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 font-medium text-purple-800">
                {product.dimensions}
              </span>
            )}
            {product.material && (
              <span className="bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 font-medium text-purple-800 truncate max-w-[170px]">
                {product.material}
              </span>
            )}
          </div>
        </div>

        {/* Size Selection if Available */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Size:</span>
              <span className="text-purple-700 font-bold">{selectedSize}</span>
            </div>
            <div className="flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
              {product.sizes.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedSize === size
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-purple-50 hover:bg-purple-100 text-slate-700 border border-purple-100'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price and Add Button */}
        <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Pre-Order Price</div>
            <div className="text-lg font-black text-purple-900">
              ₱{currentPrice.toLocaleString()}
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isPreorderClosed}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              isPreorderClosed
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-700 to-indigo-600 hover:opacity-95 text-white shadow-sm shadow-purple-500/20 active:scale-95'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
