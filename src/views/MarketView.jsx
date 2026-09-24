import { useMemo, useState } from 'react';
import { Search, Plus, Briefcase, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, toMillis } from '../lib/utils';
import { ListingCard } from '../components/Listing';
import { EmptyState, Spinner } from '../components/ui';

const SORTS = {
  newest: { label: 'Newest', fn: (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt) },
  priceAsc: { label: 'Price: low to high', fn: (a, b) => Number(a.price) - Number(b.price) },
  priceDesc: { label: 'Price: high to low', fn: (a, b) => Number(b.price) - Number(a.price) },
};

export default function MarketView({ listings, loading, error, sellerCount, onOpen, onSell }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [kind, setKind] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showSold, setShowSold] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings
      .filter((l) => showSold || l.status !== 'sold')
      .filter((l) => category === 'All' || l.category === category)
      .filter((l) => kind === 'all' || (l.kind || 'service') === kind)
      .filter(
        (l) =>
          !q ||
          [l.title, l.description, l.seller, l.location, l.category].some((v) => v?.toLowerCase().includes(q)),
      )
      .sort((a, b) => Number(Boolean(b.sellerPro)) - Number(Boolean(a.sellerPro)) || SORTS[sort].fn(a, b));
  }, [listings, query, category, kind, sort, showSold]);

  const activeCount = listings.filter((l) => l.status !== 'sold').length;

  return (
    <div className="animate-fade-in">
      <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl surface-glow">
        <p className="text-[10px] uppercase tracking-[0.32em] text-gray-500">Campus marketplace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tighter text-gradient">ComradeConnect.</h1>
        <p className="mt-1 text-sm text-gray-400">
          Students, merchants and traders in one place. Register, list what you sell, and reach the whole campus.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-2xl border border-white/5 bg-black/25 px-3 py-3">
            <p className="text-lg font-semibold text-white">{activeCount}</p>
            <p className="text-gray-500">Active listings</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-black/25 px-3 py-3">
            <p className="text-lg font-semibold text-white">{sellerCount}</p>
            <p className="text-gray-500">Registered sellers</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSell}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] py-3 text-sm font-semibold text-white hover:bg-[#0077ed]"
        >
          <Plus className="h-4 w-4" /> Sell something
        </button>
      </section>

      <div className="sticky top-14 z-30 -mx-4 border-b border-white/5 bg-black/80 px-4 py-3 backdrop-blur-xl">
        <div className="mb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              placeholder="Search products, services, sellers"
              className="w-full rounded-xl border border-transparent bg-[#1d1d1f] py-3 pl-9 pr-4 text-sm font-medium text-white placeholder-gray-500 outline-none focus:border-[#424245]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="relative flex items-center rounded-xl bg-[#1d1d1f] px-3 text-gray-400">
            <SlidersHorizontal className="h-4 w-4" />
            <select
              aria-label="Sort listings"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mb-2 flex items-center gap-2 text-xs">
          {[
            ['all', 'All'],
            ['product', 'Products'],
            ['service', 'Services'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              className={`rounded-full px-3 py-1 font-medium ${
                kind === value ? 'bg-[#0071e3] text-white' : 'bg-[#1d1d1f] text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-1.5 text-gray-500">
            <input type="checkbox" className="accent-[#0071e3]" checked={showSold} onChange={(e) => setShowSold(e.target.checked)} />
            Show sold
          </label>
        </div>
        <div className="no-scrollbar mask-fade-r flex gap-2 overflow-x-auto">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                category === cat ? 'bg-[#f5f5f7] text-black' : 'bg-[#1d1d1f] text-[#86868b] hover:bg-[#2c2c2e]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 min-h-[300px]">
        {loading ? (
          <Spinner />
        ) : error ? (
          <EmptyState icon={Briefcase} title="Couldn't load the marketplace" text={error} />
        ) : filtered.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((l) => (
              <ListingCard key={l.id} listing={l} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title={listings.length ? 'No matching listings' : 'No listings yet'}
            text={listings.length ? 'Try a different search or category.' : 'Be the first to sell on campus.'}
          />
        )}
      </div>
    </div>
  );
}
