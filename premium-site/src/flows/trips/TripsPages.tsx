import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronRight, CircleHelp, Compass, MapPin, MessageCircle, PackageCheck, Star, Tag, X } from 'lucide-react';
import CalendarRange from '../../CalendarRange';
import { navigate } from '../../router';
import { categories, listings } from '../../data';
import type { Listing } from '../../data';
import { money, dateRange, longDate, listingById, relativeTime, shiftDays } from '../model';
import type { Booking, Wanted } from '../model';
import { useDemo } from '../store';
import { AuthRequired, Avatar, EmptyState, Field, Link, PageShell, Pill, Segmented } from '../ui';
import './trips.css';

const statusPresentation = (booking: Booking) => {
  if (booking.status === 'confirmed' && booking.depositStatus === 'pending') return { label: 'Awaiting payment', tone: 'warning' as const };
  const map: Record<Booking['status'], { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent' }> = {
    requested: { label: 'Requested', tone: 'warning' }, confirmed: { label: 'Confirmed', tone: 'success' }, active: { label: 'Active', tone: 'info' },
    returned: { label: 'Return in progress', tone: 'accent' }, completed: { label: 'Completed', tone: 'success' }, cancelled: { label: 'Cancelled', tone: 'neutral' }, declined: { label: 'Declined', tone: 'danger' },
  };
  return map[booking.status];
};

/** Shows renter-side bookings and wanted requests in one mobile-friendly trip hub. */
export function TripsPage({ params }: { params: Record<string, string> }) {
  void params;
  const { data } = useDemo();
  const [tab, setTab] = useState<'upcoming' | 'active' | 'past' | 'requests'>('upcoming');
  const bookings = data.bookings.filter((booking) => booking.role === 'renter');
  const upcoming = bookings.filter((booking) => ['requested', 'confirmed'].includes(booking.status));
  const active = bookings.filter((booking) => ['active', 'returned'].includes(booking.status));
  const past = bookings.filter((booking) => ['completed', 'cancelled', 'declined'].includes(booking.status));
  const options = [
    { value: 'upcoming' as const, label: 'Upcoming', count: upcoming.length }, { value: 'active' as const, label: 'Active', count: active.length },
    { value: 'past' as const, label: 'Past', count: past.length }, { value: 'requests' as const, label: 'Requests', count: data.wanted.length },
  ];
  const currentBookings = tab === 'upcoming' ? upcoming : tab === 'active' ? active : past;
  return <AuthRequired title="Trips are better together" reason="Sign in to see your rentals, messages, and requests in one place.">
    <PageShell title="Your trips" subtitle="Every good plan, all in one place." back="/" className="trips-hub">
      <Segmented options={options} value={tab} onChange={setTab} label="Trip sections" className="trips-tabs" />
      {tab === 'requests' ? <WantedOverview requests={data.wanted} /> : currentBookings.length ? <div className="trip-list">{currentBookings.map((booking) => <BookingCard booking={booking} key={booking.id} />)}</div> : <EmptyState icon={<Compass size={27} />} title={tab === 'upcoming' ? 'A little room for a new plan' : tab === 'active' ? 'Nothing in progress' : 'Your past trips will land here'} body={tab === 'upcoming' ? 'Find a useful thing nearby and make something of the weekend.' : 'When a trip is ready, you’ll find its details here.'} action={<Link className="primary-button" href="/">Explore gear</Link>} />}
    </PageShell>
  </AuthRequired>;
}

function BookingCard({ booking }: { booking: Booking }) {
  const listing = listingById(booking.listingId);
  if (!listing) return null;
  const status = statusPresentation(booking);
  return <Link href={`/trips/${booking.id}`} className="trip-card"><img className="trip-card-image" src={listing.image} alt={listing.imageAlt} /><div className="trip-card-content"><div className="trip-card-top"><Pill tone={status.tone}>{status.label}</Pill><span>{money(booking.quote.total)}</span></div><h2>{listing.title}</h2><p className="trip-card-dates"><CalendarDays size={15} />{dateRange(booking.start, booking.end)}</p><p className="trip-card-owner"><Avatar size={24} name={booking.counterpart.name} initials={booking.counterpart.initials} />With {booking.counterpart.name}</p></div><ChevronRight className="trip-card-chevron" size={19} aria-hidden="true" /></Link>;
}

