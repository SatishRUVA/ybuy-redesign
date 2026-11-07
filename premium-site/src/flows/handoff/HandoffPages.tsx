import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, MapPin, MessageCircle, PackageCheck, ShieldCheck } from 'lucide-react';
import { navigate } from '../../router';
import { dateRange, listingById, longDate, money } from '../model';
import type { Booking, HandoffRecord } from '../model';
import { useDemo } from '../store';
import { AuthRequired, EmptyState, Field, Link, ListingThumb, PageShell, Pill } from '../ui';
import { ConditionPhotos } from './ConditionPhotos';
import './handoff.css';

type Mode = 'pickup' | 'return';
interface Draft { step: number; arrived: boolean; verified: boolean; checklist: Record<string, boolean>; photos: string[]; notes: string; agreed: boolean; damage: boolean }
const pickupSteps = ['Meet', 'Verify', 'Inspect', 'Confirm'];
const returnSteps = ['Meet', 'Condition', 'Confirm', 'Done'];

/** A stable demo handoff code; this visual is not a real scannable QR credential. */
function codeFor(id: string) { let hash = 17; for (const char of id) hash = ((hash * 31) + char.charCodeAt(0)) >>> 0; return String(100000 + hash % 900000); }
function storageKey(id: string, mode: Mode) { return `ybuy-handoff-${mode}-${id}`; }
function loadDraft(booking: Booking, mode: Mode): Draft {
  const empty: Draft = { step: 0, arrived: false, verified: false, checklist: {}, photos: [], notes: '', agreed: false, damage: false };
  try {
    const saved = window.sessionStorage.getItem(storageKey(booking.id, mode));
    if (!saved) return empty;
    const draft = JSON.parse(saved) as Draft;
    if (typeof draft.step !== 'number' || !Array.isArray(draft.photos) || !draft.checklist) return empty;
    return { ...empty, ...draft, step: Math.max(0, Math.min(mode === 'pickup' ? 3 : 2, draft.step)) };
  } catch { return empty; }
}

function ScanPattern({ id }: { id: string }) {
  const code = codeFor(id);
  const seed = Number(code);
  const finder = (x: number, y: number) => {
    for (const [left, top] of [[0, 0], [14, 0], [0, 14]]) {
      if (x >= left && x < left + 7 && y >= top && y < top + 7) {
        const dx = x - left; const dy = y - top;
        return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      }
    }
    return ((x * 73 + y * 47 + x * y * 17 + seed) % 13) < 6;
  };
  return <svg className="handoff-pattern" viewBox="-2 -2 25 25" role="img" aria-label="Illustrative demo handoff pattern, not a real QR code"><rect x="-2" y="-2" width="25" height="25" fill="white" />{Array.from({ length: 441 }, (_, n) => finder(n % 21, Math.floor(n / 21)) ? <rect key={n} x={n % 21} y={Math.floor(n / 21)} width="1" height="1" fill="currentColor" /> : null)}</svg>;
}

function MeetingCard({ booking, mode, message }: { booking: Booking; mode: Mode; message: () => void }) {
  return <><section className="card handoff-meeting"><div className="handoff-section-line"><h2>{mode === 'pickup' ? 'Your pickup plan' : 'Bring it full circle'}</h2><Pill tone="accent">{booking.fulfilment === 'delivery' ? 'Delivery' : 'Meet in person'}</Pill></div>
    <div className="handoff-plan-row"><CalendarDays size={23} aria-hidden="true" /><div><strong>{longDate(mode === 'pickup' ? booking.start : booking.end)}</strong><span>{mode === 'pickup' ? 'Suggested time · 10:00 am' : 'Suggested return · 6:00 pm'}</span></div></div>
    <div className="handoff-plan-row"><MapPin size={23} aria-hidden="true" /><div><strong>{booking.fulfilment === 'delivery' ? 'Arrange delivery in your conversation' : 'Coffee shop on Main St'}</strong><span>Sample meeting point · confirm the exact place and time in messages.</span></div></div>
    <button className="secondary-button full-width" type="button" onClick={message}><MessageCircle size={18} aria-hidden="true" />Message {booking.counterpart.name}</button>
  </section><div className="notice-banner"><ShieldCheck size={23} aria-hidden="true" /><div><strong>A good handoff feels comfortable.</strong><p>Meet somewhere public and well-lit. Check the gear together, keep payments on YBuy, and take your time. You can pause if anything feels off.</p></div></div></>;
}

