import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Cloud, Eye, Gavel, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { ENDING_SOON_MS, auctionTime, stealPercent, timeShare } from './auctions';
import type { Auction } from './auctions';
import { linkHandler } from './router';

interface AuctionRailProps {
  auctions: Auction[];
  onRemove: (id: string) => void;
  onBid: (id: string) => void;
  onReset: () => void;
}

export default function AuctionRail({ auctions, onRemove, onBid, onReset }: AuctionRailProps) {
  const track = useRef<HTMLDivElement>(null);
  const previousButton = useRef<HTMLButtonElement>(null);
  const [now, setNow] = useState(Date.now);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(!document.hidden);
  const direction = useRef(1);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReduced(media.matches);
    const updateVisibility = () => setVisible(!document.hidden);
    media.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => { clearInterval(timer); media.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', updateVisibility); };
  }, []);

  useEffect(() => {
    if (!playing || hovered || focused || reduced || !visible || !auctions.length) return;
    let frame: number;
    let previous = performance.now();
    let position = track.current?.scrollLeft || 0;
    function step(time: number) {
      const node = track.current;
      if (node) {
        const limit = node.scrollWidth - node.clientWidth;
        if (position >= limit - 1) direction.current = -1;
        if (position <= 1) direction.current = 1;
        position = Math.max(0, Math.min(limit, position + direction.current * Math.min(time - previous, 50) * .018));
        node.scrollLeft = position;
      }
      previous = time;
      frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing, hovered, focused, reduced, visible, auctions.length]);

  function scroll(direction: number) {
    setPlaying(false);
    track.current?.scrollBy({ left: direction * 300, behavior: reduced ? 'instant' : 'smooth' });
  }

  function remove(id: string) {
    const cards = Array.from(track.current?.querySelectorAll<HTMLElement>('.auction-card') || []);
    const index = cards.findIndex((card) => card.dataset.auction === id);
    const removed = cards[index];
    if (removed?.contains(document.activeElement)) {
      (cards[index + 1] || cards[index - 1])?.querySelector<HTMLButtonElement>('button')?.focus();
      if (cards.length === 1) previousButton.current?.focus();
    }
    onRemove(id);
  }

  return <section className="auction-section container" aria-labelledby="auction-heading">
    <div className="auction-heading"><div><span className="auction-live-label"><span className="live-dot" aria-hidden="true" />{auctions.length} live now <small>Demo</small></span><h2 id="auction-heading">Live now. Gone soon.</h2><p>Steal-worthy rentals going below their usual daily price. Bid before the clock runs out.</p></div><div className="auction-controls">
      <button type="button" className="icon-button" disabled={reduced || !auctions.length} aria-label={playing ? 'Pause auction scroll' : 'Play auction scroll'} onClick={() => setPlaying((value) => !value)}>{playing && !reduced ? <Pause size={16} /> : <Play size={16} />}</button>
      <button ref={previousButton} type="button" className="icon-button" aria-label="Previous auctions" onClick={() => scroll(-1)}><ChevronLeft size={19} /></button><button type="button" className="icon-button" aria-label="Next auctions" onClick={() => scroll(1)}><ChevronRight size={19} /></button>
    </div></div>
    {auctions.length ? <div ref={track} className={`auction-track ${playing && !hovered && !focused && !reduced ? 'auction-track--auto' : ''}`} role="list" aria-label="Live auction cards" tabIndex={0} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setFocused(false); }} onPointerDown={() => setPlaying(false)}>
      {auctions.map((auction) => <AuctionCard key={auction.id} auction={auction} now={now} onRemove={remove} onBid={() => onBid(auction.id)} />)}
    </div> : <div className="auction-empty"><Cloud size={30} /><h3>All clear, for now.</h3><p>You made every sample auction disappear.</p><button type="button" className="primary-button" onClick={onReset}><RotateCcw size={16} />Restore 10 demo auctions</button></div>}
    <div className="auction-footnote"><span><Gavel size={14} />Simulated live bidding. No payment or real auction is created.</span>{!!auctions.length && auctions.length < 10 && <button type="button" onClick={onReset}><RotateCcw size={13} />Restore demo</button>}</div>
  </section>;
}

