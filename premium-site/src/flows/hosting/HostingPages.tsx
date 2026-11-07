import { useMemo, useState } from 'react';
import { ArrowDownRight, CalendarDays, Check, ChevronRight, Clock3, Eye, HandCoins, MessageCircle, Package, Pause, Play, Plus, Star, TrendingUp, X } from 'lucide-react';
import CalendarRange from '../../CalendarRange';
import { navigate } from '../../router';
import { DECLARED_VALUE, dateRange, listingById, longDate, money, shiftDays } from '../model';
import type { Booking, DemoData, HostListing } from '../model';
import { useDemo } from '../store';
import { Avatar, AuthRequired, EmptyState, Field, Link, PageShell, Pill, Segmented, Stars } from '../ui';
import './hosting.css';

type HostingTab = 'Today' | 'Requests' | 'Listings' | 'Earnings';
type HostExtra = { title?: string; maxDays: number; declaredValue: number; delivery: boolean; pickup: boolean; rules: string };
type HostData = DemoData & { hostSettings?: Record<string, HostExtra> };
const extraFor = (data: DemoData, id: string): HostExtra => (data as HostData).hostSettings?.[id] ?? { maxDays: 30, declaredValue: DECLARED_VALUE[id] ?? 300, delivery: false, pickup: true, rules: 'Please return everything clean and in the same condition you received it.' };
const itemFor = (id: string) => listingById(id);
const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long' });

