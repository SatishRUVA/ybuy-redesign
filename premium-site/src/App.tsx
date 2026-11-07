import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, MouseEvent, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import gsap from 'gsap';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Bell, Camera, Check, CheckCircle2, ChevronDown,
  Compass, Heart, MapPin, MessageCircle, Plus,
  Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Tent, Waves, Wrench, X, CalendarCheck2, } from 'lucide-react';
import { categories, filterListings, listings, rentalTotal } from './data';
import type { Category, Listing, Sort } from './data';
import CalendarRange from './CalendarRange';
import AuctionRail from './AuctionRail';
import { auctionTime, createDemoAuctions, isHostAuction } from './auctions';
import type { Auction } from './auctions';
import { todayIso } from './calendar';
import LocationPicker from './LocationPicker';
import InlineSearch from './InlineSearch';
import HeroShowcase from './HeroShowcase';
import ProfileMenu from './ProfileMenu';
import { DEFAULT_RADIUS, LocationError, normalizeLocation, radiusLabel, requestCurrentPosition } from './location';
import type { LocationStatus, Radius, UserLocation } from './location';
import { usePath } from './router';
import { useDemo } from './flows/store';
import { isFocusedFlow, renderFlowRoute } from './flows/routes';
import { seedDraft } from './flows/hosting/listing-draft';
import ListingReviews from './flows/trips/ListingReviews';

type Panel = 'location' | 'filters' | 'host' | 'how' | null;
const categoryIcons = { 'All gear': Compass, Outdoors: Tent, Cameras: Camera, Tools: Wrench, 'On the water': Waves, Celebrations: Sparkles };

function Brand() {
  return <span className="brand"><svg viewBox="0 0 34 36" aria-hidden="true"><path d="M17 32V17M17 21C3 20 1 6 3 3c12 0 16 10 14 18ZM17 21C31 20 33 6 31 3c-12 0-16 10-14 18Z" /></svg><span>ybuy<span className="brand-period">.</span></span></span>;
}

/** Popular gear shown as one-tap fills for the mobile search. */
const QUICK_PICKS = ['Tent', 'Camera', 'Bike', 'Paddleboard', 'Projector', 'Party tent'];

function RouteLink({ href, onNavigate, children, className, label }: { href: string; onNavigate: (path: string) => void; children: ReactNode; className?: string; label?: string }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(href);
  }
  return <a href={href} onClick={handleClick} className={className} aria-label={label}>{children}</a>;
}