function wantedStatus(request: Wanted): { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' } {
  if (request.status === 'fulfilled') return { label: 'Fulfilled', tone: 'success' };
  if (request.status === 'cancelled') return { label: 'Cancelled', tone: 'neutral' };
  if (request.matches.some((match) => match.startsWith('selected:'))) return { label: 'Negotiating', tone: 'info' };
  if (request.status === 'responses') return { label: 'Responses', tone: 'warning' };
  return { label: 'Open', tone: 'neutral' };
}

function WantedOverview({ requests }: { requests: Wanted[] }) {
  return <section className="wanted-overview"><div className="wanted-overview-heading"><div><h2>Things you’re looking for</h2><p>Tell the neighborhood what would make your plans easier.</p></div><Link className="primary-button" href="/wanted/new">Post a request</Link></div>
    {requests.length ? <div className="wanted-list">{requests.map((request) => { const status = wantedStatus(request); return <Link key={request.id} href={`/wanted/${request.id}`} className="wanted-row"><span className="wanted-row-icon"><Tag size={20} /></span><span className="wanted-row-main"><strong>{request.title}</strong><small>{dateRange(request.start, request.end)} · up to {money(request.budget)}/day</small></span><Pill tone={status.tone}>{status.label}</Pill><ChevronRight size={17} /></Link>; })}</div> : <EmptyState icon={<Tag size={25} />} title="Nothing on your wish list yet" body="Post what you need and nearby owners can send an offer." action={<Link href="/wanted/new" className="primary-button">Create a request</Link>} />}
  </section>;
}

