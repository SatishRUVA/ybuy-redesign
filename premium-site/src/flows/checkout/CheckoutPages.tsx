import { useMemo, useState } from 'react';
import { ArrowRight, CreditCard, MapPin, ShieldCheck, Sparkles, Check, ChevronDown, LockKeyhole } from 'lucide-react';
import CalendarRange from '../../CalendarRange';
import { navigate } from '../../router';
import { DELIVERY_FEE, DECLARED_VALUE, makeId, makeRef, money, quoteFor, shortDate, listingById } from '../model';
import type { Booking, Fulfilment, PaymentMethod } from '../model';
import { AuthRequired, EmptyState, Field, Link, PageShell, Pill } from '../ui';
import { useDemo } from '../store';
import './checkout.css';

const brandFor = (number: string): PaymentMethod['brand'] => {
  const digits = number.replace(/\D/g, '');
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^5[1-5]/.test(digits) || /^2/.test(digits)) return 'Mastercard';
  return 'Visa';
};
const formatCard = (value: string) => value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

/** Completes a demo booking request and creates its owner conversation. */
export function CheckoutPage({ params }: { params: Record<string, string> }) {
  void params;
  const { user, data, checkoutDraft, setCheckoutDraft, addBooking, ensureConversation, sendMessage, pushNotice, notify, mutate } = useDemo();
  const [start, setStart] = useState(checkoutDraft?.start ?? '');
  const [end, setEnd] = useState(checkoutDraft?.end ?? '');
  const [fulfilment, setFulfilment] = useState<Fulfilment>('pickup');
  const [protection, setProtection] = useState(true);
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [agreement, setAgreement] = useState(false);
  const [depositConsent, setDepositConsent] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'saved' | 'new'>(data.paymentMethods.length ? 'saved' : 'new');
  const [paymentId, setPaymentId] = useState(data.paymentMethods.find((item) => item.isDefault)?.id ?? data.paymentMethods[0]?.id ?? '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [showSummary, setShowSummary] = useState(true);
  const [error, setError] = useState('');
  const listing = checkoutDraft ? listingById(checkoutDraft.listingId) : undefined;
  const pricedListing = useMemo(() => listing && checkoutDraft?.auctionPrice ? { ...listing, price: checkoutDraft.auctionPrice } : listing, [listing, checkoutDraft?.auctionPrice]);
  const quote = useMemo(() => pricedListing ? quoteFor(pricedListing, start, end, { fulfilment, protection }) : null, [pricedListing, start, end, fulfilment, protection]);

  if (!checkoutDraft || !listing || !pricedListing) {
    return <PageShell title="Your checkout" subtitle="Your next good day starts with the right gear." back="/">
      <EmptyState icon={<CreditCard size={26} />} title="Nothing to check out yet" body="Choose a listing and dates, and we’ll bring the details together here." action={<Link className="primary-button" href="/">Explore gear</Link>} />
    </PageShell>;
  }

  const checkoutListing = listing;
  const ownerName = checkoutListing.owner;
  const ownerInitials = checkoutListing.initials;
  const canSubmit = !!quote && message.trim().length > 0 && agreement && depositConsent && (fulfilment !== 'delivery' || address.trim().length > 5) && (paymentMode === 'saved' ? !!paymentId : cardNumber.replace(/\D/g, '').length >= 15 && /^\d{2}\/\d{2}$/.test(expiry) && nameOnCard.trim().length > 1);

  function submit() {
    if (!user) return;
    if (!quote || !canSubmit) {
      setError(!quote ? 'Choose a valid pickup and return date.' : 'Complete the required details before sending your request.');
      return;
    }
    if (paymentMode === 'new') {
      const digits = cardNumber.replace(/\D/g, '');
      const method: PaymentMethod = { id: makeId('pm'), brand: brandFor(digits), last4: digits.slice(-4), exp: expiry, isDefault: true };
      mutate((current) => ({ ...current, paymentMethods: [method, ...current.paymentMethods.map((item) => ({ ...item, isDefault: false }))] }));
    }
    const bookingId = makeId('bk');
    const counterpart = { name: ownerName, initials: ownerInitials };
    const conversationId = ensureConversation({ listingId: checkoutListing.id, bookingId, with: counterpart });
    const booking: Booking = {
      id: bookingId, ref: makeRef('YB'), listingId: checkoutListing.id, role: 'renter', counterpart,
      start, end, fulfilment, withProtection: protection, quote, status: 'requested', depositStatus: 'pending', createdAt: Date.now(), conversationId,
    };
    addBooking(booking);
    const deliveryLine = fulfilment === 'delivery' ? ` Delivery address: ${address.trim()}.` : '';
    sendMessage(conversationId, `${message.trim()}${deliveryLine}`);
    pushNotice({ type: 'booking', title: 'Request sent', body: `Your request for ${checkoutListing.title} is with ${ownerName}.`, href: `/trips/${bookingId}` });
    setCheckoutDraft(null);
    notify('Your request is on its way.');
    navigate(`/checkout/done/${bookingId}`);
  }

  const summary = <section className="card card--raised checkout-summary" aria-label="Booking summary">
    <div className="checkout-summary-head"><img src={listing.image} alt={listing.imageAlt} /><div><h2>{listing.title}</h2><p>{checkoutDraft.auctionPrice ? <Pill tone="accent">Won at auction</Pill> : <span>Neighborhood favorite</span>}</p></div></div>
    <div className="checkout-summary-dates"><span>Your dates</span><strong>{start && end ? `${shortDate(start)} – ${shortDate(end)}` : 'Choose your dates'}</strong></div>
    {checkoutDraft.auctionPrice && <div className="checkout-auction-note"><Sparkles size={15} /> Won at auction · {money(checkoutDraft.auctionPrice)} per day</div>}
    <dl className="kv checkout-breakdown">
      <div><dt>{money(pricedListing.price)} × {quote?.days ?? 0} days</dt><dd>{money(quote?.subtotal ?? 0)}</dd></div>
      {!!quote?.discount && <div className="kv-saving"><dt>{quote.discountLabel}</dt><dd>−{money(quote.discount)}</dd></div>}
      <div><dt>Service fee</dt><dd>{money(quote?.serviceFee ?? 0)}</dd></div>
      {!!quote?.deliveryFee && <div><dt>Delivery</dt><dd>{money(quote.deliveryFee)}</dd></div>}
      {!!quote?.protection && <div><dt>YBuy Protection</dt><dd>{money(quote.protection)}</dd></div>}
      <div><dt>Tax</dt><dd>{money(quote?.tax ?? 0)}</dd></div>
      <div className="kv-total"><dt>Total</dt><dd>{money(quote?.total ?? 0)}</dd></div>
      <div><dt>Refundable deposit</dt><dd>{money(quote?.deposit ?? 0)}</dd></div>
    </dl>
    <p className="checkout-deposit-note">The deposit is authorized for the rental, then released after a successful return. It is not part of today’s rental total.</p>
  </section>;

  return <AuthRequired title="Make this rental yours" reason="Sign in to send a request and keep your trip details in one place.">
    <PageShell title="Request to book" subtitle="A few details, then your request goes straight to the owner." back="/" className="checkout-page" aside={summary}>
      <div className="checkout-mobile-summary">
        <button type="button" className="checkout-summary-toggle" aria-expanded={showSummary} onClick={() => setShowSummary((value) => !value)}>
          <span><strong>{money(quote?.total ?? 0)}</strong><small>total before refundable deposit</small></span><span>{showSummary ? 'Hide details' : 'View details'}<ChevronDown size={16} /></span>
        </button>
        {showSummary && summary}
      </div>
      <form id="checkout-form" className="checkout-form" onSubmit={(event) => { event.preventDefault(); submit(); }} noValidate>
        <section className="checkout-section" aria-labelledby="checkout-trip-heading">
          <div className="checkout-section-heading"><span className="checkout-step-icon"><span>1</span></span><div><h2 id="checkout-trip-heading">Your trip</h2><p>Make sure these dates work for you.</p></div></div>
          <CalendarRange start={start} end={end} onChange={(first, last) => { setStart(first); setEnd(last); }} />
          <p className="checkout-quantity"><span>Quantity</span><strong>1 item</strong><small>This listing is shared as a single set.</small></p>
        </section>
        <section className="checkout-section" aria-labelledby="checkout-fulfilment-heading">
          <div className="checkout-section-heading"><span className="checkout-step-icon"><span>2</span></span><div><h2 id="checkout-fulfilment-heading">Pickup or delivery</h2><p>Choose the handoff that suits your day.</p></div></div>
          <div className="choice-grid checkout-choices">
            <label className="choice"><input type="radio" name="fulfilment" value="pickup" checked={fulfilment === 'pickup'} onChange={() => setFulfilment('pickup')} /><MapPin size={20} /><span><strong>Pickup</strong><small>Meet your neighbor at an agreed spot</small></span></label>
            <label className="choice"><input type="radio" name="fulfilment" value="delivery" checked={fulfilment === 'delivery'} onChange={() => setFulfilment('delivery')} /><span className="checkout-delivery-icon">↗</span><span><strong>Delivery <em>+{money(DELIVERY_FEE, false)}</em></strong><small>Have it brought to your address</small></span></label>
          </div>
          {fulfilment === 'delivery' && <Field label="Delivery address" htmlFor="checkout-address" hint="Your address is shared with the owner only for this handoff."><input id="checkout-address" className="control" autoComplete="street-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street, city, ZIP code" required /></Field>}
        </section>
        <section className="checkout-section" aria-labelledby="checkout-protection-heading">
          <div className="checkout-section-heading"><span className="checkout-step-icon"><span>3</span></span><div><h2 id="checkout-protection-heading">Protect your rental</h2><p>Know what is covered before pickup.</p></div></div>
          <div className="choice-grid checkout-choices">
            <label className="choice"><input type="radio" name="protection" checked={protection} onChange={() => setProtection(true)} /><ShieldCheck size={21} /><span><strong>YBuy Protection <Pill tone="success">Recommended</Pill></strong><small>{money((DECLARED_VALUE[listing.id] ?? 300) * .01)} per day for damage support and covered mishaps.</small></span></label>
            <label className="choice"><input type="radio" name="protection" checked={!protection} onChange={() => setProtection(false)} /><span className="checkout-deposit-symbol">$</span><span><strong>Deposit only</strong><small>Skip protection. You’re responsible for damage to the item.</small></span></label>
          </div>
          <p className="checkout-explainer">A refundable {money(quote?.deposit ?? 0)} deposit is held separately while you rent and released after the owner confirms the return. <Link href="/protection">How protection works</Link></p>
        </section>
        <section className="checkout-section" aria-labelledby="checkout-payment-heading">
          <div className="checkout-section-heading"><span className="checkout-step-icon"><span>4</span></span><div><h2 id="checkout-payment-heading">Payment method</h2><p>Demo only — no real charge is made.</p></div></div>
          {data.paymentMethods.length > 0 && <div className="checkout-payment-list">{data.paymentMethods.map((method) => <label className="checkout-payment-option" key={method.id}><input type="radio" name="payment" checked={paymentMode === 'saved' && paymentId === method.id} onChange={() => { setPaymentMode('saved'); setPaymentId(method.id); }} /><span className="checkout-card-mark">{method.brand === 'Visa' ? 'VISA' : method.brand === 'Amex' ? 'AMEX' : method.brand === 'Mastercard' ? 'MC' : method.brand}</span><span><strong>{method.brand} ending in {method.last4}</strong><small>Expires {method.exp}{method.isDefault ? ' · Default' : ''}</small></span></label>)}</div>}
          <label className="checkout-payment-option"><input type="radio" name="payment" checked={paymentMode === 'new'} onChange={() => setPaymentMode('new')} /><CreditCard size={20} /><span><strong>Add a new card</strong><small>Card details stay in this demo session.</small></span></label>
          {paymentMode === 'new' && <div className="checkout-card-fields"><Field label="Name on card" htmlFor="checkout-card-name"><input id="checkout-card-name" className="control" autoComplete="cc-name" value={nameOnCard} onChange={(event) => setNameOnCard(event.target.value)} /></Field><Field label="Card number" htmlFor="checkout-card-number" hint={`${brandFor(cardNumber)} · demo formatting only`}><input id="checkout-card-number" className="control" inputMode="numeric" autoComplete="cc-number" value={cardNumber} onChange={(event) => setCardNumber(formatCard(event.target.value))} placeholder="0000 0000 0000 0000" /></Field><Field label="Expiry" htmlFor="checkout-card-expiry"><input id="checkout-card-expiry" className="control" inputMode="numeric" autoComplete="cc-exp" value={expiry} onChange={(event) => setExpiry(formatExpiry(event.target.value))} placeholder="MM/YY" /></Field></div>}
        </section>
        <section className="checkout-section" aria-labelledby="checkout-message-heading">
          <div className="checkout-section-heading"><span className="checkout-step-icon"><span>5</span></span><div><h2 id="checkout-message-heading">Message {ownerName}</h2><p>Introduce yourself and share what you’re planning.</p></div></div>
          <Field label="Your message" htmlFor="checkout-message" hint="A little context makes it easier to plan a smooth handoff."><textarea id="checkout-message" className="control" value={message} onChange={(event) => setMessage(event.target.value)} placeholder={`Hi ${ownerName}, I’d love to borrow this for…`} required /></Field>
          <div className="checkout-tips"><strong>A helpful note includes</strong><span>What you’ll use it for</span><span>Any pickup or delivery questions</span></div>
        </section>
        <section className="checkout-section checkout-agreements" aria-label="Agreements">
          <label><input type="checkbox" checked={agreement} onChange={(event) => setAgreement(event.target.checked)} /><span>I agree to the <Link href="/terms">rental terms</Link> and will return the item on time and in good condition.</span></label>
          <label><input type="checkbox" checked={depositConsent} onChange={(event) => setDepositConsent(event.target.checked)} /><span>I understand the {money(quote?.deposit ?? 0)} refundable deposit is authorized separately and may be used for eligible claims.</span></label>
          {error && <p className="checkout-error" role="alert">{error}</p>}
        </section>
        <div className="checkout-desktop-submit"><button type="submit" className="primary-button" disabled={!quote}>Send request <ArrowRight size={17} /></button><p><LockKeyhole size={13} />No payment is taken until your request is approved.</p></div>
      </form>
      <div className="sticky-cta checkout-sticky-cta"><span className="sticky-cta-summary"><strong>{money(quote?.total ?? 0)}</strong>Rental total · deposit separate</span><button type="submit" form="checkout-form" className="primary-button" disabled={!quote}>Send request <ArrowRight size={16} /></button></div>
    </PageShell>
  </AuthRequired>;
}

/** Confirms a request and explains the next steps in plain language. */
export function ConfirmationPage({ params }: { params: Record<string, string> }) {
  const { data } = useDemo();
  const booking = data.bookings.find((item) => item.id === params.bookingId && item.role === 'renter');
  const listing = booking ? listingById(booking.listingId) : undefined;
  if (!booking || !listing) return <PageShell title="Request sent" back="/trips"><EmptyState icon={<Check size={26} />} title="Your trip is in good hands" body="We couldn’t find those booking details in this demo session." action={<Link className="primary-button" href="/trips">View your trips</Link>} /></PageShell>;
  const conversationId = booking.conversationId ?? data.conversations.find((item) => item.bookingId === booking.id)?.id;
  return <AuthRequired title="Your request is on its way" reason="Sign in to keep track of this trip and hear back from the owner."><PageShell title="Request sent" subtitle="A good plan is already taking shape." back="/trips" className="checkout-confirmation" width="narrow">
    <div className="checkout-confirm-card card"><span className="checkout-confirm-mark"><Check size={34} /></span><Pill tone="accent">Request sent</Pill><h2>{listing.title}</h2><p>{shortDate(booking.start)} – {shortDate(booking.end)} · {money(booking.quote.total)} rental total</p><p className="checkout-confirm-copy">{booking.counterpart.name} has your note and trip details. You’ll hear back here, usually within a day.</p></div>
    <section className="card checkout-next"><h2>What happens next</h2><ol className="timeline"><li className="is-done"><span className="timeline-dot"><Check size={13} /></span><div><strong>{booking.counterpart.name} reviews your request</strong><span>Usually within 24 hours</span></div></li><li className="is-current"><span className="timeline-dot">2</span><div><strong>Pay and confirm</strong><span>Once approved, finish payment in your trips</span></div></li><li><span className="timeline-dot">3</span><div><strong>Pick up your gear</strong><span>Coordinate a handoff with your neighbor</span></div></li></ol></section>
    <div className="button-row checkout-confirm-actions"><Link className="primary-button" href={`/trips/${booking.id}`}>View trip</Link>{conversationId && <Link className="secondary-button" href={`/inbox/${conversationId}`}>Message owner</Link>}<Link className="text-button" href="/">Keep exploring</Link></div>
  </PageShell></AuthRequired>;
}