function PanelDialog({ open, onClose, title, description, children, wide = false, initialFocus }: { open: boolean; onClose: () => void; title: string; description: string; children: ReactNode; wide?: boolean; initialFocus?: string }) {
  const opener = useRef<HTMLElement | null>(null);
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className={`dialog-sheet ${wide ? 'dialog-sheet--wide' : ''}`} onEscapeKeyDown={(event) => { if (event.target instanceof Element && event.target.closest('.range-calendar')) event.preventDefault(); }} onOpenAutoFocus={(event) => { opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; const target = initialFocus && document.querySelector<HTMLElement>(initialFocus); if (target) { event.preventDefault(); requestAnimationFrame(() => target.focus()); } }} onCloseAutoFocus={(event) => { if (opener.current?.isConnected) { event.preventDefault(); opener.current.focus(); } }}>
        <header className="dialog-heading"><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close dialog"><X size={20} /></Dialog.Close></header>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export default function App() {
  const { path, navigate } = usePath();
  const [panel, setPanel] = useState<Panel>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [queryDraft, setQueryDraft] = useState('');
  const [category, setCategory] = useState<Category>('All gear');
  const [location, setLocation] = useState<UserLocation>({ kind: 'none' });
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationDraft, setLocationDraft] = useState('');
  const [locationAttention, setLocationAttention] = useState(false);
  const [radius, setRadius] = useState<Radius>(DEFAULT_RADIUS);
  const pendingAction = useRef<(() => void) | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [maxPrice, setMaxPrice] = useState(100);
  const [sort, setSort] = useState<Sort>('Recommended');
  const demo = useDemo();
  const { user, toast, notify: setToast, auctions, setAuctions, requireAuth, setCheckoutDraft, unreadMessages, unreadNotices } = demo;
  const [searchError, setSearchError] = useState('');
  const [hostError, setHostError] = useState('');
  const pageRef = useRef<HTMLElement>(null);
  const previousPath = useRef(path);
  const savedPage = path === '/saved';
  const myListings = demo.data.myListings;
  /** Member-published listings appear first, ahead of the sample collection. */
  const catalog = useMemo(() => [...(myListings ?? []), ...listings], [myListings]);
  /** Signed-in members go straight to the wizard; guests sign in first and land back on it. */
  const startListing = () => { setPanel(null); requireAuth(() => navigate('/hosting/new'), '/hosting/new'); };
  const item = path.startsWith('/gear/') ? catalog.find((listing) => `/gear/${listing.id}` === path) : undefined;
  const isHome = path === '/' || path === '/explore' || savedPage;
  const flowPage = isHome || item ? null : renderFlowRoute(path);
  const focused = isFocusedFlow(path);
  // Radius only narrows results once the user has shared or entered a location; casual browsing sees everything.
  const maxDistance = location.kind === 'none' ? null : radius;
  const visible = useMemo(() => filterListings(catalog, { query, category, maxPrice, sort, favoritesOnly: savedPage, favorites, maxDistance }), [query, category, maxPrice, sort, savedPage, favorites, maxDistance]);

  useEffect(() => {
    if (flowPage) { if (previousPath.current !== path) pageRef.current?.focus({ preventScroll: true }); previousPath.current = path; return; }
    document.title = item ? `${item.title} | YBuy` : savedPage ? 'Your saved gear | YBuy' : isHome ? 'YBuy | More moments. Less owning.' : 'Page not found | YBuy';
    if (previousPath.current !== path) pageRef.current?.focus({ preventScroll: true });
    previousPath.current = path;
  }, [path, item, savedPage, isHome, flowPage]);

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.from('.page-intro', { opacity: 0, y: 12, duration: 0.6, stagger: 0.06, ease: 'power3.out' });
      }, pageRef);
      return () => context.revert();
    });
    return () => media.revert();
  }, [path]);

  function toggleFavorite(id: string) {
    setFavorites((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function go(next: string) {
    setPanel(null);
    navigate(next);
  }

  /** Asks the browser for location. Only called from explicit user intent, never on load. */
  async function locate(): Promise<boolean> {
    setLocationStatus('requesting');
    try {
      const coords = await requestCurrentPosition();
      setLocation({ kind: 'current', ...coords });
      setLocationDraft('');
      setLocationStatus('granted');
      setLocationAttention(false);
      return true;
    } catch (error) {
      setLocationStatus(error instanceof LocationError ? error.reason : 'unavailable');
      setLocationAttention(true);
      return false;
    }
  }

  function runPendingAction() {
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  }

  /** Gate for serious actions (bid, request, nearest sort): ensures a location before continuing. */
  function requireLocation(action: () => void) {
    if (location.kind !== 'none') { action(); return; }
    if (locationStatus === 'requesting') return;
    pendingAction.current = action;
    const askManually = () => { setLocationAttention(true); setPanel('location'); };
    if (locationStatus === 'denied' || locationStatus === 'unavailable') { askManually(); return; }
    void locate().then((granted) => { if (granted) runPendingAction(); else askManually(); });
  }

  /** Saves a typed location; highlights the field when it is missing or invalid. */
  function commitTypedLocation(): boolean {
    const label = normalizeLocation(locationDraft);
    if (!label) { setLocationAttention(true); return false; }
    setLocation({ kind: 'manual', label });
    setLocationDraft(label);
    setLocationAttention(false);
    return true;
  }

  function submitLocationPanel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!locationDraft.trim() && location.kind === 'current') { setPanel(null); runPendingAction(); return; }
    if (!commitTypedLocation()) { document.getElementById('panel-location')?.focus(); return; }
    setPanel(null);
    runPendingAction();
  }

  function updateLocationDraft(value: string) {
    setLocationDraft(value);
    if (value.trim()) setLocationAttention(false);
  }

  /** Brings the inline search into view and puts the cursor in "What" so users can start typing. */
  function focusSearch() {
    const input = document.getElementById('search-query');
    input?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    input?.focus({ preventScroll: true });
  }

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((start && !end) || (!start && end) || (start && end && !rentalTotal(1, start, end))) {
      setSearchError('Choose both dates, with the return date after the pickup date.');
      return;
    }
    // Searching is a serious intent: use a typed location, an existing one, or ask for permission once.
    if (locationDraft.trim()) {
      if (!commitTypedLocation()) { document.getElementById('search-location')?.focus(); return; }
    } else if (location.kind === 'none') {
      if (locationStatus === 'denied' || locationStatus === 'unavailable') { setLocationAttention(true); document.getElementById('search-location')?.focus(); return; }
      void locate().then((granted) => { if (granted) finishSearch(); else document.getElementById('search-location')?.focus(); });
      return;
    }
    finishSearch();
  }

  function finishSearch() {
    setQuery(queryDraft.trim());
    setSearchError('');
    if (!isHome || savedPage) navigate('/explore');
    else window.setTimeout(() => document.getElementById('discover')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }), 50);
  }

  function clearFilters() {
    setQuery('');
    setQueryDraft('');
    setCategory('All gear');
    setMaxPrice(100);
    setSort('Recommended');
  }

  const hasFilters = !!query || category !== 'All gear' || maxPrice < 100;

  return <div className="premium-app">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <div className="header-inner container">
        <RouteLink href="/" onNavigate={go} label="YBuy home"><Brand /></RouteLink>
        <nav className="desktop-navigation" aria-label="Main">
          <RouteLink href="/" onNavigate={go} className={isHome && !savedPage ? 'active' : ''}>Explore</RouteLink>
          <RouteLink href="/saved" onNavigate={go} className={savedPage ? 'active' : ''}>Saved <span className="nav-count">{favorites.length || ''}</span></RouteLink>
          <RouteLink href="/trips" onNavigate={go} className={path.startsWith('/trips') ? 'active' : ''}>Trips</RouteLink>
          <button onClick={() => setPanel('how')}>How it works</button>
        </nav>
        <div className="header-actions">
          {user && <RouteLink href="/hosting" onNavigate={go} className={`host-link host-link--quiet ${path.startsWith('/hosting') ? 'active' : ''}`}>Hosting</RouteLink>}
          <button className={`host-link${user ? ' host-link--primary' : ''}`} onClick={() => (user ? startListing() : setPanel('host'))}><Plus size={16} />{user ? 'List your gear' : 'Share your gear'}</button>
          {user && path !== '/hosting/new' && <button className="header-icon header-create" onClick={startListing} aria-label="List your gear"><Plus size={19} /></button>}
          {user && <RouteLink href="/inbox" onNavigate={go} className="header-icon header-inbox" label={`Inbox${unreadMessages ? `, ${unreadMessages} unread` : ''}`}><MessageCircle size={19} />{unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}</RouteLink>}
          {user && <RouteLink href="/notifications" onNavigate={go} className="header-icon" label={`Notifications${unreadNotices ? `, ${unreadNotices} unread` : ''}`}><Bell size={19} />{unreadNotices > 0 && <span className="badge">{unreadNotices}</span>}</RouteLink>}
          {!user && <div className="auth-actions"><RouteLink href="/signin" onNavigate={go} className="auth-login">Log in</RouteLink><RouteLink href="/signup" onNavigate={go} className="auth-signup-button">Sign up</RouteLink></div>}
          <ProfileMenu user={user} savedCount={favorites.length} onNavigate={go} onStartListing={startListing} onHowItWorks={() => setPanel('how')} onSignOut={() => { demo.signOut(); go('/'); }} />
        </div>
      </div>
    </header>

    <main id="main" ref={pageRef} tabIndex={-1}>
      {isHome ? <>
        {!savedPage && !query && path !== '/explore' && <HeroShowcase onNavigate={go} onExplore={focusSearch} onShare={user ? startListing : undefined} />}

        <section className={`search-section container ${savedPage || query || path === '/explore' ? 'search-section--standalone' : ''}`} aria-label="Search rentals">
          {savedPage && <div className="saved-intro page-intro"><span className="eyeline">A few things you have your eye on</span><h1>Your next good day,<br />saved for later.</h1><p>A little inspiration, all in one place.</p></div>}
          {path === '/explore' && <div className="browse-intro page-intro"><h1>Find something worth borrowing.</h1><p>Explore the sample neighborhood collection.</p></div>}
          {query && path !== '/explore' && <h1 className="results-title">Find your next good day.</h1>}
          {!savedPage && !query && path !== '/explore' && <div className="mobile-search-intro">
            <p className="eyeline">{user ? `Hi ${user.firstName}` : 'Rent from neighbors'}</p>
            <h2>What do you need{user ? '' : ' today'}?</h2>
          </div>}
          <InlineSearch query={queryDraft} onQueryChange={setQueryDraft} location={location} locationStatus={locationStatus} locationDraft={locationDraft} locationAttention={locationAttention} onLocationDraftChange={updateLocationDraft} onUseCurrent={() => { void locate(); }} radius={radius} onRadiusChange={setRadius} start={start} end={end} onDatesChange={(first, last) => { setStart(first); setEnd(last); setSearchError(''); }} error={searchError} onSubmit={applySearch} />
          {!savedPage && !query && path !== '/explore' && <div className="mobile-quick-picks" role="group" aria-label="Popular searches">{QUICK_PICKS.map((pick) => <button key={pick} type="button" className={queryDraft.trim().toLowerCase() === pick.toLowerCase() ? 'is-active' : ''} aria-pressed={queryDraft.trim().toLowerCase() === pick.toLowerCase()} onClick={() => { setQueryDraft(pick); document.getElementById('search-location')?.focus({ preventScroll: true }); }}>{pick}</button>)}</div>}
          {!savedPage && <div className="search-footnote"><span><ShieldCheck size={14} /> A little more trust. A lot less hassle.</span><span>Discover. Request. Enjoy.</span></div>}
        </section>

        {!savedPage && <AuctionRail auctions={auctions} onRemove={(id) => { setAuctions((current) => current.filter((auction) => auction.id !== id)); setToast('Sample auction disappeared. No real auction was changed.'); }} onReset={() => { setAuctions(() => createDemoAuctions()); setToast('All 10 demo auctions restored.'); }} onBid={(id) => {
          const own = auctions.find((value) => value.id === id && !!value.hostId && value.hostId === user?.id);
          if (own) { go(`/auctions/${id}`); return; }
          requireAuth(() => requireLocation(() => {
          const auction = auctions.find((value) => value.id === id);
          if (!auction || auction.endsAt <= Date.now()) { setToast('This sample auction has ended. Try another auction.'); return; }
          if (demo.placeBid(id, auction.currentBid + 2)) setToast(`Demo bid placed: $${auction.currentBid + 2} per rental day. No payment or real bid was made.`);
        }), '/');
        }} />}

        <section className="discovery container" id="discover" aria-labelledby="discovery-title">
          <div className="discovery-toolbar">
            <nav className="category-navigation" aria-label="Rental categories">
              {categories.map((name) => {
                const Icon = categoryIcons[name];
                return <button key={name} className={category === name ? 'selected' : ''} aria-pressed={category === name} onClick={() => setCategory(name)}><Icon size={21} strokeWidth={1.6} /><span>{name}</span>{category === name && <span className="category-indicator" />}</button>;
              })}
            </nav>
            <button className={`filter-button ${maxPrice < 100 ? 'filter-button--active' : ''}`} onClick={() => setPanel('filters')}><SlidersHorizontal size={16} />Filters{maxPrice < 100 && <span className="filter-dot" />}</button>
          </div>
          <div className="section-heading">
            <div><h2 id="discovery-title">{savedPage ? 'Your saved collection' : query ? `Results for “${query}”` : category === 'All gear' ? 'Good finds, right around you' : `${category}, close to home`}</h2><p>{savedPage ? `${visible.length} sample ${visible.length === 1 ? 'find' : 'finds'} saved for your next adventure` : 'Thoughtfully shared gear for days worth remembering.'}</p></div>
            <label className="sort-control"><span className="sr-only">Sort rentals</span><select value={sort} onChange={(event) => { const next = event.target.value as Sort; if (next === 'Closest first') requireLocation(() => setSort(next)); else setSort(next); }}><option>Recommended</option><option>Price: low to high</option><option>Closest first</option></select><ChevronDown size={14} aria-hidden="true" /></label>
          </div>
          <p className="sample-inventory">{location.kind === 'none' ? 'Showing the sample neighborhood collection.' : `${radiusLabel(radius)} of ${location.kind === 'current' ? 'your current location' : location.label} (illustrative distances).`} Listings, reviews, and badges are fictional; photos and availability are illustrative.</p>
          {hasFilters && <div className="active-filters"><span>{visible.length} matching rentals</span><button onClick={clearFilters}>Clear filters <X size={13} /></button></div>}
          {visible.length ? <div className="listing-grid">{visible.map((listing) => <ListingCard key={listing.id} listing={listing} favorite={favorites.includes(listing.id)} onFavorite={() => toggleFavorite(listing.id)} onNavigate={go} />)}</div> : <div className="empty-state"><Heart size={32} strokeWidth={1.3} /><h3>{savedPage ? 'Keep a little inspiration here.' : 'Nothing here just yet.'}</h3><p>{savedPage ? 'Tap the heart on gear you would love to borrow.' : 'Try a different category, a higher budget, or a new search.'}</p><button className="primary-button" onClick={() => { clearFilters(); if (savedPage) go('/explore'); }}>Explore all gear <ArrowRight size={16} /></button></div>}
        </section>

        {!savedPage && !query && category === 'All gear' && <>
          <section className="collection-section container" aria-labelledby="collection-title">
            <div className="section-heading"><div><h2 id="collection-title">Not just gear. A reason to go.</h2><p>A little inspiration for your next free day.</p></div><span className="collection-note">Take the long way home <ArrowUpRight size={14} /></span></div>
            <div className="collection-grid">
              <Collection image="/images/hike.jpg" alt="Friends exploring a sunlit mountain trail" title="Get a little lost." subtitle="For the trail you have been thinking about." onClick={() => { setCategory('Outdoors'); document.getElementById('discover')?.scrollIntoView(); }} label="Explore outdoor gear" />
              <Collection image="/images/party.jpg" alt="An indoor banquet table prepared for a gathering" title="Make it an occasion." subtitle="The little things that bring everyone together." onClick={() => { setCategory('Celebrations'); document.getElementById('discover')?.scrollIntoView(); }} label="Explore celebration gear" />
            </div>
          </section>
          <section className="hosting-section container">
            <div className="hosting-illustration" aria-hidden="true"><div className="floating-gear floating-gear--one"><img src="/images/camera.jpg" alt="" /><span>Ready for its next story.</span></div><div className="floating-gear floating-gear--two"><img src="/images/bike.jpg" alt="" /><span>Better out there.</span></div><span className="hosting-spark"><Sparkles size={24} /></span></div>
            <div className="hosting-copy"><span className="eyeline">Good things are better shared</span><h2>Your gear has<br />more stories in it.</h2><p>That camera on the shelf. The tent in the garage.<br />Give them a next chapter, with someone nearby.</p><button className="primary-button" onClick={() => (user ? startListing() : setPanel('host'))}>Become a YBuy host <ArrowUpRight size={17} /></button><span className="hosting-note">Your gear. Your schedule. Your choice.</span></div>
          </section>
        </>}
      </> : flowPage ? flowPage : item ? <Detail listing={item} liveAuction={auctions.find((auction) => auction.listing.id === item.id && isHostAuction(auction))} favorite={favorites.includes(item.id)} onFavorite={() => toggleFavorite(item.id)} onNavigate={go} onReserve={(first, last) => requireLocation(() => requireAuth(() => { setCheckoutDraft({ listingId: item.id, start: first, end: last }); navigate('/checkout'); }, `/gear/${item.id}`))} defaultStart={start} defaultEnd={end} /> : <section className="not-found container page-intro"><Compass size={52} strokeWidth={1.2} /><span className="eyeline">A small detour</span><h1>This path leads<br />somewhere else.</h1><p>That page is not in this collection. There is still plenty to discover.</p><RouteLink href="/" onNavigate={go} className="primary-button">Back to exploring <ArrowRight size={16} /></RouteLink></section>}
    </main>

    {!focused && <footer className="site-footer"><div className="footer-inner container"><div><RouteLink href="/" onNavigate={go} label="YBuy home"><Brand /></RouteLink><p>A little more sharing.<br />A lot more living.</p></div><div className="footer-links"><button onClick={() => setPanel('how')}>How YBuy works</button><button onClick={() => (user ? startListing() : setPanel('host'))}>Share your gear</button><RouteLink href="/saved" onNavigate={go}>Your saved finds</RouteLink><RouteLink href="/protection" onNavigate={go}>YBuy Protection</RouteLink><RouteLink href="/help" onNavigate={go}>Help center</RouteLink><RouteLink href="/guidelines" onNavigate={go}>Community guidelines</RouteLink><RouteLink href="/terms" onNavigate={go}>Terms</RouteLink><RouteLink href="/privacy" onNavigate={go}>Privacy</RouteLink></div><div className="footer-concept"><span className="concept-badge">Design preview</span><p>Sample listings. No live bookings or payments.</p><span>Built for a good day, wherever you are.</span></div></div><div className="footer-bottom container"><span>© {new Date().getFullYear()} YBuy. Premium concept.</span><span>English (US) <span aria-hidden="true">·</span> USD</span></div></footer>}

    {!focused && <nav className="mobile-navigation" aria-label="Mobile main">
      <RouteLink href="/" onNavigate={go} className={isHome && !savedPage ? 'active' : ''}><Compass size={21} /><span>Explore</span></RouteLink>
      <RouteLink href="/saved" onNavigate={go} className={savedPage ? 'active' : ''}><Heart size={21} /><span>Saved</span></RouteLink>
      <button type="button" className={`mobile-create${path === '/hosting/new' ? ' active' : ''}`} onClick={() => (user ? startListing() : setPanel('host'))} aria-label={user ? 'List your gear' : 'Share your gear'}><span className="mobile-create-disc"><Plus size={22} strokeWidth={2.4} /></span><span>{user ? 'List' : 'Share'}</span></button>
      <RouteLink href="/trips" onNavigate={go} className={path.startsWith('/trips') || path.startsWith('/wanted') ? 'active' : ''}><CalendarCheck2 size={21} /><span>Trips</span></RouteLink>
      <RouteLink href="/inbox" onNavigate={go} className={path.startsWith('/inbox') ? 'active' : ''} label={`Inbox${user && unreadMessages ? `, ${unreadMessages} unread` : ''}`}><span className="nav-icon-wrap"><MessageCircle size={21} />{user && unreadMessages > 0 && <span className="badge badge--dot" aria-hidden="true" />}</span><span>Inbox</span></RouteLink>
    </nav>}

    <PanelDialog open={panel === 'location'} onClose={() => { pendingAction.current = null; setPanel(null); }} title="Where should we look?" description="Add a location so bids, requests, and distances are accurate." initialFocus="#panel-location">
      <form className="panel-form" onSubmit={submitLocationPanel}>
        <LocationPicker id="panel-location" location={location} status={locationStatus} draft={locationDraft} radius={radius} attention={locationAttention} onDraftChange={updateLocationDraft} onUseCurrent={() => { void locate().then((granted) => { if (granted) { setPanel(null); runPendingAction(); } }); }} onRadiusChange={setRadius} />
        <p className="form-disclaimer">Your location stays in this browser tab. Nothing is saved or shared in this preview.</p>
        <button className="primary-button full-width" type="submit" disabled={locationStatus === 'requesting'}>Continue <ArrowRight size={17} /></button>
      </form>
    </PanelDialog>

    <PanelDialog open={panel === 'filters'} onClose={() => setPanel(null)} title="A little more your kind of thing." description="Narrow the sample collection to your budget.">
      <div className="panel-form"><label className="budget-label">Daily budget <strong>Up to ${maxPrice}</strong><input aria-label="Maximum daily price" type="range" min="10" max="100" step="1" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} /><span className="range-endpoints"><span>$10</span><span>$100</span></span></label><p className="form-disclaimer">Prices are illustrative. No additional fees are included in this concept.</p><div className="panel-actions"><button className="text-button" onClick={() => setMaxPrice(100)}>Reset</button><button className="primary-button" onClick={() => setPanel(null)}>Show {visible.length} finds <ArrowRight size={16} /></button></div></div>
    </PanelDialog>

    <PanelDialog open={panel === 'host'} onClose={() => setPanel(null)} title="Start your gear's next chapter." description="Imagine sharing something you already love.">
      <form className="panel-form" onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const title = data.get('title');
        const price = Number(data.get('price'));
        if (typeof title !== 'string' || !title.trim() || !Number.isFinite(price) || price < 1 || price > 1000) { setHostError('Enter a listing name and a daily price between $1 and $1,000.'); return; }
        setHostError('');
        seedDraft(title.trim(), price);
        startListing();
      }}>
        <div className="host-panel-art"><Camera size={28} /><Tent size={38} /><Wrench size={27} /></div>
        <label>What would you like to share?<input name="title" required placeholder="e.g. My two-person tent" maxLength={100} /></label><label>What is your daily price?<span className="input-shell"><span>$</span><input name="price" required type="number" min="1" max="1000" step="1" placeholder="25" /><span>/ day</span></span></label>
        {hostError && <p className="field-error" role="alert">{hostError}</p>}
        <p className="form-disclaimer">Next, add photos, details and pricing. You can sign in or create an account along the way.</p><button className="primary-button full-width" type="submit">Continue <ArrowRight size={17} /></button>
      </form>
    </PanelDialog>

    <PanelDialog open={panel === 'how'} onClose={() => setPanel(null)} title="Simple, from the first hello." description="The experience we are designing for your neighborhood.">
      <ol className="how-list"><li><span><Search size={22} /></span><div><h3>Find a little possibility.</h3><p>Explore gear close to home and pick the dates that fit your plans.</p></div></li><li><span><MessageCircle size={22} /></span><div><h3>Ask someone nearby.</h3><p>Request to borrow and agree on the details with the owner.</p></div></li><li><span><CheckCircle2 size={22} /></span><div><h3>Make the most of it.</h3><p>Pick it up, enjoy your day, then return it ready for its next adventure.</p></div></li></ol><p className="form-disclaimer how-disclaimer">This concept demonstrates the flow. Real messaging, payments, and availability will be integrated after design approval.</p>
    </PanelDialog>

    <div className={`toast ${toast ? 'toast--visible' : ''}`} role="status" aria-live="polite">{toast && <><CheckCircle2 size={20} /><span>{toast}</span><button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={17} /></button></>}</div>
  </div>;
}

