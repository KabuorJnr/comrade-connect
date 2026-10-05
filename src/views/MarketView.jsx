import { useMemo, useState } from 'react';
import { Search, Plus, ShoppingBag, ArrowDownUp, X, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { useUniversity } from '../lib/university';
import { toMillis } from '../lib/utils';
import { ListingCard } from '../components/Listing';
import { EmptyState, ListingSkeletons, Chip, Button, Notice } from '../components/ui';
import { ListingsMap } from '../components/LazyMaps';

const SORTS = {
  newest: { label: 'Newest', fn: (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt) },
  priceAsc: { label: 'Lowest price', fn: (a, b) => Number(a.price) - Number(b.price) },
  priceDesc: { label: 'Highest price', fn: (a, b) => Number(b.price) - Number(a.price) },
};

export default function MarketView({ listings, loading, error, sellerCount, onOpen, onSell }) {
  const uni = useUniversity();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [kind, setKind] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showSold, setShowSold] = useState(false);
  const [view, setView] = useState('grid');

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
      .sort(
        (a, b) =>
          (sort === 'newest' ? Number(Boolean(b.sellerPro)) - Number(Boolean(a.sellerPro)) : 0) || SORTS[sort].fn(a, b),
      );
  }, [listings, query, category, kind, sort, showSold]);

  const activeCount = listings.filter((l) => l.status !== 'sold').length;
  const filtersActive = query || category !== 'All' || kind !== 'all' || showSold;
  const resetFilters = () => {
    setQuery('');
    setCategory('All');
    setKind('all');
    setShowSold(false);
  };

  return (
    <div className="animate-fade-in">
      <section className="relative mb-4 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-brand/25 via-brand/5 to-transparent p-5">
        <p className="text-xs font-medium text-brand-light">{uni.name}</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-white">Campus marketplace</h1>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-gray-300">{uni.tagline}</p>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div>
            <span className="font-semibold text-white">{activeCount}</span>{' '}
            <span className="text-gray-400">listings</span>
          </div>
          <div className="h-4 w-px bg-white/15" aria-hidden="true" />
          <div>
            <span className="font-semibold text-white">{sellerCount}</span> <span className="text-gray-400">sellers</span>
          </div>
          <Button size="sm" className="ml-auto" onClick={onSell}>
            <Plus className="h-4 w-4" /> Sell
          </Button>
        </div>
      </section>

      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 -mx-4 space-y-2.5 border-b border-white/[0.06] bg-black/85 px-4 pb-3 pt-2 backdrop-blur-xl">
        <div className="flex gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Search listings</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              placeholder={`Search ${uni.shortName} marketplace`}
              className="min-h-[44px] w-full rounded-full border border-white/5 bg-white/[0.06] py-2.5 pl-10 pr-10 text-[15px] text-white placeholder-gray-500 outline-none focus:border-brand/60"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <label className="relative flex min-h-[44px] items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-xs font-medium text-gray-300">
            <ArrowDownUp className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{SORTS[sort].label}</span>
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

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {[
            ['all', 'Everything'],
            ['product', 'Products'],
            ['service', 'Services'],
          ].map(([value, label]) => (
            <Chip key={value} active={kind === value} onClick={() => setKind(value)}>
              {label}
            </Chip>
          ))}
          <div className="mx-1 w-px shrink-0 bg-white/10" aria-hidden="true" />
          {['All', ...uni.categories].map((cat) => (
            <Chip key={cat} active={category === cat} onClick={() => setCategory(cat)}>
              {cat === 'All' ? 'All categories' : cat}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-1 text-xs text-gray-500">
        <span>
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'result' : 'results'}`}
        </span>
        <div className="flex items-center gap-3">
          <label className="flex min-h-[32px] cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand"
              checked={showSold}
              onChange={(e) => setShowSold(e.target.checked)}
            />
            Show sold
          </label>
          <div className="flex rounded-full bg-white/[0.06] p-0.5" role="radiogroup" aria-label="View">
            {[
              ['grid', LayoutGrid, 'Grid view'],
              ['map', MapIcon, 'Map view'],
            ].map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={view === value}
                aria-label={label}
                title={label}
                onClick={() => setView(value)}
                className={`flex h-8 w-9 items-center justify-center rounded-full transition-colors ${
                  view === value ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 min-h-[300px]">
        {loading ? (
          <ListingSkeletons count={6} />
        ) : error ? (
          <Notice>{error}</Notice>
        ) : view === 'map' ? (
          <div>
            <ListingsMap listings={filtered} center={uni.map} onOpen={onOpen} />
            <p className="mt-2 px-1 text-xs text-gray-500">
              {filtered.filter((l) => l.geo).length} of {filtered.length} listings have a map pin. Tap a price to open it.
            </p>
          </div>
        ) : filtered.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((l) => (
              <ListingCard key={l.id} listing={l} onOpen={onOpen} />
            ))}
          </div>
        ) : listings.length ? (
          <EmptyState
            icon={Search}
            title="No matching listings"
            text="Try another search or category."
            action={
              filtersActive && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title={`Nothing for sale at ${uni.shortName} yet`}
            text="Be the first: list something in under a minute."
            action={
              <Button onClick={onSell}>
                <Plus className="h-4 w-4" /> Sell something
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