function AuctionCard({ auction, now, onRemove, onBid }: { auction: Auction; now: number; onRemove: (id: string) => void; onBid: () => void }) {
  const card = useRef<HTMLElement>(null);
  const [disappearing, setDisappearing] = useState(false);
  const leading = !!auction.youLead;
  const remove = useRef(onRemove);
  remove.current = onRemove;
  const remaining = auction.endsAt - now;
  const ended = remaining <= 0;
  const endingSoon = !ended && remaining <= ENDING_SOON_MS;
  const usual = auction.listing.price;
  const steal = stealPercent(auction.currentBid, usual);
  // Gently varies the illustrative watcher count so the card feels alive without random test-breaking jumps.
  const watching = auction.watchers + (Math.floor(now / 5000) + Number(auction.id.replace(/\D/g, ''))) % 3;

  useLayoutEffect(() => {
    if (!disappearing) return;
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ onComplete: () => remove.current(auction.id) });
      timeline.to('.auction-card-body', { opacity: 0, y: -14, scale: 1.035, filter: 'blur(9px)', duration: .48, ease: 'power2.in' })
        .fromTo('.auction-cloud-puff', { opacity: 0, scale: .45, y: 12 }, { opacity: .95, scale: 1.1, duration: .24, stagger: .025, ease: 'power2.out' }, .08)
        .to('.auction-cloud-puff', { opacity: 0, scale: 1.8, y: -32, x: (index) => (index % 2 ? 1 : -1) * 24, duration: .38, stagger: .02, ease: 'power2.in' }, .3);
    }, card);
    return () => context.revert();
  }, [disappearing, auction.id]);

  const state = ended ? 'auction-card--ended' : endingSoon ? 'auction-card--ending' : '';
  return <article ref={card} role="listitem" data-auction={auction.id} className={`auction-card ${state} ${leading && !ended ? 'auction-card--leading' : ''} ${disappearing ? 'auction-card--disappearing' : ''}`}>
    <div className="auction-card-body">
      <div className="auction-photo">
        <img src={auction.listing.image} alt={auction.listing.imageAlt} width={900} height={700} loading="lazy" />
        <span className="auction-live">{!ended && <span className="live-dot" aria-hidden="true" />}{ended ? 'Ended' : endingSoon ? 'Ending soon' : 'Live'}</span>
        <button type="button" className="auction-disappear" disabled={disappearing} aria-label={`Disappear ${auction.title}`} onClick={() => { if (matchMedia('(prefers-reduced-motion: reduce)').matches) remove.current(auction.id); else setDisappearing(true); }}><Cloud size={14} /><span>{disappearing ? 'Poof…' : 'Disappear'}</span></button>
        <span className="auction-clock"><Timer size={13} /><span className="auction-timer">{auctionTime(remaining)}</span>{!ended && <span className="auction-clock-left">left</span>}</span>
        <span className="auction-timebar" aria-hidden="true"><i style={{ transform: `scaleX(${timeShare(auction, now)})` }} /></span>
      </div>
      <div className="auction-card-info">
        <div className="auction-title-row"><h3><a href={`/auctions/${auction.id}`} onClick={linkHandler(`/auctions/${auction.id}`)} className="auction-title-link">{auction.title}</a></h3>{steal > 0 && <span className="auction-steal">{steal}% off</span>}</div>
        <div className="auction-price"><strong key={auction.currentBid} className={leading ? 'auction-amount auction-amount--bumped' : 'auction-amount'}>${auction.currentBid}</strong><span className="auction-per">/ day</span>{usual > auction.currentBid && <s><span className="sr-only">Usually </span>${usual}</s>}</div>
        <p className="auction-meta"><span><Eye size={13} />{watching} watching</span><span>{auction.bids} bids</span></p>
        {leading && !ended && <p className="auction-leading" role="status"><Check size={13} />You're the top bidder (demo)</p>}
        <button type="button" className="auction-bid-button" disabled={disappearing || ended} onClick={onBid}>{ended ? 'Auction ended' : `Bid $${auction.currentBid + 2}`}<ArrowUpRight size={16} /></button>
      </div>
    </div>
    <div className="auction-clouds" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <i className={`auction-cloud-puff auction-cloud-puff--${index}`} key={index} />)}</div>
  </article>;
}