/** Presents one booking with the actions available at its current stage. */
export function TripDetailPage({ params }: { params: Record<string, string> }) {
  const { data, updateBooking, notify, ensureConversation, pushNotice } = useDemo();
  const [cancelOpen, setCancelOpen] = useState(false);
  const booking = data.bookings.find((item) => item.id === params.id && item.role === 'renter');
  const listing = booking ? listingById(booking.listingId) : undefined;
  if (!booking || !listing) return <PageShell title="Trip details" back="/trips"><EmptyState icon={<CalendarDays size={26} />} title="We couldn’t find this trip" body="It may have been cleared from this demo session." action={<Link href="/trips" className="primary-button">Back to trips</Link>} /></PageShell>;
  const tripBooking: Booking = booking;
  const tripListing: Listing = listing;
  const status = statusPresentation(booking);
  const conversationId = booking.conversationId ?? data.conversations.find((item) => item.bookingId === booking.id)?.id;
  const progress = booking.status === 'requested' ? 0 : booking.status === 'confirmed' ? 1 : booking.status === 'active' ? 2 : booking.status === 'returned' ? 3 : 4;
  const stages = [
    { title: 'Request sent', body: 'Your request is with the owner.' }, { title: 'Confirmed', body: 'The trip is ready once payment is complete.' },
    { title: 'Picked up', body: 'Enjoy the time with your gear.' }, { title: 'Returned', body: 'The owner will check everything in.' },
    { title: booking.reviewed ? 'Reviewed' : 'Leave a review', body: booking.reviewed ? 'Thanks for sharing your experience.' : 'Help your neighbors know what to expect.' },
  ];
  function messageOwner() {
    const id = conversationId ?? ensureConversation({ listingId: tripListing.id, bookingId: tripBooking.id, with: tripBooking.counterpart });
    navigate(`/inbox/${id}`);
  }
  function confirmPayment() {
    updateBooking(tripBooking.id, { depositStatus: 'authorized' });
    notify('Payment confirmed in the demo. No real charge was made.');
    pushNotice({ type: 'payment', title: 'Trip payment confirmed', body: `Your trip for ${tripListing.title} is ready.`, href: `/trips/${tripBooking.id}` });
  }
  function cancelRequest() {
    updateBooking(tripBooking.id, { status: 'cancelled', depositStatus: 'released' });
    setCancelOpen(false);
    notify('Your request was cancelled.');
  }
  return <AuthRequired title="Your trip details" reason="Sign in to manage this rental."><PageShell title={listing.title} subtitle={`${dateRange(booking.start, booking.end)} · with ${booking.counterpart.name}`} back="/trips" className="trip-detail-page" width="wide">
    <div className="trip-detail-hero"><img src={listing.image} alt={listing.imageAlt} /><div className="trip-detail-hero-overlay"><Pill tone={status.tone} dot>{status.label}</Pill><h2>{listing.title}</h2><p>{longDate(booking.start)} – {longDate(booking.end)}</p></div></div>
    <div className="trip-detail-columns">
      <div className="trip-detail-main">
        <section className="card trip-progress-card"><h2 className="card-title">Your trip status</h2><ol className="timeline">{stages.map((stage, index) => <li key={stage.title} className={index < progress || (index === 4 && booking.reviewed) ? 'is-done' : index === progress ? 'is-current' : ''}><span className="timeline-dot">{index < progress || (index === 4 && booking.reviewed) ? <Check size={13} /> : index + 1}</span><div><strong>{stage.title}</strong><span>{stage.body}</span></div></li>)}</ol></section>
        <section className="card trip-handoff-card"><h2 className="card-title">Handoff details</h2><div className="trip-handoff-row"><span className="trip-detail-icon"><CalendarDays size={18} /></span><span><strong>{dateRange(booking.start, booking.end)}</strong><small>{booking.quote.days} {booking.quote.days === 1 ? 'day' : 'days'} · {booking.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}</small></span></div><div className="trip-handoff-row"><Avatar size={42} name={booking.counterpart.name} initials={booking.counterpart.initials} /><span><strong>{booking.fulfilment === 'delivery' ? 'Delivery arranged with' : 'Meet your neighbor'}</strong><small>{booking.counterpart.name} · details in your messages</small></span><button type="button" className="secondary-button" onClick={messageOwner}>Message</button></div><Link className="text-button trip-passport-link" href={`/passport/${listing.id}`}><PackageCheck size={16} />View item passport</Link></section>
        <section className="card trip-receipt">
          <h2 className="card-title">Price details <small>Ref {booking.ref}</small></h2>
          <dl className="kv">
            <div><dt>Rental ({booking.quote.days} days)</dt><dd>{money(booking.quote.subtotal)}</dd></div>
            {booking.quote.discount > 0 ? <div className="kv-saving"><dt>Discount</dt><dd>−{money(booking.quote.discount)}</dd></div> : null}
            <div><dt>Service fee</dt><dd>{money(booking.quote.serviceFee)}</dd></div>
            {booking.quote.deliveryFee > 0 ? <div><dt>Delivery</dt><dd>{money(booking.quote.deliveryFee)}</dd></div> : null}
            {booking.quote.protection > 0 ? <div><dt>YBuy Protection</dt><dd>{money(booking.quote.protection)}</dd></div> : null}
            <div><dt>Tax</dt><dd>{money(booking.quote.tax)}</dd></div>
            <div className="kv-total"><dt>Rental total</dt><dd>{money(booking.quote.total)}</dd></div>
            <div><dt>Refundable deposit</dt><dd>{money(booking.quote.deposit)} · {booking.depositStatus}</dd></div>
          </dl>
        </section>
        <section className="card trip-support-card"><CircleHelp size={20} /><span><strong>Need a hand?</strong><small>If anything feels off, let us know and we’ll help.</small></span><Link className="secondary-button" href={`/claims/new?booking=${booking.id}`}>Report a problem</Link></section>
      </div>
      <aside className="trip-detail-actions card"><h2>Make the next move</h2>
        {booking.status === 'confirmed' && booking.depositStatus === 'pending' && <button type="button" className="primary-button full-width" onClick={confirmPayment}>Pay &amp; confirm · {money(booking.quote.total)}</button>}
        {booking.status === 'confirmed' && booking.depositStatus !== 'pending' && <Link className="primary-button full-width" href={`/trips/${booking.id}/pickup`}>Start pickup <ArrowRight size={16} /></Link>}
        {booking.status === 'active' && <Link className="primary-button full-width" href={`/trips/${booking.id}/return`}>Start return <ArrowRight size={16} /></Link>}
        {booking.status === 'completed' && !booking.reviewed && <Link className="primary-button full-width" href={`/trips/${booking.id}/review`}>Leave a review <Star size={16} /></Link>}
        {booking.status === 'completed' && booking.reviewed && <Pill tone="success">Review shared</Pill>}
        {booking.status === 'requested' && <p className="trip-waiting-note">{booking.counterpart.name} usually responds within 24 hours. You can message them while you wait.</p>}
        {conversationId ? <Link className="secondary-button full-width" href={`/inbox/${conversationId}`}><MessageCircle size={16} />Message owner</Link> : <button className="secondary-button full-width" type="button" onClick={messageOwner}><MessageCircle size={16} />Message owner</button>}
        <Link className="text-button trip-action-passport" href={`/passport/${listing.id}`}>View item passport</Link>
        {booking.status === 'requested' && <button type="button" className="danger-button full-width" onClick={() => setCancelOpen(true)}>Cancel request</button>}
      </aside>
    </div>
    {cancelOpen && <div className="trip-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setCancelOpen(false); }}><section className="trip-cancel-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-title"><button type="button" className="trip-modal-close" aria-label="Close" onClick={() => setCancelOpen(false)}><X size={19} /></button><span className="trip-modal-icon"><CalendarDays size={21} /></span><h2 id="cancel-title">Cancel this request?</h2><p>The owner will be notified. Since the request isn’t confirmed yet, no rental payment or deposit will be taken.</p><div className="button-row"><button type="button" className="secondary-button" onClick={() => setCancelOpen(false)}>Keep request</button><button type="button" className="danger-button" onClick={cancelRequest}>Cancel request</button></div></section></div>}
  </PageShell></AuthRequired>;
}

const reviewTags = ['As described', 'Easy pickup', 'Friendly owner', 'Great communication', 'Like new', 'Good value', 'Would rent again'];
const ratingLabels = ['Accuracy', 'Communication', 'Condition', 'Value'] as const;
type RatingKey = typeof ratingLabels[number];

/** Collects a useful, private-to-the-community review after a completed trip. */
export function ReviewPage({ params }: { params: Record<string, string> }) {
  const { user, data, addReview, ensureConversation, sendMessage, notify } = useDemo();
  const booking = data.bookings.find((item) => item.id === params.id && item.role === 'renter');
  const listing = booking ? listingById(booking.listingId) : undefined;
  const [overall, setOverall] = useState(0);
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({ Accuracy: 0, Communication: 0, Condition: 0, Value: 0 });
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [error, setError] = useState('');
  if (!booking || !listing || booking.status !== 'completed' || booking.reviewed) return <PageShell title="Share your experience" back="/trips"><EmptyState icon={<Star size={26} />} title="This trip isn’t ready for a review" body="Reviews open after a trip is complete, and each trip can be reviewed once." action={<Link href="/trips" className="primary-button">Back to trips</Link>} /></PageShell>;
  function submitReview() {
    if (!user || !booking || !listing) return;
    if (overall < 1 || Object.values(ratings).some((value) => value < 1) || text.trim().length < 20) {
      setError('Add an overall rating, all four details, and at least 20 characters about your trip.');
      return;
    }
    const scoreValue = (key: RatingKey) => ratings[key];
    addReview({ listingId: listing.id, bookingId: booking.id, author: `${user.firstName} ${user.lastName}`.trim(), initials: `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`,
      about: 'item-owner', rating: overall, scores: { accuracy: scoreValue('Accuracy'), communication: scoreValue('Communication'), condition: scoreValue('Condition') },
      // The shared Review type has no value score, so keep that rating with the review tags.
      tags: [...tags, `Value ${scoreValue('Value')}/5`], text: text.trim() });
    if (privateNote.trim()) {
      // Private notes are kept out of the public Review record and sent only in the trip conversation.
      const conversationId = booking.conversationId ?? ensureConversation({ listingId: listing.id, bookingId: booking.id, with: booking.counterpart });
      sendMessage(conversationId, `A private note after our trip: ${privateNote.trim()}`);
    }
    notify('Thanks for sharing your experience.');
    navigate(`/trips/${booking.id}`);
  }
  return <AuthRequired title="Share your experience" reason="Sign in to leave a review for this completed trip."><PageShell title="How was the rental?" subtitle={`${listing.title} · borrowed from ${booking.counterpart.name}`} back={`/trips/${booking.id}`} className="review-page" width="narrow">
    <form className="review-form" onSubmit={(event) => { event.preventDefault(); submitReview(); }} noValidate>
      <section className="card review-overall"><p>Your review helps neighbors know what to expect.</p><StarRating label="Overall rating" value={overall} onChange={setOverall} large /><span className="review-overall-label" aria-live="polite">{overall ? ['','Not for me','Could be better','Just right','Really good','Loved it'][overall] : 'Tap a star to rate your trip'}</span></section>
      <section className="card review-subratings"><h2>Rate the details</h2>{ratingLabels.map((label) => <div className="review-rating-row" key={label}><span>{label}</span><StarRating label={label} value={ratings[label]} onChange={(value) => setRatings((current) => ({ ...current, [label]: value }))} /></div>)}</section>
      <section className="card review-writing"><Field label="What stood out?" htmlFor="review-text" hint={`${text.trim().length}/20 characters minimum. Keep it helpful and kind.`}><textarea id="review-text" className="control" value={text} onChange={(event) => setText(event.target.value)} placeholder="Share what it was like to rent this item…" /></Field><div className="review-tags"><h2>Quick tags</h2><div className="chip-row">{reviewTags.map((tag) => <button key={tag} type="button" className="chip" aria-pressed={tags.includes(tag)} onClick={() => setTags((current) => current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag])}>{tag}</button>)}</div></div></section>
      <section className="card"><Field label="Private note to the owner" htmlFor="review-private-note" optional hint="Sent directly to the owner, not shown with your public review."><textarea id="review-private-note" className="control" value={privateNote} onChange={(event) => setPrivateNote(event.target.value)} placeholder="Anything you’d like to tell them one-to-one?" /></Field></section>
      {error && <p className="review-error" role="alert">{error}</p>}
      <div className="review-submit"><button type="submit" className="primary-button">Share review <ArrowRight size={16} /></button><span>Your review will be visible on this listing.</span></div>
      <div className="sticky-cta review-sticky"><span className="sticky-cta-summary"><strong>Ready to share?</strong>Your trip review</span><button type="submit" className="primary-button">Share review <ArrowRight size={16} /></button></div>
    </form>
  </PageShell></AuthRequired>;
}