function HandoffWizard({ booking, mode }: { booking: Booking; mode: Mode }) {
  const { user, updateBooking, ensureConversation, pushNotice, notify } = useDemo();
  const [draft, setDraft] = useState<Draft>(() => loadDraft(booking, mode));
  const [code, setCode] = useState('');
  const [entryMode, setEntryMode] = useState(false);
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [complete, setComplete] = useState(mode === 'return' && booking.status === 'completed');
  const timer = useRef<number>();
  const heading = useRef<HTMLHeadingElement>(null);
  const storageWarned = useRef(false);
  const listing = listingById(booking.listingId)!;
  const steps = mode === 'pickup' ? pickupSteps : returnSteps;
  const step = complete ? 3 : draft.step;
  const codeValue = codeFor(booking.id);
  const isPickup = mode === 'pickup';
  const allInspected = listing.includes.every((item) => draft.checklist[item] === true);
  const allAnswered = listing.includes.every((item) => typeof draft.checklist[item] === 'boolean');
  const missingItems = listing.includes.filter((item) => draft.checklist[item] === false);
  const hasIssue = draft.damage || missingItems.length > 0;
  const patch = (value: Partial<Draft>) => setDraft((current) => ({ ...current, ...value }));

  useEffect(() => {
    if (complete) return;
    try { window.sessionStorage.setItem(storageKey(booking.id, mode), JSON.stringify(draft)); }
    catch { if (!storageWarned.current) { notify('Your photos are safe in this open page, but browser storage is full. Finish before leaving.'); storageWarned.current = true; } }
  }, [booking.id, complete, draft, mode, notify]);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);

  const message = () => {
    const id = ensureConversation({ listingId: booking.listingId, bookingId: booking.id, with: booking.counterpart });
    if (booking.conversationId !== id) updateBooking(booking.id, { conversationId: id });
    navigate(`/inbox/${id}`);
  };
  const verify = () => {
    if (code !== codeValue) { setError(`That code doesn’t match. In this demo, use ${codeValue}.`); return; }
    patch({ verified: true }); setError(''); notify('Handoff code matched.');
  };
  const finish = () => {
    const record: HandoffRecord = { at: Date.now(), checklist: draft.checklist, photos: draft.photos, notes: [draft.notes.trim(), !isPickup && draft.damage ? 'Damage reported at return.' : '', missingItems.length && !isPickup ? `Items not returned: ${missingItems.join(', ')}.` : ''].filter(Boolean).join('\n') };
    if (isPickup) updateBooking(booking.id, { status: 'active', pickup: record });
    else {
      updateBooking(booking.id, { status: 'completed', return: record, depositStatus: hasIssue ? booking.depositStatus : 'released' });
    }
    pushNotice({ type: 'booking', title: isPickup ? 'You’re all set. Enjoy the rental!' : 'Return complete. Thanks for sharing.', body: isPickup ? `${listing.title} is now active. Your condition photos are saved with the trip.` : hasIssue ? 'Your return is recorded. Keep the deposit on hold while any issues are reviewed.' : 'Your condition photos are saved and the demo deposit release has been initiated.', href: `/trips/${booking.id}` });
    try { window.sessionStorage.removeItem(storageKey(booking.id, mode)); } catch { /* Continue without browser draft cleanup. */ }
    notify(isPickup ? 'Pickup confirmed. Your rental has started.' : 'Return confirmed. Your condition report is saved.');
    if (isPickup) navigate(`/trips/${booking.id}`); else { setComplete(true); patch({ step: 3 }); window.scrollTo({ top: 0, behavior: 'instant' }); }
  };
  const next = () => {
    setError('');
    if (step === 0 && !draft.arrived) { setError('Let your neighbor know you’ve arrived before continuing.'); return; }
    if (isPickup && step === 1 && !draft.verified) { setError('Check the code together or enter your neighbor’s demo code.'); return; }
    if (((isPickup && step === 2) || (!isPickup && step === 1)) && (draft.photos.length < 2 || (isPickup ? !allInspected : !allAnswered))) { setError(`Add at least 2 condition photos and ${isPickup ? 'check every included item' : 'answer yes or no for every item'}.`); return; }
    if (isPickup && step === 3 && !draft.agreed) { setError('Confirm the handoff agreement to start your rental.'); return; }
    if (!isPickup && step === 2 && !draft.verified) { setError('Ask your neighbor to confirm the return first.'); return; }
    if ((isPickup && step === 3) || (!isPickup && step === 2)) { finish(); return; }
    patch({ step: step + 1 }); window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const checklist = <section className="handoff-checklist"><h3>{isPickup ? 'Everything included?' : 'Everything coming back?'}</h3><p>{isPickup ? 'Check each item together. Note any wear before you leave.' : 'Choose yes or no for every item. Missing something? Note it below so both sides have a record.'}</p>{listing.includes.map((item) => isPickup ? <label className="handoff-check-item" key={item}><input type="checkbox" checked={draft.checklist[item] ?? false} onChange={(event) => patch({ checklist: { ...draft.checklist, [item]: event.target.checked } })} /><span>{item}</span></label> : <fieldset className="handoff-return-item" key={item}><legend>{item}</legend><div>{[true, false].map((answer) => <label key={String(answer)}><input type="radio" name={`returned-${item}`} checked={draft.checklist[item] === answer} onChange={() => patch({ checklist: { ...draft.checklist, [item]: answer } })} /><span>{answer ? 'Yes, returned' : 'No, missing'}</span></label>)}</div></fieldset>)}</section>;
  const photoStep = <section className="card handoff-inspect">{checklist}<Field label="Condition notes" htmlFor="handoff-notes" optional hint="Mention existing marks, missing parts, or anything you noticed together."><textarea className="control" id="handoff-notes" value={draft.notes} maxLength={2000} placeholder="For example: small scuff on the left side, already present." onChange={(event) => patch({ notes: event.target.value })} /></Field><ConditionPhotos photos={draft.photos} onChange={(photos) => patch({ photos })} />{!isPickup && <div className="handoff-damage"><label className="handoff-check-item"><input type="checkbox" checked={draft.damage} onChange={(event) => patch({ damage: event.target.checked })} /><span>There’s damage to report</span></label>{hasIssue && <div className="notice-banner notice-banner--warning"><ShieldCheck size={20} aria-hidden="true" /><div><strong>Let’s get this documented.</strong><p>Describe the issue in your condition notes. Your draft is saved if you leave this page.</p><Link className="text-button" href={`/claims/new?booking=${booking.id}`}>Start a {draft.damage ? 'damage' : 'missing-parts'} report <ArrowRight size={15} aria-hidden="true" /></Link></div></div>}</div>}</section>;
  const stepTitles = isPickup ? ['A good place to meet.', 'A little check. A lot of trust.', 'Take a moment. Check it together.', 'Ready for a good day?'] : ['One last meetup.', 'Back in good hands.', 'Make it official, together.', 'A good ending. A new beginning.'];

  return <PageShell title={isPickup ? 'Pick up your gear' : 'Return your gear'} subtitle={`${booking.counterpart.name} · ${booking.ref}`} eyebrow="THE LITTLE DETAILS, TAKEN CARE OF" back={`/trips/${booking.id}`} className="handoff-page" aside={<><section className="card handoff-trip-card"><ListingThumb listingId={listing.id} size={88} /><h2>{listing.title}</h2><p>{dateRange(booking.start, booking.end)}</p><Pill tone="accent">{complete ? 'Completed' : booking.status}</Pill><dl className="kv"><div><dt>Your neighbor</dt><dd>{booking.counterpart.name}</dd></div><div><dt>Refundable deposit</dt><dd>{money(booking.quote.deposit)}</dd></div></dl><Link href={`/trips/${booking.id}`} className="text-button">View trip details <ArrowRight size={15} aria-hidden="true" /></Link></section><div className="handoff-help"><ShieldCheck size={23} aria-hidden="true" /><p>No rush. If anything doesn’t feel right, pause the handoff and <Link href="/help">get help</Link>.</p></div></>}>
    <ol className="handoff-stepper" aria-label={`${isPickup ? 'Pickup' : 'Return'} progress`}>{steps.map((label, index) => <li key={label} className={index === step ? 'is-current' : index < step ? 'is-done' : ''} aria-current={index === step ? 'step' : undefined}><span>{index < step ? <Check size={17} aria-hidden="true" /> : index + 1}</span><small>{label}</small></li>)}</ol>
    <header className="handoff-step-heading"><span>Step {step + 1} of 4</span><h2 ref={heading} tabIndex={-1}>{stepTitles[step]}</h2><p>{step === 0 ? 'Confirm your plan with your neighbor before you head over.' : isPickup && step === 1 ? 'Only share your handoff code when you’re together and ready.' : (isPickup && step === 2) || (!isPickup && step === 1) ? 'A shared record makes the whole experience easier.' : complete ? 'Thanks for taking care of a little piece of your neighborhood.' : 'A final check, and you’re all set.'}</p></header>
    {step === 0 && <><MeetingCard booking={booking} mode={mode} message={message} /><button type="button" className={`handoff-arrived ${draft.arrived ? 'is-arrived' : ''}`} aria-pressed={draft.arrived} onClick={() => { patch({ arrived: !draft.arrived }); notify(draft.arrived ? 'Arrival cleared.' : 'Arrival noted in this demo. Message your neighbor to let them know.'); }}><CheckCircle2 size={25} aria-hidden="true" /><span><strong>{draft.arrived ? 'You’re here. Lovely.' : 'I’ve arrived'}</strong><small>{draft.arrived ? 'Continue when your neighbor is with you.' : 'Tap when you’re at the meeting point.'}</small></span>{draft.arrived && <Check size={22} aria-hidden="true" />}</button></>}
    {isPickup && step === 1 && <section className="card handoff-verification"><div className="handoff-code-tabs"><button type="button" className={`chip ${!entryMode ? 'is-active' : ''}`} aria-pressed={!entryMode} onClick={() => setEntryMode(false)}>Show my code</button><button type="button" className={`chip ${entryMode ? 'is-active' : ''}`} aria-pressed={entryMode} onClick={() => setEntryMode(true)}>Enter their code</button></div>{entryMode ? <><Field label="Your neighbor’s 6-digit code" htmlFor="handoff-code" hint={`Demo code: ${codeValue}`}><input className="control handoff-code-input" id="handoff-code" inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} /></Field><button className="secondary-button full-width" type="button" onClick={verify}>Verify code</button></> : <><ScanPattern id={booking.id} /><div className="handoff-code" aria-label={`Handoff code ${codeValue.split('').join(' ')}`}>{codeValue.split('').map((digit, index) => <span key={index}>{digit}</span>)}</div><p>Show this code to {booking.counterpart.name} at the handoff.</p><p className="form-disclaimer">Demo pattern only — not a real QR code. No identity check is performed.</p><button className="secondary-button full-width" type="button" onClick={() => { patch({ verified: true }); notify('Demo handoff verified together.'); }}>We checked the code together</button></>}{draft.verified && <p className="handoff-success" role="status"><CheckCircle2 size={20} aria-hidden="true" />Code checked. You’re good to go.</p>}</section>}
    {((isPickup && step === 2) || (!isPickup && step === 1)) && photoStep}
    {isPickup && step === 3 && <><section className="card handoff-summary"><PackageCheck size={33} aria-hidden="true" /><h3>Here’s what you’re agreeing to.</h3><dl className="kv"><div><dt>Rental</dt><dd>{listing.title}</dd></div><div><dt>Return by</dt><dd>{longDate(booking.end)}</dd></div><div><dt>Included items checked</dt><dd>{listing.includes.length} of {listing.includes.length}</dd></div><div><dt>Condition photos</dt><dd>{draft.photos.length} saved with your trip</dd></div><div><dt>Refundable deposit</dt><dd>{money(booking.quote.deposit)}</dd></div></dl>{draft.notes && <div className="handoff-saved-notes"><strong>Condition notes</strong><p>{draft.notes}</p></div>}<div className="handoff-preview-photos">{draft.photos.map((photo, index) => <img key={index} src={photo} alt={`Pickup condition ${index + 1}`} />)}</div></section><label className="card handoff-signature"><input type="checkbox" checked={draft.agreed} onChange={(event) => patch({ agreed: event.target.checked })} /><span><strong>I’m happy with the gear and condition record.</strong><span>I’ll take good care of it and return all included items. Confirming records my agreement as {user?.firstName}.</span><em>{user?.firstName} {user?.lastName}</em></span></label><p className="form-disclaimer">Demo only — no real charge, signature, or legal agreement is created.</p></>}
    {!isPickup && step === 2 && <section className="card handoff-owner-confirm"><span className="handoff-confirm-icon"><PackageCheck size={36} strokeWidth={1.5} aria-hidden="true" /></span><h3>One final nod from {booking.counterpart.name}.</h3><p>Review the photos and returned items together, then ask your neighbor to confirm.</p><Field label="Return confirmation code" htmlFor="return-code" hint={`Demo code: ${codeValue}`}><input className="control handoff-code-input" id="return-code" inputMode="numeric" maxLength={6} autoComplete="off" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} /></Field><button type="button" className="secondary-button full-width" onClick={verify}>Verify return code</button><span className="handoff-or">or try the demo confirmation</span><button type="button" className="secondary-button full-width" disabled={waiting || draft.verified} onClick={() => { setWaiting(true); timer.current = window.setTimeout(() => { patch({ verified: true }); setWaiting(false); notify(`${booking.counterpart.name} confirmed the return in this demo.`); }, 2000); }}>{waiting ? 'Waiting for your neighbor…' : draft.verified ? 'Owner confirmed' : 'Simulate owner confirmation'}</button><p className="form-disclaimer" role="status">{waiting ? 'Your neighbor is checking the return…' : draft.verified ? 'Return confirmed. You can now finish.' : 'Demo only. No real confirmation request is sent.'}</p>{hasIssue && <div className="notice-banner notice-banner--warning">Your condition report mentions an issue. The deposit stays on hold until it’s resolved. <Link href={`/claims/new?booking=${booking.id}`}>File a report</Link></div>}</section>}
    {!isPickup && complete && <><section className="card handoff-done"><span className="handoff-done-icon"><Check size={38} aria-hidden="true" /></span><h3>Returned with care.</h3><p>Your return photos and condition record are saved with your trip.</p><Pill tone="success">Rental complete</Pill><div className="handoff-deposit"><h4>{hasIssue || booking.depositStatus !== 'released' ? 'Deposit review timeline' : `${money(booking.quote.deposit)} deposit release`}</h4><ol className="timeline"><li><strong>Return confirmed</strong><span>Your shared condition record is saved.</span></li><li><strong>{hasIssue || booking.depositStatus !== 'released' ? 'Issue review' : 'Release initiated'}</strong><span>{hasIssue || booking.depositStatus !== 'released' ? 'Your hold stays in place while the report is reviewed.' : 'The demo hold is released. No real money moves.'}</span></li><li><strong>{hasIssue || booking.depositStatus !== 'released' ? 'Resolution & release' : 'Back to your bank'}</strong><span>{hasIssue || booking.depositStatus !== 'released' ? 'We’ll share updates in your trip. Contact support if you need a hand.' : 'A real bank may take 3–7 business days to reflect the release.'}</span></li></ol></div><Link className="secondary-button full-width" href={`/trips/${booking.id}`}>View your trip</Link></section><section className="card card--soft handoff-review"><h3>A kind word goes a long way.</h3><p>How was sharing with {booking.counterpart.name}? Your review helps the next neighbor.</p><Link href={`/trips/${booking.id}/review`} className="primary-button">Leave a review <ArrowRight size={17} aria-hidden="true" /></Link></section></>}
    {error && <p className="field-error" role="alert">{error}</p>}
    {!complete && <div className="sticky-cta handoff-cta"><div>{step > 0 ? <button className="icon-button" type="button" aria-label="Previous handoff step" disabled={waiting} onClick={() => { patch({ step: step - 1 }); setError(''); }}><ArrowLeft size={21} /></button> : <Clock3 size={21} aria-hidden="true" />}<span>{step === 0 ? 'Together is better.' : isPickup && step === 3 ? 'Your next adventure awaits.' : 'One little step at a time.'}</span></div><button className="primary-button" type="button" onClick={next} disabled={waiting}>{isPickup && step === 3 ? 'Start rental' : !isPickup && step === 2 ? 'Complete return' : 'Continue'}<ArrowRight size={18} aria-hidden="true" /></button></div>}
  </PageShell>;
}

