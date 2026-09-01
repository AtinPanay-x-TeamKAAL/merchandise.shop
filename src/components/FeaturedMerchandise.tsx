import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { ProductCategory } from '../types';
import { ShoppingBag, Search, Sparkles, Filter, ShieldCheck, HelpCircle } from 'lucide-react';

const CATEGORIES: ('All' | ProductCategory)[] = [
  'All',
  'Apparel',
  'Drinkware',
  'Merchandise',
  'Collections',
  'Fan Projects',
  'Digital Products',
  'Team KAAL Publications'
];

export const FeaturedMerchandise: React.FC = () => {
  const { products, isPreorderClosed } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.color && product.color.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <section id="merchandise-section" className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-purple-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-purple-700 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              Official Event Catalog
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Featured Merchandise
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Limited-edition commemorative goods for A'TIN Panay BlockScreening attendees. All items are manufactured with premium materials and verified for claiming on October 11, 2026.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search items, color, specs..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-purple-200 focus:border-purple-500 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none shadow-sm transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-white text-slate-700 border border-purple-100 hover:border-purple-300 hover:text-purple-900 shadow-sm'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white/70 backdrop-blur-md rounded-3xl border border-purple-100 space-y-3 shadow-sm">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No merchandise found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No products match your current filter or search criteria. Try adjusting the category or search keywords.
            </p>
          </div>
        )}

        {/* Ordering Notice Guarantee Footer */}
        <div className="p-5 rounded-3xl bg-purple-50/80 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Pre-order Guarantee:</strong> 100% genuine batch production. Receipt proof reviewed directly by A'TIN Panay Organizers.
            </span>
          </div>
          <div className="text-purple-800 font-bold shrink-0">
            Pickup Date: October 11, 2026
          </div>
        </div>

      </div>
    </section>
  );
};