function ListingCard({ listing, favorite, onFavorite, onNavigate }: { listing: Listing; favorite: boolean; onFavorite: () => void; onNavigate: (path: string) => void }) {
  return <article className="listing-card">
    <div className="listing-media"><RouteLink href={`/gear/${listing.id}`} onNavigate={onNavigate} label={`View ${listing.title}`}><img src={listing.image} alt={listing.imageAlt} width={900} height={700} loading="lazy" decoding="async" /></RouteLink>{listing.tag && <span className="listing-tag">{listing.tag}</span>}<button className={`favorite-button ${favorite ? 'is-favorite' : ''}`} onClick={onFavorite} aria-pressed={favorite} aria-label={`${favorite ? 'Unsave' : 'Save'} ${listing.title}`}><Heart size={19} fill={favorite ? 'currentColor' : 'none'} /></button></div>
    <div className="listing-info"><div className="listing-title-row"><h3><RouteLink href={`/gear/${listing.id}`} onNavigate={onNavigate}>{listing.title}</RouteLink></h3><span className="listing-rating"><Star size={11} fill="currentColor" />{listing.reviews ? listing.rating.toFixed(2) : 'New'}</span></div><p>{listing.distance.toFixed(1)} miles away <span aria-hidden="true">·</span> Shared by {listing.owner}</p><span className="listing-description">{listing.category === 'Outdoors' ? 'A little more time outside' : listing.category === 'Cameras' ? 'For the moments that matter' : listing.category === 'Tools' ? 'Make something your own' : listing.category === 'On the water' ? 'A slower kind of day' : 'Make room for everyone'}</span><div className="listing-bottom"><span><strong>${listing.price}</strong> <span>/ day</span></span><span className="listing-verified"><ShieldCheck size={12} />Neighbor verified*</span></div></div>
  </article>;
}

