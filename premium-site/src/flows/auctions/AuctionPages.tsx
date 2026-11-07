import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, BadgeCheck, CalendarDays, Check, ChevronRight, Clock3, Eye, Gavel, Heart, Info, Plus, ShieldCheck, Trophy, Users, X } from 'lucide-react';
import { ENDING_SOON_MS, auctionTime, isHostAuction, reserveFor, stealPercent } from '../../auctions';
import type { Auction } from '../../auctions';
import { navigate } from '../../router';
import { listingById, money, shiftDays } from '../model';
import type { DemoData, HostListing } from '../model';
import { useDemo } from '../store';
import { Avatar, AuthRequired, EmptyState, Field, Link, PageShell, Pill, Stars } from '../ui';
import './auctions.css';

type AuctionWatchData = DemoData & { watchedAuctions?: string[] };
type OwnerAuction = Auction & { status: 'live' | 'scheduled' | 'completed'; reserve: number; rentalStart: string; rentalEnd: string; bidders: { name: string; initials: string; amount: number }[]; winner?: string; scheduledAt?: number };
const bidderNames = [{ name: 'Morgan Lee', initials: 'ML' }, { name: 'Taylor Green', initials: 'TG' }, { name: 'Chris Wong', initials: 'CW' }];
const hostItem = (data: DemoData, id: string): HostListing | undefined => data.hostListings.find((entry) => entry.listingId === id);
const getListing = (id: string) => listingById(id);

