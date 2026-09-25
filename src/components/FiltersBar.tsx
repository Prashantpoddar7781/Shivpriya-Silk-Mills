import React, { useState } from 'react';
import { 
  Search, 
  RotateCcw, 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  ChevronUp,
  Tag,
  Store,
  Calendar,
  Sparkles
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

  // Popular Surat fabrics for quick pills
  const popularFabrics = ['Fendy', 'Rayon', 'Georgette', 'Dola Silk', 'Cotton', 'Organza', 'Satin'];

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-2.5 sm:p-4 shadow-2xs mb-3 sm:mb-5 space-y-2.5">
      
      {/* Search Bar & Filter Toggle Row */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            id="filter-search"
            type="text"
            placeholder="Search code, fabric, supplier..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters({ ...filters, searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setIsMobileFiltersExpanded(!isMobileFiltersExpanded)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all shrink-0 cursor-pointer active:scale-95 ${
            isMobileFiltersExpanded || activeFilterCount > 0
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-amber-900">
              {activeFilterCount}
            </span>
          )}
          {isMobileFiltersExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Reset button if any filter active */}
        {isFiltered && (
          <button
            onClick={handleReset}
            title="Reset All Filters"
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Quick Chips (Zero scrollbar, smooth finger swipe) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
        <button
          onClick={() => applyPricePreset(0, 5000)}
          className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
            filters.minPrice === 0 && filters.maxPrice === 5000
              ? 'bg-stone-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          All Rates
        </button>

        <button
          onClick={() => applyPricePreset(0, 400)}
          className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
            filters.minPrice === 0 && filters.maxPrice === 400
              ? 'bg-amber-600 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Under ₹400
        </button>

        <button
          onClick={() => applyPricePreset(400, 500)}
          className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
            filters.minPrice === 400 && filters.maxPrice === 500
              ? 'bg-amber-600 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          ₹400 – ₹500
        </button>

        <button
          onClick={() => applyPricePreset(500, 5000)}
          className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
            filters.minPrice === 500 && filters.maxPrice === 5000
              ? 'bg-amber-600 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Above ₹500
        </button>

        {/* Popular Fabric Chips */}
        {popularFabrics.map((f) => (
          <button
            key={f}
            onClick={() => setFilters((prev) => ({ ...prev, fabric: prev.fabric === f ? 'all' : f }))}
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
              filters.fabric.toLowerCase() === f.toLowerCase()
                ? 'bg-amber-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Expandable Advanced Filters Drawer */}
      {isMobileFiltersExpanded && (
        <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
          {/* Supplier Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Supplier
            </label>
            <select
              value={filters.supplier}
              onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
              className="w-full py-1.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Date Received
            </label>
            <select
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value as any })}
              className="w-full py-1.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="all">All Dates</option>
              <option value="today">Today Only</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
            </select>
          </div>

          {/* Fabric Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              All Fabrics
            </label>
            <select
              value={filters.fabric}
              onChange={(e) => setFilters({ ...filters, fabric: e.target.value })}
              className="w-full py-1.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="all">All Fabrics</option>
              {fabrics.map((fab) => (
                <option key={fab} value={fab}>{fab}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filter Tags & Count Row */}
      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
        <span>Showing <strong className="text-stone-900 font-bold">{totalResultsCount}</strong> wholesale designs</span>

        {isFiltered && (
          <button
            onClick={handleReset}
            className="text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

    </div>
  );
};