function StarRating({ label, value, onChange, large = false }: { label: string; value: number; onChange: (value: number) => void; large?: boolean }) {
  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); onChange(Math.min(5, value + 1 || 1)); }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); onChange(Math.max(1, value - 1 || 1)); }
  }
  return <div className={`review-stars ${large ? 'review-stars--large' : ''}`} role="radiogroup" aria-label={label} onKeyDown={handleKey}>{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" role="radio" aria-checked={value === rating} aria-label={`${rating} ${rating === 1 ? 'star' : 'stars'}`} tabIndex={value === rating || (!value && rating === 1) ? 0 : -1} onClick={() => onChange(rating)}><Star size={large ? 34 : 20} fill={rating <= value ? 'currentColor' : 'none'} /></button>)}</div>;
}

/** Lets the renter describe an item they need and collects offers from nearby owners. */
export function WantedPage({ params }: { params: Record<string, string> }) {
  void params;
  const { data } = useDemo();
  return <AuthRequired title="Find what you need" reason="Sign in to post requests and hear from nearby owners."><PageShell title="Wanted" subtitle="Can’t find the right thing? Let the neighborhood know." back="/" className="wanted-page" actions={<Link className="primary-button" href="/wanted/new">Create a request <ArrowRight size={16} /></Link>}>
    {data.wanted.length ? <div className="wanted-page-list">{data.wanted.map((request) => { const status = wantedStatus(request); const offerCount = request.matches.filter((id) => !id.startsWith('selected:')).length; return <Link className="wanted-card" key={request.id} href={`/wanted/${request.id}`}><div className="wanted-card-icon"><Tag size={21} /></div><div className="wanted-card-body"><div className="wanted-card-meta"><Pill tone={status.tone}>{status.label}</Pill><span>{relativeTime(request.createdAt)}</span></div><h2>{request.title}</h2><p>{request.category} · {dateRange(request.start, request.end)}</p><div className="wanted-card-foot"><span>Up to {money(request.budget)} / day</span><span>{offerCount ? `${offerCount} ${offerCount === 1 ? 'offer' : 'offers'}` : 'Waiting for offers'}</span></div></div><ChevronRight size={18} /></Link>; })}</div> : <EmptyState icon={<Tag size={26} />} title="Post a wanted request" body="Describe what you need, when you need it, and nearby owners can reach out with an offer." action={<Link className="primary-button" href="/wanted/new">Create a request</Link>} />}
  </PageShell></AuthRequired>;
}

