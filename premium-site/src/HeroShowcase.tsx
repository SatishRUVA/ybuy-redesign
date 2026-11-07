import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { ArrowUpRight, MapPin, Pause, Play, Plus, Star } from 'lucide-react';
import { listings } from './data';
import type { Listing } from './data';
import './hero-showcase.css';

interface Slide {
  key: string;
  label: string;
  eyebrow: string;
  image: string;
  alt: string;
  listingId: string;
  /** object-position for the narrow mobile crop, so the subject stays in frame. */
  mobileFocus: string;
}

const SLIDES: Slide[] = [
  { key: 'camping', label: 'Camping', eyebrow: 'Campfire weekends, 0.8 mi away', image: '/images/hero/hero-camping', alt: 'Friends gathered around a glowing campfire beside a lake at dusk', listingId: 'weekend-camp', mobileFocus: '68% center' },
  { key: 'water', label: 'On the water', eyebrow: 'Slow mornings on the lake', image: '/images/hero/hero-water', alt: 'A paddleboarder kneeling on a calm lake at golden hour', listingId: 'lake-paddleboard', mobileFocus: '42% center' },
  { key: 'photo', label: 'Photography', eyebrow: 'For the trip you want to remember', image: '/images/hero/hero-photo', alt: 'A vintage film camera resting on a travel map beside instant photos', listingId: 'photo-day', mobileFocus: '45% center' },
  { key: 'celebrate', label: 'Celebrations', eyebrow: 'Make room for everyone', image: '/images/hero/hero-celebrate', alt: 'Friends raising glasses together in a warm, candlelit toast', listingId: 'garden-party', mobileFocus: '50% center' },
];

const INTERVAL_MS = 6500;

const listingFor = (slide: Slide): Listing => listings.find((item) => item.id === slide.listingId) ?? listings[0];

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Home hero: four category scenes that crossfade, each paired with a real listing card.
 * Autoplay pauses on hover/focus, when the tab is hidden, via the pause button (WCAG 2.2.2),
 * and is off entirely for reduced-motion users.
 */
/** `onShare` is passed for signed-in members; it makes "Share your gear" the hero's primary call to action. */
export default function HeroShowcase({ onNavigate, onExplore, onShare }: { onNavigate: (path: string) => void; onExplore: () => void; onShare?: () => void }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(prefersReducedMotion);
  const [hovering, setHovering] = useState(false);
  const [cycle, setCycle] = useState(0);
  const sceneRef = useRef<HTMLDivElement>(null);
  const running = !paused && !hovering;

  const select = useCallback((index: number) => { setActive((index + SLIDES.length) % SLIDES.length); setCycle((value) => value + 1); }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => select(active + 1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [active, running, cycle, select]);

  useEffect(() => {
    const onVisibility = () => setHovering(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const slide = SLIDES[active];
  const listing = listingFor(slide);
  const next = listingFor(SLIDES[(active + 1) % SLIDES.length]);

  const openListing = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(`/gear/${listing.id}`);
  };

  return <section className="hero container" aria-roledescription="carousel" aria-label="Featured categories">
    <div
      ref={sceneRef}
      className={`hero-scene hero-showcase ${running ? 'is-running' : 'is-paused'}`}
      style={{ '--hero-interval': `${INTERVAL_MS}ms` } as CSSProperties}
      onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovering(true); }}
      onPointerLeave={(event) => { if (event.pointerType === 'mouse') setHovering(false); }}
      onFocus={() => setHovering(true)}
      onBlur={(event) => { if (!sceneRef.current?.contains(event.relatedTarget as Node | null)) setHovering(false); }}
    >
      <div className="hero-slides">
        {SLIDES.map((item, index) => <img
          key={item.key}
          className={`hero-slide ${index === active ? 'is-active' : ''}`}
          src={`${item.image}.jpg`}
          srcSet={`${item.image}-900.jpg 900w, ${item.image}.jpg 1800w`}
          sizes="(max-width: 640px) 100vw, 1200px"
          alt={index === active ? item.alt : ''}
          aria-hidden={index !== active}
          width={1800}
          height={1000}
          decoding="async"
          fetchPriority={index === 0 ? 'high' : 'low'}
          style={{ '--mobile-focus': item.mobileFocus } as CSSProperties}
        />)}
      </div>
      <div className="hero-shade" />

      <div className="hero-stories" aria-hidden="true">
        {SLIDES.map((item, index) => <span key={item.key} className={index < active ? 'is-done' : index === active ? 'is-current' : ''}><i key={index === active ? cycle : undefined} /></span>)}
      </div>

      <div className="hero-content">
        <span className="hero-location" aria-live="polite"><MapPin size={14} /><span key={slide.key} className="hero-eyebrow-text">{slide.eyebrow}</span></span>
        <h1 className="page-intro">More moments.<br />Less owning.</h1>
        <p className="page-intro">The gear for your next great day.<br className="mobile-break" /> From people right around the corner.</p>
        {onShare
          ? <div className="hero-actions page-intro">
              <button type="button" className="hero-button hero-button--primary" onClick={onShare}><Plus size={17} strokeWidth={2.4} />Share your gear</button>
              <button type="button" className="hero-button hero-button--glass" onClick={onExplore}>Find your next adventure <ArrowUpRight size={17} /></button>
            </div>
          : <button className="hero-button page-intro" onClick={onExplore}>Find your next adventure <ArrowUpRight size={17} /></button>}
      </div>

      <div className="hero-tabs" role="tablist" aria-label="Choose a category">
        {SLIDES.map((item, index) => <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={index === active}
          className={index === active ? 'is-active' : ''}
          onClick={() => select(index)}
        >
          {item.label}
          <span className="hero-tab-progress" aria-hidden="true"><i key={index === active ? cycle : undefined} /></span>
        </button>)}
        <button type="button" className="hero-toggle" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}>
          {paused ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}
        </button>
      </div>

      <div className="hero-card-stack">
        <div className="hero-card hero-card--peek" aria-hidden="true">
          <img src={next.image} alt="" width={96} height={96} loading="lazy" decoding="async" />
        </div>
        <a key={listing.id} href={`/gear/${listing.id}`} onClick={openListing} className="hero-card hero-card--active" aria-label={`${listing.title}, $${listing.price} per day, shared by ${listing.owner}`}>
          <span className="hero-card-media"><img src={listing.image} alt="" width={160} height={160} decoding="async" /><span className="hero-card-live"><i />Available</span></span>
          <span className="hero-card-body">
            <span className="hero-card-meta"><span>{slide.label}</span><span className="hero-card-rating"><Star size={11} fill="currentColor" />{listing.rating.toFixed(2)}</span></span>
            <strong>{listing.title}</strong>
            <span className="hero-card-owner"><span className="hero-card-avatar">{listing.initials}</span>{listing.owner} · {listing.distance.toFixed(1)} mi</span>
            <span className="hero-card-foot"><span><b>${listing.price}</b> / day</span><span className="hero-card-go"><ArrowUpRight size={15} /></span></span>
          </span>
        </a>
      </div>
    </div>
  </section>;
}
