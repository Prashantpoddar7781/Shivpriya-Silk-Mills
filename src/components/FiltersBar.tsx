import React from 'react';
import { Search, RotateCcw, Calendar, Store, Tag, Sparkles } from 'lucide-react';
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
  const isFiltered =
    filters.date !== 'all' ||
    filters.supplier !== 'all' ||
    filters.minPrice > 0 ||
    filters.maxPrice < 5000 ||
    filters.fabric !== 'all' ||
    filters.category !== 'all' ||
    Boolean(filters.searchQuery.trim());

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

  const applyPreset = (category: string, fabric: string, min: number, max: number) => {
    setFilters((prev) => ({
      ...prev,
      category,
      fabric,
      minPrice: min,
      maxPrice: max,
    }));
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs mb-6 space-y-4">
      {/* Search & Direct Example Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            id="filter-search"
            type="text"
            placeholder="Search by code (R182), fabric, or supplier..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          />
        </div>

        {/* Quick Example Preset: Sarees + Rayon + ₹300-₹500 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Match:
          </span>
          <button
            id="btn-preset-sarees-rayon-300-500"
            onClick={() => applyPreset('Sarees', 'Rayon', 300, 500)}
            className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
          >
            Sarees + Rayon + ₹300–₹500
          </button>
          <button
            id="btn-preset-georgette-400-700"
            onClick={() => applyPreset('Sarees', 'Georgette', 400, 700)}
            className="px-2.5 py-1 text-xs font-medium rounded-full bg-stone-100 text-stone-800 border border-stone-200 hover:bg-stone-200 transition cursor-pointer"
          >
            Georgette + ₹400–₹700
          </button>
          {isFiltered && (
            <button
              id="btn-reset-filters"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          )}
        </div>
      </div>

      {/* 4 Core Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
        
        {/* Filter 1: Date */}
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            1. Date Shared
          </label>
          <select
            id="filter-date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value as any })}
            className="w-full text-sm bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
          >
            <option value="all">All Dates</option>
            <option value="today">Today's Batches</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
          </select>
        </div>

        {/* Filter 2: Supplier */}
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-stone-400" />
            2. Supplier / Mill
          </label>
          <select
            id="filter-supplier"
            value={filters.supplier}
            onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
            className="w-full text-sm bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
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
          <label className="block text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-stone-400" />
            3. Wholesale Price Range (₹)
          </label>
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">₹</span>
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
                className="w-full text-sm pl-5 pr-1.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>
            <span className="text-stone-400 text-xs font-semibold">–</span>
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">₹</span>
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
                className="w-full text-sm pl-5 pr-1.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Filter 4: Fabric */}
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-stone-400" />
            4. Fabric / Quality
          </label>
          <select
            id="filter-fabric"
            value={filters.fabric}
            onChange={(e) => setFilters({ ...filters, fabric: e.target.value })}
            className="w-full text-sm bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
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

      {/* Active Filter Pills Bar */}
      <div className="flex items-center justify-between pt-2 text-xs text-stone-600">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-stone-800">
            Showing <strong className="text-amber-700">{totalResultsCount}</strong> wholesale designs:
          </span>
          {filters.category !== 'all' && (
            <span className="bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded font-medium">
              Category: {filters.category}
            </span>
          )}
          {filters.fabric !== 'all' && (
            <span className="bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded font-medium">
              Fabric: {filters.fabric}
            </span>
          )}
          {(filters.minPrice > 0 || filters.maxPrice < 5000) && (
            <span className="bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded font-medium">
              Price: ₹{filters.minPrice} – ₹{filters.maxPrice < 5000 ? filters.maxPrice : '5000+'}
            </span>
          )}
          {filters.supplier !== 'all' && (
            <span className="bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded font-medium">
              Supplier: {filters.supplier}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
