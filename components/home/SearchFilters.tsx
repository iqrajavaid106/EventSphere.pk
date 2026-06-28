// components/home/SearchFilters.tsx
'use client'

interface SearchFiltersProps {
  activeCategory: string
  setActiveCategory: (val: string) => void
  selectedCity: string
  setSelectedCity: (val: string) => void
  dateFilter: string
  setDateFilter: (val: string) => void
}

export default function SearchFilters({
  activeCategory,
  setActiveCategory,
  selectedCity,
  setSelectedCity,
  dateFilter,
  setDateFilter
}: SearchFiltersProps) {
  const categories = ['All', 'Technology', 'Music', 'Finance']
   const cities = ['All', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad']
  
  return (
    <div className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
        >
          <option value="All">All Cities</option>
          {cities.filter((c) => c !== 'All').map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
        />

        {(activeCategory !== 'All' || selectedCity !== 'All' || dateFilter !== '') && (
          <button
            type="button"
            onClick={() => {
              setActiveCategory('All')
              setSelectedCity('All')
              setDateFilter('')
            }}
            className="text-xs font-semibold text-red-600 hover:text-red-500 px-2 py-1"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
