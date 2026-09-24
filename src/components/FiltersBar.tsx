import React, { useState } from 'react';
import { 
  Search, 
  RotateCcw, 
  Calendar, 
  Store, 
  Tag, 
  Sparkles, 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { CatalogueFilterState } from '../types.js';

interface FiltersBarProps {
  filters: CatalogueFilterState;
  setFilters: React.Dispatch<React.SetStateAction<CatalogueFilterState>>;
  suppliers: string[];
  fabrics: string[];
  totalResultsCount: number;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  setFilters,
  suppliers,
  fabrics,
  totalResultsCount,
}) => {
  const [isMobileFiltersExpanded, setIsMobileFiltersExpanded] = useState<boolean>(false);

  // Calculate active filter count
  const activeFilterCount = [
    filters.date !== 'all',
    filters.supplier !== 'all',
    filters.minPrice > 0 || filters.maxPrice < 5000,
    filters.fabric !== 'all',
    filters.category !== 'all',
    Boolean(filters.searchQuery.trim()),
  ].filter(Boolean).length;

  const isFiltered = activeFilterCount > 0;

  const handleReset = () => {
    setFilters({
      date: 'all',
      supplier: 'all',
      minPrice: 0,
      maxPrice: 5000,
      fabric: 'all',
      category: 'all',
      searchQuery: '',
    });
  };

  const applyPricePreset = (min: number, max: number) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: min,
      maxPrice: max,
    }));
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 shadow-xs mb-4 sm:mb-6 space-y-3">
      
      {/* Top Row: Search & Filters Toggle */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            id="filter-search"
            type="text"
            placeholder="Search code (396), fabric, or supplier..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters({ ...filters, searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle Button */}
        <button
          onClick={() => setIsMobileFiltersExpanded(!isMobileFiltersExpanded)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition shrink-0 cursor-pointer active:scale-95 ${
            isMobileFiltersExpanded || activeFilterCount > 0
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              isMobileFiltersExpanded || activeFilterCount > 0 ? 'bg-amber-800 text-white' : 'bg-amber-500 text-stone-900'
            }`}>
              {activeFilterCount}
            </span>
          )}
          {isMobileFiltersExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 sm:hidden" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 sm:hidden" />
          )}
        </button>

        {/* Reset button (visible if filtered) */}
        {isFiltered && (
          <button
            id="btn-reset-filters-top"
            onClick={handleReset}
            title="Reset all filters"
            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-stone-200 transition shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontally Scrollable Fast Filter Chips (Touch Friendly on Mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar -mx-1 px-1">
        <button
          onClick={() => {
            setFilters((prev) => ({
              ...prev,
              minPrice: 0,
              maxPrice: 5000,
              supplier: 'all',
              fabric: 'all',
            }));
          }}
          className={`px-3 py-1 rounded-full border shrink-0 transition text-xs font-medium cursor-pointer ${
            filters.minPrice === 0 && filters.maxPrice === 5000 && filters.supplier === 'all'
              ? 'bg-stone-900 text-white border-stone-900 font-bold'
              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
          }`}
        >
          All
        </button>

        <button
          id="btn-preset-under-400"
          onClick={() => applyPricePreset(0, 400)}
          className={`px-3 py-1 rounded-full border shrink-0 transition text-xs font-medium cursor-pointer ${
            filters.minPrice === 0 && filters.maxPrice === 400
              ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
          }`}
        >
          Under ₹400
        </button>

        <button
          id="btn-preset-400-500"
          onClick={() => applyPricePreset(400, 500)}
          className={`px-3 py-1 rounded-full border shrink-0 transition text-xs font-medium cursor-pointer ${
            filters.minPrice === 400 && filters.maxPrice === 500
              ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
          }`}
        >
          ₹400 – ₹500
        </button>

        <button
          id="btn-preset-above-500"
          onClick={() => applyPricePreset(500, 5000)}
          className={`px-3 py-1 rounded-full border shrink-0 transition text-xs font-medium cursor-pointer ${
            filters.minPrice === 500 && filters.maxPrice === 5000
              ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
          }`}
        >
          Above ₹500
        </button>

        {/* Dynamic Top Supplier Chips */}
        {suppliers.slice(0, 4).map((s) => (
          <button
            key={s}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                supplier: prev.supplier === s ? 'all' : s,
              }))
            }
            className={`px-3 py-1 rounded-full border shrink-0 transition text-xs font-medium cursor-pointer ${
              filters.supplier === s
                ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Collapsible Detailed Filter Drawer (Default open on desktop, expandable on mobile) */}
      <div className={`${isMobileFiltersExpanded ? 'block' : 'hidden sm:block'} pt-2 border-t border-stone-100 space-y-3`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          
          {/* Filter 1: Date */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-stone-400" />
              1. Date Shared
            </label>
            <select
              id="filter-date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value as any })}
              className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            >
              <option value="all">All Dates</option>
              <option value="today">Today&apos;s Batches</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
            </select>
          </div>

          {/* Filter 2: Supplier */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1 flex items-center gap-1">
              <Store className="w-3 h-3 text-stone-400" />
              2. Supplier / Mill
            </label>
            <select
              id="filter-supplier"
              value={filters.supplier}
              onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
              className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Price Range */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-stone-400" />
              3. Wholesale Price (₹)
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">₹</span>
                <input
                  id="filter-min-price"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="Min"
                  value={filters.minPrice || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : 0 })
                  }
                  className="w-full text-xs sm:text-sm pl-6 pr-1.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
              <span className="text-stone-400 text-xs font-bold">–</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">₹</span>
                <input
                  id="filter-max-price"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="Max"
                  value={filters.maxPrice >= 5000 ? '' : filters.maxPrice}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      maxPrice: e.target.value ? Number(e.target.value) : 5000,
                    })
                  }
                  className="w-full text-xs sm:text-sm pl-6 pr-1.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Filter 4: Fabric */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-stone-400" />
              4. Fabric / Quality
            </label>
            <select
              id="filter-fabric"
              value={filters.fabric}
              onChange={(e) => setFilters({ ...filters, fabric: e.target.value })}
              className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            >
              <option value="all">All Fabrics</option>
              {fabrics.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Mobile Close Drawer Button */}
        <div className="sm:hidden pt-2 flex items-center justify-between border-t border-stone-100">
          <button
            onClick={handleReset}
            className="text-xs text-rose-600 font-medium py-1"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsMobileFiltersExpanded(false)}
            className="px-3 py-1 bg-stone-900 text-white text-xs font-semibold rounded-lg"
          >
            Done
          </button>
        </div>
      </div>

      {/* Results Count & Active Pills Summary */}
      <div className="flex items-center justify-between pt-1 text-xs text-stone-600 flex-wrap gap-1">
        <span className="font-medium text-stone-700">
          Showing <strong className="text-amber-700 font-bold">{totalResultsCount}</strong> wholesale designs
        </span>

        {isFiltered && (
          <div className="flex items-center gap-1 flex-wrap">
            {filters.category !== 'all' && (
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1">
                {filters.category}
                <button onClick={() => setFilters({ ...filters, category: 'all' })}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filters.supplier !== 'all' && (
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1">
                {filters.supplier}
                <button onClick={() => setFilters({ ...filters, supplier: 'all' })}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {(filters.minPrice > 0 || filters.maxPrice < 5000) && (
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1">
                ₹{filters.minPrice}–₹{filters.maxPrice < 5000 ? filters.maxPrice : '5000+'}
                <button onClick={() => setFilters({ ...filters, minPrice: 0, maxPrice: 5000 })}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filters.fabric !== 'all' && (
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1">
                {filters.fabric}
                <button onClick={() => setFilters({ ...filters, fabric: 'all' })}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