function Collection({ image, alt, title, subtitle, onClick, label }: { image: string; alt: string; title: string; subtitle: string; onClick: () => void; label: string }) {
  return <button className="collection-card" onClick={onClick} aria-label={label}><img src={image} alt={alt} loading="lazy" width={900} height={600} /><span className="collection-shade" /><span className="collection-text"><strong>{title}</strong><span>{subtitle}</span></span><span className="collection-arrow"><ArrowUpRight size={19} /></span></button>;
}

/** Points renters (and the owner) at the live auction running for this listing. */
function LiveAuctionBanner({ auction, onNavigate }: { auction: Auction; onNavigate: (path: string) => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  if (auction.endsAt <= now) return null;
  const scheduled = auction.startedAt > now;
  const href = `/auctions/${auction.id}`;
  return <a className="detail-auction-banner page-intro" href={href} onClick={(event) => { event.preventDefault(); onNavigate(href); }}>
    <span className="detail-auction-status">{scheduled ? 'Auction soon' : <><span className="live-dot" aria-hidden="true" />Live auction</>}</span>
    <span className="detail-auction-copy"><strong>{scheduled ? `Bidding opens in ${auctionTime(auction.startedAt - now)}` : `${auction.bids ? 'Current bid' : 'Starts at'} $${auction.currentBid} / day`}</strong><small>{scheduled ? 'Bid on the first rental and save on the usual price.' : `${auction.bids} bid${auction.bids === 1 ? '' : 's'} · ${auctionTime(auction.endsAt - now)} left`}</small></span>
    <span className="detail-auction-cta">{scheduled ? 'Preview' : 'Bid now'}<ArrowRight size={15} /></span>
  </a>;
}

function Detail({ listing, liveAuction, favorite, onFavorite, onNavigate, onReserve, defaultStart, defaultEnd }: { listing: Listing; liveAuction?: Auction; favorite: boolean; onFavorite: () => void; onNavigate: (path: string) => void; onReserve: (start: string, end: string) => void; defaultStart: string; defaultEnd: string }) {
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [error, setError] = useState('');
  const [photoOpen, setPhotoOpen] = useState(false);
  const total = rentalTotal(listing.price, start, end);

  function request(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!total || start < todayIso()) {
      setError('Choose a pickup date from today onward and a later return date.');
      return;
    }
    setError('');
    onReserve(start, end);
  }

  return <div className="detail-page container">
    <div className="detail-topline"><RouteLink href="/explore" onNavigate={onNavigate} className="back-link"><ArrowLeft size={16} />All gear</RouteLink><button className="text-button" onClick={onFavorite}><Heart size={17} fill={favorite ? 'currentColor' : 'none'} />{favorite ? 'Saved' : 'Save for later'}</button></div>
    <h1 className="page-intro">{listing.title}</h1>
    <div className="detail-meta"><span><Star size={14} fill="currentColor" />{listing.reviews ? <>{listing.rating} <span className="muted">({listing.reviews} sample reviews)</span></> : 'New listing'}</span><span><MapPin size={14} />{listing.distance} mi away</span><span>Irving, Texas · {listing.id.startsWith('my-') ? 'Your listing' : 'Sample listing'}</span></div>
    {liveAuction && <LiveAuctionBanner auction={liveAuction} onNavigate={onNavigate} />}
    <button className="detail-image page-intro" onClick={() => setPhotoOpen(true)} aria-label="Expand listing photo"><img src={listing.image} alt={listing.imageAlt} width={900} height={700} /><span className="detail-photo-label">A closer look <Plus size={16} /></span></button>
    <div className="detail-columns">
      <div className="detail-story"><div className="owner-heading"><div><h2>Good gear, shared by {listing.owner}.</h2><p>A neighbor with a little extra to share.</p></div><a className="owner-avatar" href={`/people/${encodeURIComponent(listing.owner)}`} onClick={(event) => { event.preventDefault(); onNavigate(`/people/${encodeURIComponent(listing.owner)}`); }} aria-label={`View ${listing.owner}'s profile`}>{listing.initials}</a></div><div className="detail-benefits"><div><ShieldCheck size={23} /><span><strong>Thoughtfully shared</strong><small>Gear that feels ready for its next adventure.</small></span></div><div><MapPin size={23} /><span><strong>A pickup close to home</strong><small>Meet your neighbor and agree on the details.</small></span></div><div><Heart size={23} /><span><strong>Less to own. More to do.</strong><small>Enjoy what you need, just when you need it.</small></span></div></div><div className="detail-about"><h2>A little about this find</h2><p>{listing.description}</p></div><div className="detail-includes"><h2>Everything you need</h2><ul>{listing.includes.map((included) => <li key={included}><Check size={17} />{included}</li>)}</ul></div><ListingReviews listingId={listing.id} /><p className="detail-passport"><RouteLink href={`/passport/${listing.id}`} onNavigate={onNavigate} className="text-button"><ShieldCheck size={16} />View item passport</RouteLink></p><div className="detail-honesty"><ShieldCheck size={19} /><p>All listings, ratings, owner details, and verification marks in this preview are fictional. Photography is illustrative, not a photograph of an actual rental.</p></div></div>
      <aside className="reservation-card" aria-labelledby="reservation-title"><div className="reservation-heading"><h2 id="reservation-title"><strong>${listing.price}</strong><span> / day</span></h2><span><Star size={12} fill="currentColor" />{listing.reviews ? listing.rating : 'New'}</span></div><p>A good day is one request away.</p><form onSubmit={request}><CalendarRange start={start} end={end} onChange={(first, last) => { setStart(first); setEnd(last); setError(''); }} />{error && <p role="alert" className="field-error">{error}</p>}{total && <div className="price-breakdown"><span>${listing.price} × {total.days} {total.days === 1 ? 'day' : 'days'}</span><strong>${total.total}</strong></div>}<button type="submit" className="primary-button full-width">Reserve <ArrowRight size={16} /></button><span className="reservation-note">You won't be charged yet. Owner confirms first.</span></form><div className="reservation-total"><span>Illustrative total</span><strong>{total ? `$${total.total}` : 'Choose dates'}</strong></div><p className="form-disclaimer">Date availability and pricing are not connected to a backend.</p></aside>
    </div>
    <PanelDialog open={photoOpen} onClose={() => setPhotoOpen(false)} title={listing.title} description="Illustrative photography for this design concept." wide><img className="expanded-photo" src={listing.image} alt={listing.imageAlt} /></PanelDialog>
  </div>;
}