function HandoffRoute({ params, mode }: { params: Record<string, string>; mode: Mode }) {
  const { user, data } = useDemo();
  if (!user) return <AuthRequired title={mode === 'pickup' ? 'A good handoff starts here' : 'Let’s wrap up your rental'} reason="Sign in to verify your handoff and keep your condition photos with your trip.">{null}</AuthRequired>;
  const booking = data.bookings.find((b) => b.id === params.id);
  const listing = booking && listingById(booking.listingId);
  const valid = booking && listing && (mode === 'pickup' ? booking.status === 'confirmed' : ['active', 'returned'].includes(booking.status) || (booking.status === 'completed' && !!booking.return));
  if (!valid || !booking) return <PageShell title={mode === 'pickup' ? 'Pickup' : 'Return'} back="/trips" width="narrow" className="handoff-page"><EmptyState icon={<PackageCheck size={28} />} title={!booking || !listing ? 'We couldn’t find this trip' : mode === 'pickup' && booking.pickup ? 'You’re already on your way' : 'This handoff isn’t available yet'} body={!booking || !listing ? 'Check your trips for the latest booking details.' : `This trip is ${booking.status}. ${mode === 'pickup' ? 'Pickup is available for confirmed rentals.' : 'Return is available once the rental has started.'}`} action={<Link className="primary-button" href={booking ? `/trips/${booking.id}` : '/trips'}>{booking ? 'View trip' : 'Back to trips'}</Link>} /></PageShell>;
  return <HandoffWizard key={`${booking.id}-${mode}`} booking={booking} mode={mode} />;
}

/** Guided, photo-documented pickup with a demo handoff-code check. */
export function PickupPage({ params }: { params: Record<string, string> }) { return <HandoffRoute params={params} mode="pickup" />; }

/** Guided return, owner confirmation, and a clear deposit-release timeline. */
export function ReturnPage({ params }: { params: Record<string, string> }) { return <HandoffRoute params={params} mode="return" />; }