/** Public auction detail, live bidding, and item information. */
export function AuctionDetailPage({ params }: { params: Record<string, string> }) {
  const { user, auctions, setAuctions, data, mutate, requireAuth, placeBid, notify, pushNotice, setCheckoutDraft } = useDemo();
  const auction = auctions.find((entry) => entry.id === params.id);
  const [now, setNow] = useState(Date.now());
  const [offer, setOffer] = useState(auction ? auction.currentBid + 2 : 2);
  const [confirming, setConfirming] = useState(false);
  const [watching, setWatching] = useState(() => ((data as AuctionWatchData).watchedAuctions ?? []).includes(params.id));
  const [outbid, setOutbid] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [dates, setDates] = useState(() => { const saved = auction as (Auction & { rentalStart?: string; rentalEnd?: string }) | undefined; return { start: saved?.rentalStart ?? shiftDays(14), end: saved?.rentalEnd ?? shiftDays(16) }; });
  const competitorSeen = useRef(false);
  const bidHistory = useMemo(() => auction ? makeHistory(auction) : [], [auction]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    // Member auctions get their bids from the store's neighborhood simulation instead.
    if (!auction || auction.endsAt <= Date.now() || isHostAuction(auction)) return undefined;
    const activeAuction = auction;
    const timer = window.setInterval(() => {
      if (competitorSeen.current || Math.random() > 0.3 || activeAuction.endsAt <= Date.now()) return;
      competitorSeen.current = true;
      setAuctions((current) => current.map((entry) => entry.id === activeAuction.id ? { ...entry, currentBid: entry.currentBid + 2, bids: entry.bids + 1, youLead: false } : entry));
      if (activeAuction.youLead) setOutbid(true);
      pushNotice({ type: 'outbid', title: 'A new bid came in', body: `Someone raised the bid on “${activeAuction.title}”.`, href: `/auctions/${activeAuction.id}` });
    }, 35000);
    return () => window.clearInterval(timer);
  }, [auction, pushNotice, setAuctions]);
  useEffect(() => {
    if (auction) setOffer((current) => Math.max(current, auction.currentBid + 2));
  }, [auction]);
  if (!auction) return <PageShell title="Auction not found" subtitle="This auction may have ended or moved." back="/" width="narrow"><EmptyState icon={<Gavel size={20} />} title="We couldn’t find that auction" body="Head back to the marketplace to find another good deal." action={<Link href="/" className="primary-button">Explore rentals</Link>} /></PageShell>;

  const currentAuction = auction;
  const remaining = currentAuction.endsAt - now;
  const ended = remaining <= 0;
  const endingSoon = !ended && remaining < ENDING_SOON_MS;
  const leading = !!currentAuction.youLead && !outbid;
  const reserve = currentAuction.reservePrice ?? reserveFor(currentAuction.listing.price);
  const isOwner = !!currentAuction.hostId && currentAuction.hostId === user?.id;
  const notStarted = currentAuction.startedAt > now;
  const reserveMet = currentAuction.currentBid >= reserve;
  const steal = stealPercent(currentAuction.currentBid, currentAuction.listing.price);
  const picturePosition = ['center 48%', 'center 60%', 'center 35%'][photo % 3];
  function toggleWatch() {
    const next = !watching;
    setWatching(next);
    mutate((current) => { const watched = (current as AuctionWatchData).watchedAuctions ?? []; return { ...(current as AuctionWatchData), watchedAuctions: next ? [...new Set([...watched, currentAuction.id])] : watched.filter((id) => id !== currentAuction.id) }; });
    setAuctions((current) => current.map((entry) => entry.id === currentAuction.id ? { ...entry, watchers: Math.max(0, entry.watchers + (next ? 1 : -1)) } : entry));
    notify(next ? 'Auction saved to your watchlist.' : 'Removed from your watchlist.');
  }
  function bid() {
    if (!Number.isFinite(offer) || offer < currentAuction.currentBid + 2) return;
    requireAuth(() => {
      if (placeBid(currentAuction.id, offer)) {
        setOutbid(false);
        setConfirming(false);
        notify(`You’re leading at ${money(offer, false)} per day. Demo bid only.`);
      } else notify('That bid is no longer available. Try a higher amount.');
    }, `/auctions/${currentAuction.id}`);
  }
  function checkout() {
    setCheckoutDraft({ listingId: currentAuction.listing.id, start: dates.start, end: dates.end, auctionId: currentAuction.id, auctionPrice: currentAuction.currentBid });
    navigate('/checkout');
  }
  return <PageShell title={auction.title} subtitle={`Shared by ${auction.listing.owner} · ${auction.listing.distance.toFixed(1)} mi away`} eyebrow="YBuy auctions" back="/" width="wide" className="auction-detail-page">
    <div className="auction-detail-layout"><div className="auction-detail-main">
      <section className={`auction-gallery ${endingSoon ? 'is-ending' : ''}`} aria-label="Item photos"><div className="auction-gallery-image"><img src={currentAuction.listing.image} alt={currentAuction.listing.imageAlt} style={{ objectPosition: picturePosition }} /><div className="auction-gallery-shade" /><Pill tone={ended ? 'neutral' : 'live'} dot>{ended ? 'Ended' : 'LIVE'}</Pill><button type="button" className={`auction-watch ${watching ? 'is-watching' : ''}`} aria-pressed={watching} onClick={toggleWatch}><Heart size={17} fill={watching ? 'currentColor' : 'none'} />{watching ? 'Saved' : 'Watch'}</button><div className={`auction-gallery-clock ${endingSoon ? 'is-ending' : ''}`}><Clock3 size={17} /><span>{auctionTime(remaining)}</span>{endingSoon && !ended && <small>Ending soon</small>}</div></div><div className="auction-gallery-thumbs" aria-label="Choose photo crop">{[0, 1, 2].map((index) => <button key={index} type="button" aria-label={`View photo ${index + 1}`} aria-pressed={photo === index} onClick={() => setPhoto(index)}><img src={currentAuction.listing.image} alt="" style={{ objectPosition: ['center 48%', 'center 60%', 'center 35%'][index] }} /></button>)}</div></section>
      <div className="auction-detail-title"><div><div className="auction-live-line"><span className={ended ? 'auction-ended-dot' : 'live-dot'} />{ended ? 'Auction ended' : 'Live auction'}{endingSoon && !ended && <Pill tone="warning">Last minutes</Pill>}</div><h1>{currentAuction.title}</h1><p>{currentAuction.listing.title}</p></div><button type="button" className={`auction-watch-round ${watching ? 'is-watching' : ''}`} aria-label={watching ? 'Unwatch auction' : 'Watch auction'} aria-pressed={watching} onClick={toggleWatch}><Heart size={18} fill={watching ? 'currentColor' : 'none'} /></button></div>
      <div className="auction-metrics"><div><span>Current bid</span><strong>{money(currentAuction.currentBid, false)}<small> / day</small></strong></div><div><span>Time left</span><strong className={endingSoon ? 'is-ending' : ''}>{auctionTime(remaining)}</strong></div><div><span>Watching</span><strong><Eye size={16} /> {currentAuction.watchers}</strong></div></div>
      <div className="auction-indicators">{steal > 0 && <span className="auction-steal"><ArrowUpRight size={15} /> {steal}% below typical price</span>}<span className={reserveMet ? 'auction-reserve is-met' : 'auction-reserve'}>{reserveMet ? <Check size={14} /> : <Info size={14} />}{reserveMet ? 'Reserve met' : 'Reserve not met'}</span><span>{currentAuction.bids} bids</span></div>
      {leading && <div className="auction-status auction-status--leading" role="status"><Check size={17} /><span><strong>You’re leading</strong><small>Your top bid is {money(currentAuction.currentBid, false)} per day.</small></span></div>}
      {outbid && !ended && <div className="auction-status auction-status--outbid" role="status"><Info size={17} /><span><strong>You’ve been outbid</strong><small>There’s still time to get back in the lead.</small></span></div>}
      {ended && leading && <div className="auction-status auction-status--won" role="status"><Trophy size={18} /><span><strong>You won</strong><small>Choose your rental dates to continue.</small></span></div>}
      <section className="auction-owner"><Avatar name={currentAuction.listing.owner} initials={currentAuction.listing.initials} size={48} /><span><small>Hosted by</small><Link href={`/people/${encodeURIComponent(currentAuction.listing.owner)}`}><strong>{currentAuction.listing.owner}</strong><Stars value={currentAuction.listing.rating} size={12} /> <small>{currentAuction.listing.rating} · {currentAuction.listing.reviews} reviews</small></Link></span><Link href={`/people/${encodeURIComponent(currentAuction.listing.owner)}`} className="auction-owner-link">View profile <ChevronRight size={15} /></Link></section>
      <section className="auction-description"><h2>About this item</h2><p>{currentAuction.listing.description}</p><div className="auction-includes"><h3>Included with your rental</h3>{currentAuction.listing.includes.map((item) => <span key={item}><Check size={15} />{item}</span>)}</div><Link href={`/passport/${currentAuction.listing.id}`} className="auction-passport"><ShieldCheck size={17} /><span><strong>Item passport</strong><small>See its story, condition, and care notes.</small></span><ChevronRight size={17} /></Link></section>
      <section className="auction-history"><div className="auction-content-title"><div><h2>Bid activity</h2><p>{currentAuction.bids} bids so far</p></div><Users size={19} /></div><div>{!bidHistory.length && <p className="auction-history-empty">No bids yet.</p>}{bidHistory.map((entry, index) => <div className="auction-bid-row" key={`${entry.name}-${index}`}><Avatar name={entry.name} initials={entry.initials} size={35} /><span><strong>{entry.name}</strong><small>{index === 0 && leading ? 'Your bid' : entry.time}</small></span><b>{money(entry.amount, false)} <small>/ day</small></b></div>)}</div></section>
      <section className="auction-explainer"><Info size={18} /><div><h2>How auctions work</h2><p>Bid on the daily rental price. If you’re leading when time runs out and the reserve is met, the item is yours. No payment is taken until checkout.</p></div></section>
    </div>
    <aside className="auction-bid-panel">{isOwner ? <OwnerLivePanel auction={currentAuction} reserve={reserve} remaining={remaining} notStarted={notStarted} /> : <BidPanel auction={currentAuction} offer={offer} setOffer={setOffer} ended={ended} leading={leading} reserveMet={reserveMet} dates={dates} setDates={setDates} onConfirm={() => setConfirming(true)} onCheckout={checkout} />}</aside></div>
    {confirming && <div className="auction-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirming(false); }}><section className="auction-sheet" role="dialog" aria-modal="true" aria-labelledby="confirm-bid-title"><button type="button" className="icon-button auction-sheet-close" aria-label="Close" onClick={() => setConfirming(false)}><X size={20} /></button><span className="auction-sheet-icon"><Gavel size={20} /></span><h2 id="confirm-bid-title">Confirm your bid</h2><p>You’re bidding on {currentAuction.listing.title}.</p><div className="auction-confirm-bid"><span>Your daily bid</span><strong>{money(offer, false)}<small> / day</small></strong></div><div className="auction-confirm-row"><span>Rental dates</span><strong>{dates.start} – {dates.end}</strong></div><div className="auction-confirm-row"><span>Estimated rental total</span><strong>{money(offer * rentalDays(dates.start, dates.end))}</strong></div><p className="auction-confirm-note">This is a demo bid only. No payment is collected now.</p><button type="button" className="primary-button full-width" onClick={bid}>Place bid</button></section></div>}
  </PageShell>;
}