/** Creates a wanted request and schedules a couple of local demo matches. */
export function NewWantedPage({ params }: { params: Record<string, string> }) {
  void params;
  const { addWanted, mutate, notify } = useDemo();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Outdoors');
  const [start, setStart] = useState(shiftDays(7));
  const [end, setEnd] = useState(shiftDays(9));
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState<number | null>(5);
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  function submit() {
    const min = Number(minBudget), max = Number(maxBudget);
    if (!title.trim() || !start || !end || !location.trim() || !details.trim() || !min || !max || min > max || end <= start) {
      setError('Add your item, valid dates, location, details, and a complete budget range.');
      return;
    }
    // Wanted stores one budget and no location field, so preserve both details in its description.
    const request = addWanted({ title: title.trim(), category, start, end, budget: max, radius,
      details: `Location: ${location.trim()}. Budget range: ${money(min)}–${money(max)} per day. ${details.trim()}` });
    const pool = listings.filter((listing) => listing.category === category);
    const matches = (pool.length ? pool : listings).slice(0, 2).map((listing) => listing.id);
    window.setTimeout(() => mutate((current) => ({ ...current, wanted: current.wanted.map((item) => item.id === request.id ? { ...item, status: 'responses', matches } : item) })), 1100);
    notify('Your request is posted. We’ll show nearby offers as they come in.');
    navigate(`/wanted/${request.id}`);
  }
  const categoryChoices = categories.filter((item) => item !== 'All gear');
  return <AuthRequired title="Post a request" reason="Sign in to let nearby owners know what you need."><PageShell title="What are you looking for?" subtitle="The more you share, the better the offers will fit." back="/wanted" className="wanted-new-page" width="narrow">
    <form className="wanted-form" onSubmit={(event) => { event.preventDefault(); submit(); }} noValidate>
      <section className="card"><Field label="What do you need?" htmlFor="wanted-title" hint="Be specific enough that a neighbor can picture it."><input id="wanted-title" className="control" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A two-person tent for the weekend" /></Field><div className="wanted-category-field"><span className="field-label">Category</span><div className="chip-row">{categoryChoices.map((item) => <button className="chip" type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div></div></section>
      <section className="card"><h2 className="wanted-form-heading">When do you need it?</h2><CalendarRange start={start} end={end} onChange={(first, last) => { setStart(first); setEnd(last); }} /></section>
      <section className="card"><h2 className="wanted-form-heading">Where should we look?</h2><Field label="Location" htmlFor="wanted-location" hint="Your neighborhood or ZIP code is enough."><input id="wanted-location" className="control" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Neighborhood or ZIP code" autoComplete="postal-code" /></Field><div className="wanted-radius-field"><span className="field-label">Search radius</span><div className="chip-row">{[5, 10, 25, 50, null].map((value) => <button key={value ?? 'any'} type="button" className="chip" aria-pressed={radius === value} onClick={() => setRadius(value)}>{value ? `${value} mi` : 'Any distance'}</button>)}</div></div></section>
      <section className="card"><h2 className="wanted-form-heading">Set your budget</h2><p className="wanted-form-copy">A range helps owners know what works for you.</p><div className="wanted-budget-row"><Field label="From / day" htmlFor="wanted-budget-min"><input id="wanted-budget-min" className="control" type="number" min="1" inputMode="decimal" value={minBudget} onChange={(event) => setMinBudget(event.target.value)} placeholder="$10" /></Field><Field label="Up to / day" htmlFor="wanted-budget-max"><input id="wanted-budget-max" className="control" type="number" min="1" inputMode="decimal" value={maxBudget} onChange={(event) => setMaxBudget(event.target.value)} placeholder="$30" /></Field></div><Field label="Anything else owners should know?" htmlFor="wanted-details" hint="Include useful specifics, like size, color, or included accessories."><textarea id="wanted-details" className="control" value={details} onChange={(event) => setDetails(event.target.value)} placeholder="I’m planning a weekend near the lake…" /></Field></section>
      {error && <p className="wanted-error" role="alert">{error}</p>}
      <div className="wanted-submit"><button type="submit" className="primary-button">Post request <ArrowRight size={16} /></button><span>Free to post. You decide if an offer is right for you.</span></div>
      <div className="sticky-cta wanted-sticky"><span className="sticky-cta-summary"><strong>Ready to look?</strong>Post a request</span><button className="primary-button" type="submit">Post request <ArrowRight size={16} /></button></div>
    </form>
  </PageShell></AuthRequired>;
}

