import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, Bookmark,
  CalendarDays, Camera, Check, ChevronDown, Drill, Heart, MapPin,
  MessageCircle, PackagePlus, Search, ShieldCheck, Sparkles, Tent,
  UserRound, Waves, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import logo from '@/assets/ybuy-logo.png';
import './marketplace-prototype.css';

type CategoryName = 'Everything' | 'Outdoors' | 'Tools' | 'Cameras' | 'Audio' | 'Water';
type PrototypeTab = 'Explore' | 'Saved' | 'Messages' | 'Profile';

type GearItem = {
  id: string;
  title: string;
  category: Exclude<CategoryName, 'Everything'>;
  price: number;
  distance: string;
  owner: string;
  rating: string;
  image: string;
  accent: string;
  note: string;
};

const categories: { name: CategoryName; icon: LucideIcon; color: string }[] = [
  { name: 'Everything', icon: Sparkles, color: 'lemon' },
  { name: 'Outdoors', icon: Tent, color: 'blue' },
  { name: 'Tools', icon: Drill, color: 'orange' },
  { name: 'Cameras', icon: Camera, color: 'pink' },
  { name: 'Audio', icon: MessageCircle, color: 'lavender' },
  { name: 'Water', icon: Waves, color: 'aqua' },
];

const gear: GearItem[] = [
  {
    id: 'camp-kit',
    title: 'Two-person camp kit',
    category: 'Outdoors',
    price: 28,
    distance: '0.8 mi',
    owner: 'Maya',
    rating: '5.0',
    image: 'https://images.pexels.com/photos/10513799/pexels-photo-10513799.jpeg?auto=compress&cs=tinysrgb&w=1200',
    accent: 'blue',
    note: 'Tent, sleeping pads and a lantern. Ready for Friday pickup.',
  },
  {
    id: 'camera',
    title: 'Sony a6400 + 35mm lens',
    category: 'Cameras',
    price: 42,
    distance: '1.2 mi',
    owner: 'Andre',
    rating: '4.9',
    image: 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=1000',
    accent: 'orange',
    note: 'A small mirrorless kit for portraits, trips and everyday stories.',
  },
  {
    id: 'drill',
    title: 'Cordless drill set',
    category: 'Tools',
    price: 12,
    distance: '1.6 mi',
    owner: 'Nina',
    rating: '5.0',
    image: 'https://images.pexels.com/photos/5974365/pexels-photo-5974365.jpeg?auto=compress&cs=tinysrgb&w=1000',
    accent: 'lemon',
    note: 'Driver, bits and two batteries for the shelf you keep meaning to hang.',
  },
  {
    id: 'speaker',
    title: 'Portable party speaker',
    category: 'Audio',
    price: 18,
    distance: '2.1 mi',
    owner: 'Leo',
    rating: '4.8',
    image: 'https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=1000',
    accent: 'lavender',
    note: 'Big sound, easy carry, and enough battery for the whole afternoon.',
  },
  {
    id: 'bike',
    title: 'Gravel bike, size M',
    category: 'Outdoors',
    price: 35,
    distance: '2.4 mi',
    owner: 'Sam',
    rating: '5.0',
    image: 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=1000',
    accent: 'aqua',
    note: 'Set up for paved trails and light gravel. Helmet included.',
  },
  {
    id: 'kayak',
    title: 'Tandem inflatable kayak',
    category: 'Water',
    price: 32,
    distance: '3.0 mi',
    owner: 'Priya',
    rating: '4.9',
    image: 'https://images.pexels.com/photos/1430672/pexels-photo-1430672.jpeg?auto=compress&cs=tinysrgb&w=1000',
    accent: 'blue',
    note: 'Paddles and pump included. Packs down small in your trunk.',
  },
];

const locations = ['Irving, TX', 'Dallas, TX', 'Austin, TX', 'Fort Worth, TX'];
const dateOptions = ['Any day', 'This weekend', 'Next week'];