/** Owner auction management with winner selection and a local create flow. */
export function OwnerAuctionsPage({ params }: { params: Record<string, string> }) {
  const { user, auctions, startAuction, data, notify, pushNotice } = useDemo();
  void params;
  const [filter, setFilter] = useState<'All' | 'Live' | 'Scheduled' | 'Completed'>('All');
  const [creating, setCreating] = useState(false);
  const [listingId, setListingId] = useState(data.hostListings[0]?.listingId ?? '');
  const [startPrice, setStartPrice] = useState(8);
  const [reserve, setReserve] = useState(16);
  const [duration, setDuration] = useState(24);
  const [startsNow, setStartsNow] = useState(true);
  const [rentalStart, setRentalStart] = useState(shiftDays(14));
  const [rentalEnd, setRentalEnd] = useState(shiftDays(16));
  const [winnerChoices, setWinnerChoices] = useState<Record<string, string>>({});
  const [chosenWinners, setChosenWinners] = useState<Record<string, string>>({});
  const hostListings = data.hostListings.map((host) => ({ host, item: getListing(host.listingId) })).filter((value): value is { host: HostListing; item: NonNullable<ReturnType<typeof getListing>> } => !!value.item);
  const ownerAuctions = useMemo<OwnerAuction[]>(() => {
    const [live, scheduled, finished] = auctions.filter((auction) => !isHostAuction(auction)).slice(0, 3);
    const rows: OwnerAuction[] = [];
    if (live) rows.push({ ...live, status: 'live', reserve: Math.round(live.listing.price * 0.65), rentalStart: shiftDays(14), rentalEnd: shiftDays(16), bidders: bidderNames.map((bidder, index) => ({ ...bidder, amount: Math.max(2, live.currentBid - (2 - index) * 2) })) });
    if (scheduled) rows.push({ ...scheduled, id: `scheduled-${scheduled.id}`, status: 'scheduled', startedAt: Date.now() + 2 * 86400000, endsAt: Date.now() + 3 * 86400000, currentBid: 0, bids: 0, reserve: Math.round(scheduled.listing.price * 0.7), rentalStart: shiftDays(21), rentalEnd: shiftDays(23), bidders: [], scheduledAt: Date.now() + 2 * 86400000 });
    if (finished) rows.push({ ...finished, id: `completed-${finished.id}`, status: 'completed', startedAt: Date.now() - 3 * 86400000, endsAt: Date.now() - 86400000, currentBid: Math.max(finished.currentBid, Math.round(finished.listing.price * 0.7)), bids: Math.max(finished.bids, 8), reserve: Math.round(finished.listing.price * 0.65), rentalStart: shiftDays(4), rentalEnd: shiftDays(6), bidders: bidderNames.map((bidder, index) => ({ ...bidder, amount: finished.currentBid + (2 - index) * 2 })) });
    return rows;
  }, [auctions]);
  const rows = [...ownerAuctions, ...auctions.filter((auction) => isHostAuction(auction) && (!auction.hostId || auction.hostId === user?.id)).map((auction) => ({ ...auction, status: auction.startedAt > Date.now() ? 'scheduled' as const : auction.endsAt <= Date.now() ? 'completed' as const : 'live' as const, reserve: (auction as Auction & { reservePrice?: number }).reservePrice ?? Math.round(auction.listing.price * .65), rentalStart: (auction as Auction & { rentalStart?: string }).rentalStart ?? rentalStart, rentalEnd: (auction as Auction & { rentalEnd?: string }).rentalEnd ?? rentalEnd, bidders: bidderNames.slice(0, Math.min(bidderNames.length, auction.bids)).map((bidder, index) => ({ ...bidder, amount: Math.max(1, auction.currentBid - index * 2) })), scheduledAt: auction.startedAt }))];
  const visible = rows.filter((auction) => filter === 'All' || auction.status === filter.toLowerCase());
  function createAuction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const host = hostItem(data, listingId);
    const item = getListing(listingId);
    if (!host || !item || rentalEnd <= rentalStart) { notify('Choose a listing and valid rental dates.'); return; }
    if (reserve < startPrice) { notify('Reserve must be at least the starting price.'); return; }
    const id = startAuction({ listing: { ...item, price: host.price }, startBid: startPrice, hours: duration, rentalStart, rentalEnd, reservePrice: reserve, startsInMs: startsNow ? 0 : 2 * 86400000 });
    if (!id) return;
    setCreating(false);
    if (startsNow) { notify('Bidding is open now.'); navigate(`/auctions/${id}`); } else notify('Auction scheduled for 2 days from now.');
  }
  function chooseWinner(auction: OwnerAuction) {
    const winner = auction.bidders.find((bidder) => bidder.name === winnerChoices[auction.id]);
    if (!winner) return;
    setChosenWinners((current) => ({ ...current, [auction.id]: winner.name }));
    pushNotice({ type: 'auction-won', title: 'Auction winner selected', body: `${winner.name} won “${auction.title}” at ${money(winner.amount, false)} per day.`, href: `/auctions/${auction.id.replace('completed-', '')}` });
    notify(`Winner selected: ${winner.name}.`);
  }
  return <AuthRequired title="Your auctions" reason="Sign in to create auctions and choose your winners."><PageShell title="Your auctions" subtitle="Offer your gear to the neighborhood at a price renters choose." eyebrow="Hosting" back="/hosting" width="wide" actions={<button type="button" className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Create auction</button>}>
    <div className="owner-auction-intro"><span><Gavel size={19} /></span><p>Set a starting daily price, choose a reserve, then let neighbors bid. You’ll decide the winner after it ends.</p></div>
    <div className="owner-auction-filters" role="group" aria-label="Filter auctions">{(['All', 'Live', 'Scheduled', 'Completed'] as const).map((value) => <button type="button" key={value} className={filter === value ? 'is-active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}<small>{rows.filter((row) => value === 'All' || row.status === value.toLowerCase()).length}</small></button>)}</div>
    {visible.length ? <div className="owner-auction-list">{visible.map((auction) => <article className="card owner-auction-card" key={auction.id}><img src={auction.listing.image} alt={auction.listing.imageAlt} /><div className="owner-auction-body"><div className="owner-auction-top"><Pill tone={auction.status === 'live' ? 'live' : auction.status === 'scheduled' ? 'info' : 'neutral'} dot={auction.status === 'live'}>{auction.status === 'live' ? 'Live' : auction.status === 'scheduled' ? 'Scheduled' : 'Completed'}</Pill>{auction.status === 'live' && <span><Clock3 size={13} /> {auctionTime(auction.endsAt - Date.now())}</span>}</div><h2>{auction.title}</h2><p>{auction.listing.title} · {auction.rentalStart} – {auction.rentalEnd}</p><div className="owner-auction-stats"><span><small>{auction.status === 'scheduled' ? 'Starting price' : 'Leading bid'}</small><strong>{money(auction.currentBid || 0, false)}<small> / day</small></strong></span><span><small>Bids</small><strong>{auction.bids}</strong></span><span><small>Reserve</small><strong>{auction.currentBid >= auction.reserve ? 'Met' : money(auction.reserve, false)}</strong></span></div>
      {auction.status === 'completed' && <div className="owner-winner-picker">{chosenWinners[auction.id] ? <p className="owner-winner-selected"><BadgeCheck size={17} /> Winner selected: <strong>{chosenWinners[auction.id]}</strong></p> : <><label htmlFor={`winner-${auction.id}`}>Choose a winner</label><div><select id={`winner-${auction.id}`} className="control" value={winnerChoices[auction.id] ?? ''} onChange={(event) => setWinnerChoices((current) => ({ ...current, [auction.id]: event.target.value }))}><option value="">Select top bidder</option>{auction.bidders.slice().sort((a, b) => b.amount - a.amount).map((bidder) => <option value={bidder.name} key={bidder.name}>{bidder.name} · {money(bidder.amount, false)} / day</option>)}</select><button type="button" className="primary-button" disabled={!winnerChoices[auction.id]} onClick={() => chooseWinner(auction)}>Choose winner</button></div></>}</div>}
      {auction.status === 'scheduled' && <small className="owner-auction-note"><CalendarDays size={13} /> Starts {new Date(auction.scheduledAt ?? auction.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>}
      {auction.status !== 'completed' && !auction.id.startsWith('scheduled-') && <Link href={`/auctions/${auction.id}`} className="owner-auction-public-link">View public auction <ArrowUpRight size={15} /></Link>}
    </div></article>)}</div> : <EmptyState icon={<Gavel size={20} />} title="No auctions in this group" body="Try another filter or create an auction for one of your listings." action={<button type="button" className="primary-button" onClick={() => setCreating(true)}>Create auction</button>} />}
  </PageShell>
  {creating && <div className="auction-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreating(false); }}><section className="auction-sheet auction-create-sheet" role="dialog" aria-modal="true" aria-labelledby="create-auction-title"><button type="button" className="icon-button auction-sheet-close" aria-label="Close" onClick={() => setCreating(false)}><X size={20} /></button><span className="auction-sheet-icon"><Gavel size={20} /></span><h2 id="create-auction-title">Create an auction</h2><p>Choose an item and set the opening terms.</p><form onSubmit={createAuction}><Field label="Your listing" htmlFor="auction-listing"><select id="auction-listing" className="control" value={listingId} onChange={(event) => setListingId(event.target.value)}>{hostListings.map(({ host, item }) => <option key={host.listingId} value={host.listingId}>{item.title}</option>)}</select></Field><div className="auction-form-split"><Field label="Starting price / day" htmlFor="auction-start"><input id="auction-start" className="control" type="number" min="2" step="2" value={startPrice} onChange={(event) => setStartPrice(Math.max(2, Number(event.target.value)))} /></Field><Field label="Reserve / day" htmlFor="auction-reserve"><input id="auction-reserve" className="control" type="number" min={startPrice} value={reserve} onChange={(event) => setReserve(Math.max(2, Number(event.target.value)))} /></Field></div><Field label="Auction duration" htmlFor="auction-duration"><select id="auction-duration" className="control" value={duration} onChange={(event) => setDuration(Number(event.target.value))}><option value={6}>6 hours</option><option value={12}>12 hours</option><option value={24}>24 hours</option><option value={48}>48 hours</option></select></Field><div className="field"><span className="field-label">Bidding opens</span><div className="owner-auction-filters auction-start-choice" role="radiogroup" aria-label="Bidding opens">{([[true, 'Right now'], [false, 'In 2 days']] as const).map(([value, label]) => <button type="button" key={label} role="radio" aria-checked={startsNow === value} className={startsNow === value ? 'is-active' : ''} onClick={() => setStartsNow(value)}>{label}</button>)}</div></div><div className="auction-form-split"><Field label="Rental starts" htmlFor="auction-rental-start"><input id="auction-rental-start" className="control" type="date" value={rentalStart} onChange={(event) => setRentalStart(event.target.value)} /></Field><Field label="Rental ends" htmlFor="auction-rental-end"><input id="auction-rental-end" className="control" type="date" min={rentalStart} value={rentalEnd} onChange={(event) => setRentalEnd(event.target.value)} /></Field></div><p className="auction-create-note">Demo auction · no payment or real bids.</p><button type="submit" className="primary-button full-width">{startsNow ? 'Start live auction' : 'Schedule auction'}</button></form></section></div>}
  </AuthRequired>;
}

function BidPanel({ auction, offer, setOffer, ended, leading, reserveMet, dates, setDates, onConfirm, onCheckout }: { auction: Auction; offer: number; setOffer: (value: number) => void; ended: boolean; leading: boolean; reserveMet: boolean; dates: { start: string; end: string }; setDates: (value: { start: string; end: string }) => void; onConfirm: () => void; onCheckout: () => void }) {
  const valid = Number.isFinite(offer) && offer >= auction.currentBid + 2 && offer % 1 === 0;
  return <div className="card auction-bid-card"><div className="auction-bid-card-head"><div><small>{ended ? 'Final daily price' : 'Current bid'}</small><strong>{money(auction.currentBid, false)}<span> / day</span></strong></div><Pill tone={reserveMet ? 'success' : 'warning'}>{reserveMet ? 'Reserve met' : 'Reserve open'}</Pill></div><div className="auction-bid-input"><label htmlFor="bid-amount">Your bid per day</label><div><span>$</span><input id="bid-amount" type="number" inputMode="decimal" min={auction.currentBid + 2} step="1" value={offer} onChange={(event) => setOffer(Number(event.target.value))} /><small>/ day</small></div></div><div className="auction-quick-bids" aria-label="Quick bid increments">{[2, 5, 10].map((amount) => <button key={amount} type="button" disabled={ended} onClick={() => setOffer(auction.currentBid + amount)}>+{money(amount, false)}</button>)}</div>{!valid && !ended && <p className="auction-validation" role="alert">Minimum bid is {money(auction.currentBid + 2, false)} per day.</p>}
    {ended && leading ? <div className="auction-checkout-dates"><h3>Choose your rental dates</h3><div><Field label="Start date" htmlFor="auction-date-start"><input id="auction-date-start" type="date" className="control" min={shiftDays(0)} value={dates.start} onChange={(event) => setDates({ ...dates, start: event.target.value })} /></Field><Field label="End date" htmlFor="auction-date-end"><input id="auction-date-end" type="date" className="control" min={dates.start} value={dates.end} onChange={(event) => setDates({ ...dates, end: event.target.value })} /></Field></div><button type="button" className="primary-button full-width" disabled={!dates.start || dates.end <= dates.start} onClick={onCheckout}>Continue to checkout <ChevronRight size={16} /></button></div> : ended ? <button type="button" className="secondary-button full-width" disabled>Auction ended</button> : <button type="button" className="primary-button full-width" disabled={!valid} onClick={onConfirm}>{leading ? 'Raise your bid' : 'Review your bid'} <ChevronRight size={16} /></button>}
    <p className="auction-bid-disclaimer"><ShieldCheck size={14} /> Demo only — no real payment is made.</p><div className="auction-bid-divider" /><div className="auction-bid-foot"><span><Users size={15} /> {auction.bids} bids</span><span><Eye size={15} /> {auction.watchers} watching</span></div></div>;
}

/** Shown to the host instead of the bid form: live status of their own auction. */
function OwnerLivePanel({ auction, reserve, remaining, notStarted }: { auction: Auction; reserve: number; remaining: number; notStarted: boolean }) {
  const ended = remaining <= 0;
  const reserveMet = auction.bids > 0 && auction.currentBid >= reserve;
  const status = notStarted ? 'Scheduled' : ended ? 'Bidding closed' : 'Live now';
  return <div className="card auction-bid-card owner-live-panel">
    <div className="owner-live-status">{!notStarted && !ended && <span className="live-dot" aria-hidden="true" />}{status}<em>{notStarted ? `Opens in ${auctionTime(auction.startedAt - Date.now())}` : ended ? 'Ended' : `${auctionTime(remaining)} left`}</em></div>
    <div className="auction-bid-card-head"><div><small>{auction.bids ? 'Current bid' : 'Starting bid'}</small><strong key={auction.currentBid} className="owner-live-bid" aria-live="polite">{money(auction.currentBid, false)}<span> / day</span></strong></div><Pill tone={reserveMet ? 'success' : 'warning'}>{reserveMet ? 'Reserve met' : `Reserve ${money(reserve, false)}`}</Pill></div>
    <div className="owner-live-stats"><div><strong>{auction.bids}</strong><small>bid{auction.bids === 1 ? '' : 's'}</small></div><div><strong>{auction.watchers}</strong><small>watching</small></div><div><strong>{money(auction.listing.price, false)}</strong><small>usual price</small></div></div>
    <p className="owner-live-note"><Info size={14} />{auction.bids ? 'New bids appear here automatically. You’ll pick the winner when bidding closes.' : 'Waiting for the first bid — neighbors nearby are being notified now.'}</p>
    <Link href="/hosting/auctions" className="secondary-button full-width">Manage your auctions</Link>
    <p className="auction-bid-disclaimer"><ShieldCheck size={14} /> This is your auction, so bidding is turned off for you.</p>
  </div>;
}

function makeHistory(auction: Auction) {
  const entries = [
    { name: auction.youLead ? 'You' : 'Morgan Lee', initials: auction.youLead ? 'YO' : 'ML', amount: auction.currentBid, time: auction.youLead ? 'Your latest bid' : '2 min ago' },
    ...bidderNames.slice(1).map((bidder, index) => ({ ...bidder, amount: Math.max(2, auction.currentBid - (index + 1) * 2), time: `${(index + 1) * 4 + 2} min ago` })),
    { name: 'Jamie West', initials: 'JW', amount: Math.max(2, auction.currentBid - 8), time: '18 min ago' },
  ];
  return entries.slice(0, Math.min(4, isHostAuction(auction) ? auction.bids : Math.max(2, auction.bids)));
}

function rentalDays(start: string, end: string) {
  const days = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000;
  return Math.max(0, days);
}