/** Reviews the local offers for a wanted request and starts checkout for a chosen item. */
export function WantedDetailPage({ params }: { params: Record<string, string> }) {
  const { data, updateWanted, setCheckoutDraft, notify } = useDemo();
  const request = data.wanted.find((item) => item.id === params.id);
  if (!request) return <PageShell title="Wanted request" back="/wanted"><EmptyState icon={<Tag size={26} />} title="Request not found" body="This request may have been removed from the demo session." action={<Link href="/wanted" className="primary-button">Back to wanted</Link>} /></PageShell>;
  const wantedRequest: Wanted = request;
  const matches = wantedRequest.matches.filter((id) => !id.startsWith('selected:')).map((id) => listings.find((listing) => listing.id === id)).filter((listing): listing is Listing => !!listing);
  const accepted = wantedRequest.matches.find((id) => id.startsWith('selected:'))?.slice('selected:'.length);
  const currentStatus = wantedStatus(request);
  function acceptOffer(listing: Listing) {
    updateWanted(wantedRequest.id, { matches: [...wantedRequest.matches.filter((id) => !id.startsWith('selected:')), `selected:${listing.id}`] });
    setCheckoutDraft({ listingId: listing.id, start: wantedRequest.start, end: wantedRequest.end });
    notify(`${listing.owner}’s offer is ready to book.`);
    navigate('/checkout');
  }
  function setRequestStatus(status: Wanted['status']) {
    updateWanted(wantedRequest.id, { status });
    notify(status === 'fulfilled' ? 'Request marked fulfilled.' : 'Request cancelled.');
  }
  return <AuthRequired title="Your wanted request" reason="Sign in to review offers and manage your request."><PageShell title={request.title} subtitle={`${request.category} · ${dateRange(request.start, request.end)}`} back="/wanted" className="wanted-detail-page">
    <section className="card wanted-request-summary"><div className="wanted-summary-title"><span className="wanted-card-icon"><Tag size={21} /></span><div><Pill tone={currentStatus.tone}>{currentStatus.label}</Pill><h2>{request.title}</h2></div></div><p>{request.details}</p><div className="wanted-summary-meta"><span><CalendarDays size={16} />{dateRange(request.start, request.end)}</span><span><MapPin size={16} />{request.radius ? `Within ${request.radius} miles` : 'Any distance'}</span><span><Tag size={16} />Up to {money(request.budget)} / day</span></div></section>
    <section className="wanted-offers"><div className="wanted-offers-heading"><div><h2>Offers from nearby owners</h2><p>Compare the item and daily price before you book.</p></div>{matches.length > 0 && <Pill tone="accent">{matches.length} {matches.length === 1 ? 'offer' : 'offers'}</Pill>}</div>
      {matches.length ? <div className="wanted-offer-list">{matches.map((listing) => <article className="wanted-offer card" key={listing.id}><img src={listing.image} alt={listing.imageAlt} /><div className="wanted-offer-body"><p className="wanted-offer-owner"><Avatar name={listing.owner} initials={listing.initials} size={25} />{listing.owner} offers</p><h3>{listing.title}</h3><p className="wanted-offer-price"><strong>{money(listing.price)}</strong> / day · {money(listing.price * Math.max(1, Math.ceil((Date.parse(`${request.end}T12:00:00`) - Date.parse(`${request.start}T12:00:00`)) / 86400000)))} estimated rental</p><p className="wanted-offer-description">{listing.description}</p></div><button type="button" className="primary-button wanted-accept" onClick={() => acceptOffer(listing)}>{accepted === listing.id ? 'Continue to checkout' : 'View offer'} <ArrowRight size={16} /></button></article>)}</div> : <EmptyState icon={<Tag size={25} />} title="Looking around your neighborhood" body="We’ll add offers here as nearby owners respond." />}
    </section>
    <div className="wanted-detail-actions">{request.status !== 'fulfilled' && request.status !== 'cancelled' && <button type="button" className="secondary-button" onClick={() => setRequestStatus('fulfilled')}>Mark fulfilled</button>}{request.status !== 'cancelled' && <button type="button" className="danger-button" onClick={() => setRequestStatus('cancelled')}>Cancel request</button>}</div>
  </PageShell></AuthRequired>;
}