export default function MarketplacePrototype() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryName>('Everything');
  const [location, setLocation] = useState(locations[0]);
  const [when, setWhen] = useState(dateOptions[0]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [searchLocationOpen, setSearchLocationOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'Good nearby' | 'Lowest price'>('Good nearby');
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<PrototypeTab>('Explore');
  const [selectedGear, setSelectedGear] = useState<GearItem | null>(null);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { document.title = 'YBuy — Borrow the thing. Make the day.'; }, []);

  const visibleGear = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = gear.filter((item) => {
      const inCategory = category === 'Everything' || item.category === category;
      const inSaved = tab !== 'Saved' || saved.has(item.id);
      const matchesSearch = !search || `${item.title} ${item.category} ${item.owner}`.toLowerCase().includes(search);
      return inCategory && inSaved && matchesSearch;
    });
    return sortBy === 'Lowest price' ? filtered.sort((first, second) => first.price - second.price) : filtered;
  }, [category, query, saved, sortBy, tab]);

  useEffect(() => {
    if (!selectedGear && !listModalOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusTarget = dialog?.querySelector<HTMLElement>('button, input');
    document.body.style.overflow = 'hidden';
    focusTarget?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSelectedGear(null);
      setListModalOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
      previousFocus?.focus();
    };
  }, [listModalOpen, selectedGear]);

  function toggleSaved(id: string) {
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  }

  function runSearch() {
    document.getElementById('gear-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const setCurrentTab = (next: PrototypeTab) => {
    setTab(next);
    if (next === 'Explore' || next === 'Saved') {
      setCategory('Everything');
      return;
    }
    if (next === 'Messages' || next === 'Profile') {
      setSelectedGear(null);
    }
  };

  const hasSavedItems = saved.size > 0;
  const isUtilityTab = tab === 'Messages' || tab === 'Profile';

  return (
    <div
      className="club-app"
      onClick={(event) => {
        if (!(event.target instanceof Element)) return;
        if (!event.target.closest('.location-wrap')) setLocationOpen(false);
        if (!event.target.closest('.search-dock__place')) setSearchLocationOpen(false);
        if (!event.target.closest('.search-dock__date')) setDatesOpen(false);
      }}
    >
      <a className="skip-link" href="#main-content">Skip to gear</a>
      <header className="club-header">
        <div className="club-header__inner">
          <button className="club-brand" aria-label="YBuy home" onClick={() => setCurrentTab('Explore')}>
            <img src={logo} alt="YBuy" />
          </button>
          <nav className="club-desktop-nav" aria-label="Main navigation">
            <button className={tab === 'Explore' ? 'is-active' : ''} onClick={() => setCurrentTab('Explore')}>Explore</button>
            <button className={tab === 'Saved' ? 'is-active' : ''} onClick={() => setCurrentTab('Saved')}>Saved</button>
            <a href="#how-it-works">How it works</a>
          </nav>
          <div className="club-header__actions">
            <div className="location-wrap">
              <button
                className="location-trigger"
                aria-expanded={locationOpen}
                aria-haspopup="listbox"
                onClick={() => { setLocationOpen((open) => !open); setDatesOpen(false); }}
              >
                <MapPin size={16} aria-hidden="true" />
                <span>{location}</span>
                <ChevronDown size={15} aria-hidden="true" />
              </button>
              {locationOpen && (
                <div className="choice-popover" role="listbox" aria-label="Choose a city">
                  {locations.map((city) => (
                    <button key={city} role="option" aria-selected={city === location} onClick={() => { setLocation(city); setLocationOpen(false); }}>
                      <MapPin size={15} aria-hidden="true" />{city}{city === location && <Check size={15} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="button button--lime header-list-button" onClick={() => setListModalOpen(true)}>
              <PackagePlus size={16} aria-hidden="true" /> List your gear
            </button>
            <button className="icon-button mobile-menu-button" aria-label="List your gear" onClick={() => setListModalOpen(true)}>
              <PackagePlus size={21} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {tab === 'Explore' && (
          <>
            <section className="club-hero" aria-labelledby="hero-title">
              <div className="club-hero__copy">
                <div className="hero-note"><span className="hero-note__spark">✳</span> The neighborhood gear club</div>
                <h1 id="hero-title">Borrow the thing.<br /><span>Make the day.</span></h1>
                <p>Good gear is already close by. Find it from someone in your neighborhood.</p>
                <button className="button button--lime hero-cta" onClick={runSearch}>
                  Find your thing <ArrowDownRight size={17} aria-hidden="true" />
                </button>
                <div className="hero-footnote"><span className="hero-footnote__dot" />Shared nearby. Ready for real life.</div>
              </div>
              <div className="club-hero__collage" aria-label="Camping gear available nearby">
                <div className="collage-frame" />
                <img
                  className="collage-main-photo"
                  src="https://images.pexels.com/photos/10513799/pexels-photo-10513799.jpeg?auto=compress&cs=tinysrgb&w=1400"
                  alt="Colorful tents pitched among trees"
                />
                <div className="collage-sticker">
                  <span className="sticker-star">✳</span>
                  <span><strong>Good gear</strong><small>lives around here</small></span>
                </div>
                <div className="collage-caption"><MapPin size={13} aria-hidden="true" /> A weekend, within reach</div>
                <div className="collage-peek">
                  <img src="https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=420" alt="" />
                  <span><small>Also nearby</small><strong>A camera for the trip</strong></span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </div>
              </div>
              <div className="hero-side-mark" aria-hidden="true">YB<br />UY</div>
            </section>

            <section className="search-dock" aria-label="Search local rentals">
              <div className="search-dock__field search-dock__keyword">
                <label htmlFor="gear-query">I’m looking for</label>
                <div><Search size={18} aria-hidden="true" /><input id="gear-query" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runSearch()} placeholder="A tent, a drill, a little inspiration…" /></div>
              </div>
              <div className="search-dock__divider" />
              <div className="search-dock__field search-dock__place">
                <span className="search-dock__label">Around</span>
                <button className="search-dock__select" aria-expanded={searchLocationOpen} onClick={() => { setSearchLocationOpen((open) => !open); setDatesOpen(false); setLocationOpen(false); }}>
                  <MapPin size={16} aria-hidden="true" />{location}<ChevronDown size={14} aria-hidden="true" />
                </button>
                {searchLocationOpen && (
                  <div className="choice-popover search-location-popover" role="listbox" aria-label="Choose a city">
                    {locations.map((city) => (
                      <button key={city} role="option" aria-selected={city === location} onClick={() => { setLocation(city); setSearchLocationOpen(false); }}>
                        <MapPin size={15} aria-hidden="true" />{city}{city === location && <Check size={15} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="search-dock__divider" />
              <div className="search-dock__field search-dock__date">
                <span className="search-dock__label">When</span>
                <button className="search-dock__select" aria-expanded={datesOpen} onClick={() => { setDatesOpen((open) => !open); setLocationOpen(false); }}>
                  <CalendarDays size={16} aria-hidden="true" />{when}<ChevronDown size={14} aria-hidden="true" />
                </button>
                {datesOpen && (
                  <div className="choice-popover date-popover" role="listbox" aria-label="Choose dates">
                    {dateOptions.map((option) => (
                      <button key={option} role="option" aria-selected={option === when} onClick={() => { setWhen(option); setDatesOpen(false); }}>
                        <CalendarDays size={15} aria-hidden="true" />{option}{option === when && <Check size={15} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="button button--blue search-submit" onClick={runSearch}><Search size={17} aria-hidden="true" /><span>Search</span></button>
            </section>

            <div className="search-trust" aria-label="Rental benefits">
              <span><ShieldCheck size={15} aria-hidden="true" />Protected payments</span>
              <span><BadgeCheck size={15} aria-hidden="true" />Owner-approved rentals</span>
              <span><MapPin size={15} aria-hidden="true" />Always close to home</span>
            </div>

            <section className="discovery-section" aria-labelledby="categories-title">
              <div className="section-heading">
                <div><span className="section-kicker">Start with a spark</span><h2 id="categories-title">What are you up to?</h2></div>
                <button className="text-link" onClick={() => { setCategory('Everything'); runSearch(); }}>See all gear <ArrowUpRight size={16} /></button>
              </div>
              <div className="category-ribbon" aria-label="Gear categories">
                {categories.map(({ name, icon: Icon, color }) => (
                  <button
                    key={name}
                    className={`category-chip category-chip--${color} ${category === name ? 'is-selected' : ''}`}
                    aria-pressed={category === name}
                    onClick={() => { setCategory(name); setTab('Explore'); }}
                  >
                    <span className="category-chip__icon"><Icon size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                    <span>{name}</span><ArrowUpRight size={14} className="category-chip__arrow" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {(tab === 'Explore' || tab === 'Saved') && (
          <section className="gear-section" id="gear-grid" aria-labelledby="gear-title">
            <div className="gear-heading">
              <div>
                <span className="section-kicker">{tab === 'Saved' ? 'Your shortlist' : 'Good finds, close by'}</span>
                <h2 id="gear-title">{tab === 'Saved' ? 'Saved for later' : 'Ready when you are'}</h2>
                <p>{tab === 'Saved' ? 'Keep the good ones in one place.' : `${visibleGear.length} things to borrow around ${location.split(',')[0]}.`}</p>
                {tab === 'Explore' && <span className="sample-note">Sample listings · no live rental requests are sent</span>}
              </div>
              {tab === 'Explore' && (
                <div className="gear-heading__tools">
                  <button className="sort-button" onClick={() => setSortBy((current) => current === 'Good nearby' ? 'Lowest price' : 'Good nearby')}><span>Sort by</span>{sortBy}<ChevronDown size={14} /></button>
                  <button className="all-gear-button" onClick={() => { setCategory('Everything'); setQuery(''); }}>Browse all <ArrowRight size={16} /></button>
                </div>
              )}
            </div>
            {visibleGear.length > 0 ? (
              <div className="gear-grid">
                {visibleGear.map((item, index) => (
                  <GearCard
                    key={item.id}
                    item={item}
                    index={index}
                    saved={saved.has(item.id)}
                    onSave={() => toggleSaved(item.id)}
                    onOpen={() => setSelectedGear(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-board">
                <div className="empty-board__icon"><Bookmark size={23} /></div>
                <h3>{tab === 'Saved' && !hasSavedItems ? 'Your next favorite goes here.' : 'No gear found just yet.'}</h3>
                <p>{tab === 'Saved' && !hasSavedItems ? 'Tap the heart on anything you might want to borrow.' : 'Try another search or choose a different category.'}</p>
                <button className="button button--blue" onClick={() => { setCurrentTab('Explore'); setCategory('Everything'); setQuery(''); }}>Explore nearby gear</button>
              </div>
            )}
          </section>
        )}

        {isUtilityTab && (
          <section className="utility-view">
            <span className="section-kicker">{tab === 'Messages' ? 'Keep in touch' : 'Your neighborhood account'}</span>
            <h1>{tab === 'Messages' ? 'The good stuff starts with a hello.' : 'Your YBuy, your way.'}</h1>
            <p>{tab === 'Messages' ? 'When you ask to borrow something, your conversation with the owner will show up here.' : 'Save gear, keep track of your requests, and share the things you own.'}</p>
            <button className="button button--blue" onClick={() => setCurrentTab('Explore')}>Back to exploring <ArrowRight size={16} /></button>
          </section>
        )}

        {tab === 'Explore' && (
          <section className="how-section" id="how-it-works">
            <div className="how-copy"><span className="section-kicker">Easy as asking next door</span><h2>Borrowing should feel this simple.</h2></div>
            <ol className="how-steps">
              <li><span>01</span><h3>Find your thing</h3><p>Search local gear by what you need and when you need it.</p></li>
              <li><span>02</span><h3>Ask the owner</h3><p>Choose your dates and send a simple borrow request.</p></li>
              <li><span>03</span><h3>Go make the day</h3><p>Pick it up nearby, enjoy it, then bring it back.</p></li>
            </ol>
          </section>
        )}

        <footer className="club-footer">
          <img src={logo} alt="YBuy" />
          <span>A little more sharing. A lot more doing.</span>
          <button onClick={() => setListModalOpen(true)}>Have gear to share? <strong>List it here <ArrowUpRight size={14} /></strong></button>
        </footer>
      </main>

      <nav className="club-mobile-nav" aria-label="Main navigation">
        {([
          { label: 'Explore', icon: Search },
          { label: 'Saved', icon: Heart },
          { label: 'Messages', icon: MessageCircle },
          { label: 'Profile', icon: UserRound },
        ] as const).map(({ label, icon: Icon }) => (
          <button key={label} className={tab === label ? 'is-active' : ''} aria-current={tab === label ? 'page' : undefined} onClick={() => setCurrentTab(label)}>
            <span className="mobile-nav-icon"><Icon size={19} fill={label === 'Saved' && tab === label ? 'currentColor' : 'none'} /></span>
            <span>{label}</span>
          </button>
        ))}
        <button className="mobile-list-fab" aria-label="List your gear" onClick={() => setListModalOpen(true)}><PackagePlus size={20} /></button>
      </nav>

      {selectedGear && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedGear(null); }}>
          <section className="gear-modal" role="dialog" aria-modal="true" aria-labelledby="gear-modal-title">
            <button className="modal-close" aria-label="Close listing" onClick={() => setSelectedGear(null)}><X size={20} /></button>
            <img className="gear-modal__photo" src={selectedGear.image} alt="" />
            <div className="gear-modal__body">
              <span className="section-kicker">{selectedGear.category} · {selectedGear.distance} away</span>
              <h2 id="gear-modal-title">{selectedGear.title}</h2>
              <p>{selectedGear.note}</p>
              <div className="modal-owner"><span className="owner-avatar">{selectedGear.owner[0]}</span><span><strong>{selectedGear.owner}</strong><small><BadgeCheck size={13} /> Neighbor since 2024 · ★ {selectedGear.rating}</small></span><strong className="modal-price">${selectedGear.price}<small> / day</small></strong></div>
              <button className="button button--blue modal-request" onClick={() => { setSelectedGear(null); showToast('Request preview — no booking has been made.'); }}>Ask to borrow <ArrowRight size={17} /></button>
              <p className="modal-footnote"><ShieldCheck size={14} /> You’ll confirm dates and details before anything is booked.</p>
            </div>
          </section>
        </div>
      )}

      {listModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setListModalOpen(false); }}>
          <section className="list-modal" role="dialog" aria-modal="true" aria-labelledby="list-modal-title">
            <button className="modal-close" aria-label="Close form" onClick={() => setListModalOpen(false)}><X size={20} /></button>
            <div className="list-modal__icon"><PackagePlus size={24} /></div>
            <span className="section-kicker">Make your gear useful again</span>
            <h2 id="list-modal-title">Share something good.</h2>
            <p>This is a design preview. Your item won’t be published yet.</p>
            <form onSubmit={(event) => { event.preventDefault(); setListModalOpen(false); showToast('Nice! Listing creation will be connected after design approval.'); }}>
              <label>What are you sharing?<input required placeholder="e.g. Portable projector" /></label>
              <label>Where can neighbors pick it up?<input required placeholder="Your neighborhood or ZIP code" /></label>
              <button className="button button--blue" type="submit">Preview my listing <ArrowRight size={17} /></button>
            </form>
          </section>
        </div>
      )}

      {toast && <div className="prototype-toast" role="status"><Check size={17} />{toast}</div>}
    </div>
  );
}

function GearCard({
  item, index, saved, onSave, onOpen,
}: {
  item: GearItem; index: number; saved: boolean; onSave: () => void; onOpen: () => void;
}) {
  return (
    <article className={`gear-card gear-card--${item.accent} ${index === 0 ? 'gear-card--feature' : ''}`}>
      <button className="gear-card__photo" aria-label={`View ${item.title}`} onClick={onOpen}>
        <img src={item.image} alt="" loading={index < 3 ? 'eager' : 'lazy'} />
        <span className="gear-card__category">{item.category}</span>
        <span className="gear-card__distance"><MapPin size={12} />{item.distance}</span>
      </button>
      <button className={`save-button ${saved ? 'is-saved' : ''}`} aria-label={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`} aria-pressed={saved} onClick={onSave}>
        <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
      </button>
      <button className="gear-card__info" onClick={onOpen}>
        <span className="gear-card__title">{item.title}</span>
        <span className="gear-card__meta"><span className="mini-owner">{item.owner[0]}</span> {item.owner} <span className="meta-star">★</span> {item.rating}</span>
        <span className="gear-card__price"><strong>${item.price}</strong><span> / day</span><ArrowUpRight size={16} /></span>
      </button>
    </article>
  );
}