/** Owner dashboard for requests, handoffs, listings and earnings. */
export function HostingPage({ params }: { params: Record<string, string> }) {
  const { user, data, updateBooking, pushNotice, ensureConversation, notify, updateHostListing } = useDemo();
  void params;
  const [tab, setTab] = useState<HostingTab>('Today');
  const [declining, setDeclining] = useState<Booking | null>(null);
  const [reason, setReason] = useState('Dates don’t work');
  const [message, setMessage] = useState('');
  const requests = data.bookings.filter((booking) => booking.role === 'owner' && booking.status === 'requested');
  const ownerBookings = data.bookings.filter((booking) => booking.role === 'owner' && ['confirmed', 'active'].includes(booking.status)).sort((a, b) => a.start.localeCompare(b.start));
  const listingsWithData = data.hostListings.map((host) => ({ host, item: itemFor(host.listingId) })).filter((value): value is { host: HostListing; item: NonNullable<ReturnType<typeof itemFor>> } => !!value.item);
  const earnings = data.txns.filter((txn) => txn.kind === 'earning');
  const monthEarnings = earnings.filter((txn) => new Date(txn.at).getMonth() === new Date().getMonth()).reduce((sum, txn) => sum + txn.amount, 0) || 248;
  const upcoming = ownerBookings.filter((booking) => booking.start >= shiftDays(0)).length;

  function updateStatus(booking: Booking, status: Booking['status'], note: string) {
    updateBooking(booking.id, { status });
    pushNotice({ type: 'booking', title: status === 'confirmed' ? 'Booking approved' : 'Booking declined', body: `${booking.counterpart.name}’s request for ${itemFor(booking.listingId)?.title ?? 'your item'} was ${status}.${status === 'declined' ? ` ${reason}${message ? ` — ${message}` : ''}.` : ''}`, href: '/hosting' });
    notify(note);
  }
  function openMessage(booking: Booking) {
    const id = ensureConversation({ listingId: booking.listingId, bookingId: booking.id, with: booking.counterpart });
    navigate(`/inbox/${id}`);
  }
  function finishDecline() {
    if (!declining) return;
    updateStatus(declining, 'declined', 'Request declined. The renter has been notified.');
    setDeclining(null);
  }
  function handoff(booking: Booking) {
    const next = booking.status === 'confirmed' ? 'active' : booking.status === 'active' ? 'completed' : booking.status;
    updateBooking(booking.id, { status: next });
    pushNotice({ type: 'booking', title: next === 'active' ? 'Rental started' : 'Rental completed', body: `${itemFor(booking.listingId)?.title ?? 'Rental'} · ${booking.counterpart.name}`, href: '/hosting' });
    notify(next === 'active' ? 'Pickup marked complete.' : 'Return marked complete.');
  }
  const tabs: { value: HostingTab; label: string; count?: number }[] = [
    { value: 'Today', label: 'Today' }, { value: 'Requests', label: 'Requests', count: requests.length },
    { value: 'Listings', label: 'Listings' }, { value: 'Earnings', label: 'Earnings' },
  ];
  return <AuthRequired title="Your hosting dashboard" reason="Sign in to manage your listings, requests, and earnings.">
    <PageShell title="Hosting" subtitle={`Good to see you, ${user?.firstName ?? 'host'}. Here’s what’s happening with your rentals.`} eyebrow="Your hosting" back="/" width="wide" actions={<div className="hosting-header-actions"><Link href="/hosting/auctions" className="secondary-button hosting-auction-link">Auctions <ChevronRight size={16} /></Link><Link href="/hosting/new" className="primary-button hosting-new-link"><Plus size={16} />New listing</Link></div>}>
      <div className="hosting-tabs"><Segmented options={tabs} value={tab} onChange={setTab} label="Hosting dashboard sections" /></div>
      {tab === 'Today' && <div className="hosting-content">
        <section className="hosting-stat-grid" aria-label="Hosting summary">
          <article className="hosting-stat"><div><span>Earned this month</span><strong>{money(monthEarnings, false)}</strong><small><TrendingUp size={14} /> 12% from last month</small></div><Sparkline values={[4, 6, 5, 9, 7, 11, 13]} /></article>
          <article className="hosting-stat"><div><span>Upcoming handoffs</span><strong>{upcoming}</strong><small><CalendarDays size={14} /> Next one {ownerBookings[0] ? longDate(ownerBookings[0].start) : 'tomorrow'}</small></div><Sparkline values={[2, 4, 3, 5, 4, 6, 7]} /></article>
          <article className="hosting-stat"><div><span>Response rate</span><strong>100%</strong><small><Clock3 size={14} /> Usually within 2 hours</small></div><Sparkline values={[8, 8, 9, 8, 10, 10, 10]} /></article>
          <article className="hosting-stat hosting-stat--rating"><div><span>Guest rating</span><strong>{user?.rating.toFixed(2) ?? '4.96'}</strong><small><Stars value={user?.rating ?? 4.96} size={12} /> From 14 reviews</small></div><span className="hosting-rating-mark"><Star size={30} fill="currentColor" /></span></article>
        </section>
        <div className="hosting-dashboard-columns">
          <section className="card hosting-section">
            <div className="hosting-section-head"><div><h2>Requests to review</h2><p>{requests.length ? 'A quick reply helps renters plan their trip.' : 'You’re all caught up.'}</p></div><button type="button" className="text-button" onClick={() => setTab('Requests')}>See all <ChevronRight size={16} /></button></div>
            {requests.length ? requests.slice(0, 2).map((booking) => <RequestCard key={booking.id} booking={booking} onApprove={() => updateStatus(booking, 'confirmed', 'Booking approved.')} onDecline={() => setDeclining(booking)} onMessage={() => openMessage(booking)} />) : <EmptyState icon={<Check size={20} />} title="No new requests" body="New booking requests will show up here." />}
          </section>
          <section className="card hosting-section hosting-handoffs">
            <div className="hosting-section-head"><div><h2>Coming up</h2><p>Keep the handoff simple and smooth.</p></div><Pill tone="accent">{ownerBookings.length} bookings</Pill></div>
            {ownerBookings.length ? ownerBookings.slice(0, 3).map((booking) => <BookingRow key={booking.id} booking={booking} onAction={() => handoff(booking)} onMessage={() => openMessage(booking)} />) : <EmptyState icon={<CalendarDays size={20} />} title="A little breathing room" body="Upcoming rentals will appear here." />}
          </section>
        </div>
        <section className="hosting-shortcuts"><Link href="/wallet" className="card hosting-shortcut"><HandCoins size={22} /><span><strong>Your wallet</strong><small>See payouts and activity</small></span><ChevronRight size={18} /></Link><Link href="/hosting/auctions" className="card hosting-shortcut"><TrendingUp size={22} /><span><strong>Auctions</strong><small>Offer a great daily rate</small></span><ChevronRight size={18} /></Link></section>
      </div>}
      {tab === 'Requests' && <section className="card hosting-section"><div className="hosting-section-head"><div><h2>Booking requests</h2><p>Choose what works for you. Renters hear back as soon as you decide.</p></div></div>{requests.length ? requests.map((booking) => <RequestCard key={booking.id} booking={booking} onApprove={() => updateStatus(booking, 'confirmed', 'Booking approved.')} onDecline={() => setDeclining(booking)} onMessage={() => openMessage(booking)} />) : <EmptyState icon={<Check size={20} />} title="No requests waiting" body="You’ll see new rental requests here." />}</section>}
      {tab === 'Listings' && <section className="hosting-listing-grid"><Link href="/hosting/new" className="hosting-add-card"><span className="hosting-add-icon"><Plus size={24} /></span><strong>List more gear</strong><small>Photos, details and price in about 3 minutes.</small></Link>{listingsWithData.map(({ host, item }) => <article className="hosting-listing-card" key={item.id}><Link href={`/hosting/listings/${item.id}`} className="hosting-listing-image"><img src={item.image} alt={item.imageAlt} /><Pill tone={host.paused ? 'neutral' : 'success'}>{host.paused ? 'Paused' : 'Active'}</Pill></Link><div className="hosting-listing-body"><Link href={`/hosting/listings/${item.id}`} className="hosting-listing-title"><strong>{(data as HostData).hostSettings?.[item.id]?.title ?? item.title}</strong><ChevronRight size={16} /></Link><span className="hosting-price">{money(host.price, false)} <small>/ day</small></span><div className="hosting-listing-metrics"><span><Eye size={14} /> {item.reviews ? 84 + item.reviews * 9 : 0} views</span><span><Package size={14} /> {item.reviews ? item.reviews + 2 : 0} bookings</span></div><div className="hosting-listing-actions"><Link href={`/hosting/listings/${item.id}`} className="secondary-button">Manage listing</Link><button type="button" className="icon-button" aria-label={host.paused ? 'Resume listing' : 'Pause listing'} onClick={() => { updateHostListing(item.id, { paused: !host.paused }); notify(host.paused ? 'Listing is active again.' : 'Listing paused.'); }} >{host.paused ? <Play size={17} /> : <Pause size={17} />}</button></div></div></article>)}</section>}
      {tab === 'Earnings' && <div className="hosting-earnings-layout"><section className="card hosting-section"><div className="hosting-section-head"><div><h2>{monthLabel} earnings</h2><p>Your completed and upcoming rental payouts.</p></div><Link href="/wallet" className="text-button">Open wallet <ChevronRight size={16} /></Link></div><div className="hosting-earnings-total"><strong>{money(monthEarnings, false)}</strong><span>Estimated earnings this month</span></div><div className="hosting-transaction-list">{earnings.slice(0, 8).map((txn) => <div key={txn.id} className="hosting-transaction"><span className="hosting-transaction-icon"><ArrowDownRight size={17} /></span><span><strong>{txn.label}</strong><small>{new Date(txn.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {txn.status === 'pending' ? 'Pending' : 'Paid'}</small></span><b>{money(txn.amount, false)}</b></div>)}</div></section><aside className="card hosting-payout-card"><span className="hosting-payout-icon"><HandCoins size={22} /></span><h2>Ready for your next payout?</h2><p>Keep track of available funds, payouts, and payment methods in your wallet.</p><Link href="/wallet" className="primary-button">Go to wallet <ChevronRight size={16} /></Link><small>Demo only · no real money moves.</small></aside></div>}
    </PageShell>
    {declining && <div className="hosting-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeclining(null); }}><section className="hosting-sheet" role="dialog" aria-modal="true" aria-labelledby="decline-title"><div className="hosting-sheet-handle" /><button type="button" className="icon-button hosting-sheet-close" aria-label="Close" onClick={() => setDeclining(null)}><X size={20} /></button><h2 id="decline-title">Decline this request?</h2><p>We’ll let {declining.counterpart.name} know. Pick a reason to include.</p><div className="hosting-reason-chips">{['Dates don’t work', 'Item unavailable', 'Not a good fit', 'Other reason'].map((value) => <button key={value} type="button" className={reason === value ? 'is-selected' : ''} onClick={() => setReason(value)}>{value}</button>)}</div><label className="hosting-field-label" htmlFor="decline-note">A note for the renter <span>Optional</span></label><textarea id="decline-note" className="control" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add a little context" rows={3} /><p className="hosting-sheet-note">Reason: {reason}</p><div className="button-row"><button type="button" className="secondary-button" onClick={() => setDeclining(null)}>Keep request</button><button type="button" className="danger-button" onClick={finishDecline}>Decline request</button></div></section></div>}
  </AuthRequired>;
}

/** Listing editor with saved availability, rental terms, and a live card preview. */
export function ManageListingPage({ params }: { params: Record<string, string> }) {
  const { data, updateHostListing, mutate, notify } = useDemo();
  const host = data.hostListings.find((entry) => entry.listingId === params.id);
  const item = itemFor(params.id);
  const extras = extraFor(data, params.id);
  const [title, setTitle] = useState(extras.title ?? item?.title ?? '');
  const [price, setPrice] = useState(host?.price ?? item?.price ?? 20);
  const [weekly, setWeekly] = useState(host?.weeklyDiscount ?? 10);
  const [monthly, setMonthly] = useState(host?.monthlyDiscount ?? 25);
  const [minDays, setMinDays] = useState(host?.minDays ?? 1);
  const [maxDays, setMaxDays] = useState(extras.maxDays);
  const [declaredValue, setDeclaredValue] = useState(extras.declaredValue);
  const [delivery, setDelivery] = useState(extras.delivery);
  const [pickup, setPickup] = useState(extras.pickup);
  const [rules, setRules] = useState(extras.rules);
  const [instantBook, setInstantBook] = useState(host?.instantBook ?? false);
  const [start, setStart] = useState(shiftDays(7));
  const [end, setEnd] = useState(shiftDays(9));
  const [blocked, setBlocked] = useState(host?.blocked ?? []);
  const [saved, setSaved] = useState(false);
  const weekPrice = price * (1 - weekly / 100);
  const monthPrice = price * (1 - monthly / 100);
  const blockedRuns = useMemo(() => {
    const sorted = [...blocked].sort();
    const groups: string[][] = [];
    sorted.forEach((date) => {
      const previous = groups[groups.length - 1];
      const prior = previous?.[previous.length - 1];
      if (prior && (Date.parse(`${date}T12:00:00`) - Date.parse(`${prior}T12:00:00`)) / 86400000 === 1) previous.push(date);
      else groups.push([date]);
    });
    return groups;
  }, [blocked]);
  function save() {
    if (!item || !host) return;
    updateHostListing(item.id, { price, weeklyDiscount: weekly, monthlyDiscount: monthly, minDays, instantBook, blocked });
    mutate((current) => ({ ...(current as HostData), hostSettings: { ...((current as HostData).hostSettings ?? {}), [item.id]: { title, maxDays, declaredValue, delivery, pickup, rules } } }));
    setSaved(true);
    notify('Listing changes saved.');
    window.setTimeout(() => setSaved(false), 2400);
  }
  function addBlocked() {
    if (!start || !end || end <= start) return;
    const values: string[] = [];
    const cursor = new Date(`${start}T12:00:00`);
    const last = new Date(`${end}T12:00:00`);
    while (cursor <= last) { values.push(cursor.toISOString().slice(0, 10)); cursor.setDate(cursor.getDate() + 1); }
    setBlocked((current) => [...new Set([...current, ...values])].sort());
  }
  if (!item || !host) return <PageShell title="Listing not found" subtitle="This listing may have been removed." back="/hosting" width="narrow"><EmptyState icon={<Package size={20} />} title="We couldn’t find that listing" body="Go back to your hosting dashboard to choose another listing." action={<Link href="/hosting" className="primary-button">Back to hosting</Link>} /></PageShell>;
  return <AuthRequired title="Manage your listing" reason="Sign in to edit your rental details."><PageShell title="Manage listing" subtitle="Keep the details clear, the calendar honest, and the handoff easy." eyebrow="Your listing" back="/hosting" width="wide" actions={<Pill tone={host.paused ? 'neutral' : 'success'}>{host.paused ? 'Paused' : 'Active'}</Pill>}>
    <div className="manage-layout"><div className="manage-form-column">
      <section className="card manage-section"><div className="manage-section-heading"><span><Package size={19} /></span><div><h2>Listing details</h2><p>What renters will see before they request.</p></div></div><div className="manage-field-grid"><Field label="Listing title" htmlFor="listing-title"><input id="listing-title" className="control" value={title} onChange={(event) => setTitle(event.target.value)} /></Field><Field label="Price per day" htmlFor="listing-price" hint="Set a clear daily rate. You can adjust it anytime."><div className="manage-price-input"><span>$</span><input id="listing-price" type="number" min="1" inputMode="decimal" className="control" value={price} onChange={(event) => setPrice(Math.max(1, Number(event.target.value)))} /><small>/ day</small></div></Field></div><div className="manage-discounts"><DiscountControl label="Weekly discount" value={weekly} onChange={setWeekly} resulting={weekPrice} /><DiscountControl label="Monthly discount" value={monthly} onChange={setMonthly} resulting={monthPrice} /></div><div className="manage-toggle-row"><span><strong>Instant book</strong><small>{instantBook ? 'Renters can book without waiting for approval.' : 'Review each request before you accept.'}</small></span><button type="button" role="switch" aria-checked={instantBook} className={`switch ${instantBook ? 'is-on' : ''}`} onClick={() => setInstantBook(!instantBook)}><span /></button></div></section>
      <section className="card manage-section"><div className="manage-section-heading"><span><CalendarDays size={19} /></span><div><h2>Rental terms</h2><p>Set a range that works for the item and your schedule.</p></div></div><div className="manage-days-grid"><Field label="Minimum days" htmlFor="min-days"><select id="min-days" className="control" value={minDays} onChange={(event) => setMinDays(Number(event.target.value))}>{[1, 2, 3, 4, 5, 7].map((days) => <option key={days} value={days}>{days} {days === 1 ? 'day' : 'days'}</option>)}</select></Field><Field label="Maximum days" htmlFor="max-days"><select id="max-days" className="control" value={maxDays} onChange={(event) => setMaxDays(Number(event.target.value))}>{[7, 14, 30, 60, 90].map((days) => <option key={days} value={days}>{days} days</option>)}</select></Field></div><div className="manage-divider" /><h3 className="manage-subheading">Block off dates</h3><p className="manage-help">Choose a date range when this item won’t be available.</p><CalendarRange start={start} end={end} onChange={(from, to) => { setStart(from); setEnd(to); }} /><button type="button" className="secondary-button manage-block-button" onClick={addBlocked}><Plus size={16} /> Block these dates</button>{blockedRuns.length > 0 && <div className="manage-blocked-list"><strong>Unavailable dates</strong>{blockedRuns.map((range) => <div key={range[0]}><span>{range.length === 1 ? longDate(range[0]) : dateRange(range[0], range[range.length - 1])}</span><button type="button" className="text-button" aria-label={`Remove blocked dates ${range[0]}`} onClick={() => setBlocked((current) => current.filter((date) => !range.includes(date)))}>Remove</button></div>)}</div>}</section>
      <section className="card manage-section"><div className="manage-section-heading"><span><HandCoins size={19} /></span><div><h2>Pickup and protection</h2><p>Give renters a few helpful options up front.</p></div></div><div className="manage-check-options"><label><input type="checkbox" checked={pickup} onChange={(event) => setPickup(event.target.checked)} /><span><strong>Pickup</strong><small>Renter picks up from your neighborhood.</small></span></label><label><input type="checkbox" checked={delivery} onChange={(event) => setDelivery(event.target.checked)} /><span><strong>Delivery</strong><small>Offer local delivery for a simple flat fee.</small></span></label></div><Field label="Declared replacement value" htmlFor="declared-value" hint="Used to estimate protection and the refundable deposit. Demo setting only."><select id="declared-value" className="control" value={declaredValue} onChange={(event) => setDeclaredValue(Number(event.target.value))}>{[100, 250, 300, 500, 750, 1000, 1500, 2000].map((value) => <option key={value} value={value}>{money(value, false)}</option>)}</select></Field><Field label="House rules" htmlFor="house-rules"><textarea id="house-rules" className="control" rows={4} value={rules} onChange={(event) => setRules(event.target.value)} /></Field></section>
    </div><aside className="manage-preview-column"><article className="card manage-preview"><div className="manage-preview-head"><div><h2>Listing preview</h2><p>How it appears to renters.</p></div><Eye size={18} /></div><div className="manage-preview-photo"><img src={item.image} alt={item.imageAlt} /><Pill tone={host.paused ? 'neutral' : 'success'}>{host.paused ? 'Paused' : 'Available'}</Pill></div><div className="manage-preview-copy"><h3>{title || item.title}</h3><span><Stars value={item.rating} size={12} /> {item.rating} <small>({item.reviews} reviews)</small></span><strong>{money(price, false)} <small>/ day</small></strong><div><span>{weekly}% off a week</span><span>{monthly}% off a month</span></div></div><p className="manage-preview-rule">{rules || 'Add house rules for your renters.'}</p></article><button type="button" className={`manage-pause-button ${host.paused ? 'is-resume' : ''}`} onClick={() => { updateHostListing(item.id, { paused: !host.paused }); notify(host.paused ? 'Listing is active again.' : 'Listing paused.'); }}>{host.paused ? <Play size={17} /> : <Pause size={17} />}{host.paused ? 'Resume listing' : 'Pause listing'}</button><p className="manage-demo-note">You can change your listing whenever you need to. Pausing hides it from new searches.</p></aside></div>
    <div className="manage-save-bar"><span>{saved ? <><Check size={16} /> Saved</> : 'Unsaved changes'}</span><button type="button" className="primary-button" onClick={save}>Save changes</button></div>
  </PageShell></AuthRequired>;
}

function RequestCard({ booking, onApprove, onDecline, onMessage }: { booking: Booking; onApprove: () => void; onDecline: () => void; onMessage: () => void }) {
  const item = itemFor(booking.listingId);
  return <article className="hosting-request-row"><Avatar name={booking.counterpart.name} initials={booking.counterpart.initials} size={48} /><div className="hosting-request-main"><div className="hosting-request-top"><div><strong>{booking.counterpart.name}</strong><span><Stars value={4.9} size={12} /> 4.9 · 8 rentals</span></div><Pill tone="warning">New request</Pill></div><p>{item?.title ?? 'Your listing'} · {dateRange(booking.start, booking.end)}</p><small>{booking.quote.days} days · {booking.fulfilment === 'pickup' ? 'Pickup' : 'Delivery'} · Payout <b>{money(booking.quote.subtotal, false)}</b></small><div className="hosting-request-actions"><button type="button" className="primary-button" onClick={onApprove}><Check size={16} /> Approve</button><button type="button" className="secondary-button" onClick={onDecline}>Decline</button><button type="button" className="icon-button" aria-label={`Message ${booking.counterpart.name}`} onClick={onMessage}><MessageCircle size={18} /></button></div></div></article>;
}

function BookingRow({ booking, onAction, onMessage }: { booking: Booking; onAction: () => void; onMessage: () => void }) {
  const item = itemFor(booking.listingId);
  const active = booking.status === 'active';
  return <article className="hosting-booking-row"><img src={item?.image} alt="" /><div className="hosting-booking-info"><strong>{item?.title ?? 'Rental'}</strong><span>{booking.counterpart.name} · {dateRange(booking.start, booking.end)}</span><small>{active ? 'With renter now' : `Pickup ${longDate(booking.start)}`}</small></div><button type="button" className="icon-button hosting-booking-message" aria-label={`Message ${booking.counterpart.name}`} onClick={onMessage}><MessageCircle size={17} /></button><button type="button" className="secondary-button hosting-booking-action" onClick={onAction}>{active ? 'Mark returned' : 'Start handoff'}</button></article>;
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const points = values.map((value, index) => `${index * (100 / (values.length - 1))},${29 - value / max * 25}`).join(' ');
  return <svg className="hosting-sparkline" viewBox="0 0 100 32" role="img" aria-label="Recent trend rising"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="100" cy={29 - values[values.length - 1] / max * 25} r="2.5" fill="currentColor" /></svg>;
}

function DiscountControl({ label, value, onChange, resulting }: { label: string; value: number; onChange: (value: number) => void; resulting: number }) {
  return <div className="manage-discount"><div><label htmlFor={`discount-${label}`}>{label}</label><strong>{value}% <small>· {money(resulting, false)} / day</small></strong></div><input id={`discount-${label}`} type="range" min="0" max="40" step="5" value={value} onChange={(event) => onChange(Number(event.target.value))} /><div className="manage-slider-labels"><span>No discount</span><span>40% off</span></div></div>;
}
