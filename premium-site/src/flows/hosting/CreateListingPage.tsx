import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Bike, Camera, Check, Gavel, ImagePlus, PartyPopper, Pencil, Plus, ShieldCheck, Sparkles, Star, Waves, Wrench, X, Zap } from 'lucide-react';
import { navigate } from '../../router';
import { AUCTION_DURATIONS, auctionTime, durationLabel, reserveFor, suggestedStartBid } from '../../auctions';
import CalendarRange from '../../CalendarRange';
import type { Auction } from '../../auctions';
import type { Listing } from '../../data';
import { dateRange, money } from '../model';
import { useDemo } from '../store';
import { AuthRequired, Field, Link, PageShell } from '../ui';
import { buildListing, CATEGORY_META, clearDraft, compressPhoto, defaultAuctionChoice, emptyDraft, loadDraft, MAX_PHOTOS, metaFor, saveDraft, validateAuctionChoice, validateStep } from './listing-draft';
import type { AuctionChoice, ListingCategory, ListingDraft } from './listing-draft';
import Confetti from './Confetti';
import './create-listing.css';

const STEPS = ['Category', 'Photos', 'Details', 'Pricing', 'Review'] as const;
const SUBTITLES = [
  'What would you like to share with your neighbors?',
  'Bright, honest photos help your gear get booked sooner.',
  'Tell renters what it is and what comes with it.',
  'Choose a fair daily price and how you like to rent.',
  'One last look before your listing goes live.',
];
const CATEGORY_ICONS: Record<ListingCategory, ReactNode> = {
  Outdoors: <Bike size={22} />, Cameras: <Camera size={22} />, Tools: <Wrench size={22} />, 'On the water': <Waves size={22} />, Celebrations: <PartyPopper size={22} />,
};
const WEEKLY = [0, 10, 15, 20];
const MONTHLY = [0, 20, 25, 30];

/** Five-step flow for members to publish gear. Drafts survive refreshes within the session. */
export function CreateListingPage({ params }: { params: Record<string, string> }) {
  void params;
  return <AuthRequired title="List your gear" reason="Sign in to share your gear with neighbors and start earning."><CreateListingFlow /></AuthRequired>;
}

function CreateListingFlow() {
  const { user, publishListing, updateProfile, notify } = useDemo();
  const [draft, setDraft] = useState<ListingDraft>(loadDraft);
  const [step, setStep] = useState(() => (loadDraft().category ? 1 : 0));
  const [error, setError] = useState('');
  const [published, setPublished] = useState<Listing | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!published) saveDraft(draft); }, [draft, published]);

  const update = (patch: Partial<ListingDraft>) => { setDraft((current) => ({ ...current, ...patch })); setError(''); };
  const goTo = (next: number) => {
    setStep(next); setError('');
    topRef.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const next = () => {
    const issue = validateStep(step, draft);
    if (issue) { setError(issue); return; }
    goTo(step + 1);
  };
  const publish = () => {
    if (!user) return;
    for (let index = 0; index < STEPS.length - 1; index += 1) {
      const issue = validateStep(index, draft);
      if (issue) { goTo(index); setError(issue); return; }
    }
    const { listing, host } = buildListing(draft, user);
    publishListing(listing, host, draft.declaredValue);
    if (user.role !== 'owner') updateProfile({ role: 'owner' });
    clearDraft();
    setPublished(listing);
    notify('Your listing is live. Neighbors nearby can now find it.');
  };

  if (published) return <PublishedState draft={draft} listing={published} onAnother={() => { setDraft(emptyDraft()); setPublished(null); setStep(0); }} />;

  const isLast = step === STEPS.length - 1;
  return <PageShell
    title="List your gear"
    eyebrow={`Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`}
    subtitle={SUBTITLES[step]}
    back="/hosting"
    className="create-listing"
    aside={<div className="cl-aside"><span className="cl-aside-label">Live preview</span><PreviewCard draft={draft} owner={user?.firstName ?? 'You'} /><p className="cl-aside-note"><ShieldCheck size={15} /> Every rental includes YBuy Protection and verified renters.</p></div>}
  >
    <div ref={topRef} className="cl-progress" aria-hidden="true">{STEPS.map((label, index) => <span key={label} className={index < step ? 'is-done' : index === step ? 'is-current' : ''} />)}</div>
    <div key={step} className="cl-step">
      {step === 0 && <CategoryStep draft={draft} onPick={(category) => update({ category, declaredValue: draft.declaredValue || metaFor(category).typicalValue, price: draft.price || Math.round((metaFor(category).band[0] + metaFor(category).band[1]) / 2) })} />}
      {step === 1 && <PhotosStep draft={draft} onChange={update} />}
      {step === 2 && <DetailsStep draft={draft} onChange={update} />}
      {step === 3 && <PricingStep draft={draft} onChange={update} />}
      {step === 4 && <ReviewStep draft={draft} owner={user?.firstName ?? 'You'} onEdit={goTo} />}
    </div>
    {error && <p className="cl-error" role="alert">{error}</p>}
    <div className="sticky-cta cl-actions">
      {step > 0 ? <button type="button" className="secondary-button" onClick={() => goTo(step - 1)}><ArrowLeft size={16} />Back</button> : <Link href="/hosting" className="secondary-button">Cancel</Link>}
      {isLast
        ? <button type="button" className="primary-button" onClick={publish}><Sparkles size={16} />Publish listing</button>
        : <button type="button" className="primary-button" onClick={next}>{step === 1 && !draft.photos.length ? 'Skip for now' : 'Continue'}<ArrowRight size={16} /></button>}
    </div>
  </PageShell>;
}

function CategoryStep({ draft, onPick }: { draft: ListingDraft; onPick: (category: ListingCategory) => void }) {
  return <div className="cl-categories" role="radiogroup" aria-label="Category">
    {CATEGORY_META.map((meta) => <button key={meta.value} type="button" role="radio" aria-checked={draft.category === meta.value} className={`cl-category ${draft.category === meta.value ? 'is-selected' : ''}`} onClick={() => onPick(meta.value)}>
      <span className="cl-category-media"><img src={meta.sample} alt="" loading="lazy" /></span>
      <span className="cl-category-icon">{CATEGORY_ICONS[meta.value]}</span>
      <span className="cl-category-copy"><strong>{meta.value}</strong><small>{meta.hint}</small></span>
      <span className="cl-category-check" aria-hidden="true"><Check size={14} /></span>
    </button>)}
  </div>;
}

function PhotosStep({ draft, onChange }: { draft: ListingDraft; onChange: (patch: Partial<ListingDraft>) => void }) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [dragging, setDragging] = useState(false);
  const remaining = MAX_PHOTOS - draft.photos.length;

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setProblem(''); setBusy(true);
    const picked = Array.from(files).slice(0, remaining);
    const results = await Promise.allSettled(picked.map((file) => compressPhoto(file)));
    const ok = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
    const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
    if (failed) setProblem(failed.reason instanceof Error ? failed.reason.message : 'Some photos could not be added.');
    else if (files.length > remaining) setProblem(`You can add up to ${MAX_PHOTOS} photos.`);
    onChange({ photos: [...draft.photos, ...ok] });
    setBusy(false);
  }
  const onInput = (event: ChangeEvent<HTMLInputElement>) => { void addFiles(event.target.files); event.target.value = ''; };
  const onDrop = (event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); setDragging(false); void addFiles(event.dataTransfer.files); };
  const makeCover = (index: number) => onChange({ photos: [draft.photos[index], ...draft.photos.filter((_, i) => i !== index)] });
  const remove = (index: number) => onChange({ photos: draft.photos.filter((_, i) => i !== index) });

  return <div className="cl-photos">
    {remaining > 0 && <label htmlFor={inputId} className={`cl-dropzone ${dragging ? 'is-dragging' : ''} ${draft.photos.length ? 'is-compact' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} aria-busy={busy}>
      <input id={inputId} type="file" accept="image/*" multiple onChange={onInput} className="sr-only" />
      <span className="cl-dropzone-icon">{busy ? <span className="cl-spinner" /> : <ImagePlus size={26} />}</span>
      <strong>{busy ? 'Adding photos…' : draft.photos.length ? 'Add more photos' : 'Add photos'}</strong>
      <small>Take a photo or choose from your library · up to {remaining} more</small>
    </label>}
    {problem && <p className="cl-error" role="alert">{problem}</p>}
    {draft.photos.length > 0 && <ul className="cl-photo-grid" aria-label="Your photos">
      {draft.photos.map((photo, index) => <li key={photo.slice(-24) + index} className={index === 0 ? 'is-cover' : ''}>
        <img src={photo} alt={`Photo ${index + 1}`} />
        {index === 0 ? <span className="cl-cover-badge">Cover</span> : <button type="button" className="cl-photo-action" onClick={() => makeCover(index)}>Make cover</button>}
        <button type="button" className="cl-photo-remove" onClick={() => remove(index)} aria-label={`Remove photo ${index + 1}`}><X size={14} /></button>
      </li>)}
    </ul>}
    {!draft.photos.length && <div className="cl-sample-note"><img src={metaFor(draft.category ?? 'Outdoors').sample} alt="" /><p>No photos yet? You can continue with a sample cover and add your own later.</p></div>}
    <ul className="cl-tips"><li><Check size={14} />Shoot in daylight against a plain background</li><li><Check size={14} />Show everything that’s included</li><li><Check size={14} />Add a close-up of any wear, so there are no surprises</li></ul>
  </div>;
}

function DetailsStep({ draft, onChange }: { draft: ListingDraft; onChange: (patch: Partial<ListingDraft>) => void }) {
  const [custom, setCustom] = useState('');
  const meta = metaFor(draft.category ?? 'Outdoors');
  const options = Array.from(new Set([...meta.suggestions, ...draft.includes]));
  const toggle = (item: string) => onChange({ includes: draft.includes.includes(item) ? draft.includes.filter((value) => value !== item) : [...draft.includes, item] });
  const addCustom = () => { const value = custom.trim(); if (value && !draft.includes.includes(value) && draft.includes.length < 12) onChange({ includes: [...draft.includes, value] }); setCustom(''); };

  return <div className="control-group cl-details">
    <Field label="Title" htmlFor="cl-title" hint={`${draft.title.length}/60 · e.g. “Two-person tent with sleeping pads”`}>
      <input id="cl-title" className="control" value={draft.title} maxLength={60} autoComplete="off" onChange={(event) => onChange({ title: event.target.value })} />
    </Field>
    <Field label="Description" htmlFor="cl-description" hint={`${draft.description.length}/500 · What is it great for? Anything renters should know?`}>
      <textarea id="cl-description" className="control cl-textarea" value={draft.description} maxLength={500} rows={5} onChange={(event) => onChange({ description: event.target.value })} />
    </Field>
    <div className="field">
      <span className="field-label">What’s included</span>
      <div className="chip-row">{options.map((item) => <button key={item} type="button" className="chip" aria-pressed={draft.includes.includes(item)} onClick={() => toggle(item)}>{draft.includes.includes(item) ? <Check size={14} /> : <Plus size={14} />}{item}</button>)}</div>
      <div className="cl-inline-add"><input className="control" placeholder="Add something else" value={custom} maxLength={40} onChange={(event) => setCustom(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustom(); } }} aria-label="Add an included item" /><button type="button" className="secondary-button" onClick={addCustom} disabled={!custom.trim()}>Add</button></div>
    </div>
    <div className="field">
      <span className="field-label">Condition</span>
      <div className="cl-segment" role="radiogroup" aria-label="Condition">{(['Like new', 'Great', 'Good'] as const).map((value) => <button key={value} type="button" role="radio" aria-checked={draft.condition === value} className={draft.condition === value ? 'is-active' : ''} onClick={() => onChange({ condition: value })}>{value}</button>)}</div>
    </div>
    <Field label="Replacement value" htmlFor="cl-value" hint="Used for the refundable deposit and YBuy Protection. Renters don’t see this amount.">
      <span className="cl-money"><span>$</span><input id="cl-value" className="control" type="number" inputMode="numeric" min={20} max={20000} value={draft.declaredValue || ''} onChange={(event) => onChange({ declaredValue: Number(event.target.value) })} /></span>
    </Field>
  </div>;
}

function PricingStep({ draft, onChange }: { draft: ListingDraft; onChange: (patch: Partial<ListingDraft>) => void }) {
  const [low, high] = metaFor(draft.category ?? 'Outdoors').band;
  const suggested = Math.round((low + high) / 2);
  const monthly = draft.price > 0 ? Math.round(draft.price * 4 * 0.92) : 0;
  const adjust = (delta: number) => onChange({ price: Math.min(1000, Math.max(1, (draft.price || suggested) + delta)) });

  return <div className="cl-pricing">
    <section className="card cl-price-card">
      <span className="field-label">Daily price</span>
      <div className="cl-price-dial">
        <button type="button" onClick={() => adjust(-1)} aria-label="Lower price by one dollar">−</button>
        <label className="cl-price-value"><span>$</span><input type="number" inputMode="numeric" min={1} max={1000} style={{ width: `${Math.max(String(draft.price || '').length, 2) + 0.4}ch` }} value={draft.price || ''} onChange={(event) => onChange({ price: Math.round(Number(event.target.value)) })} aria-label="Daily price in dollars" /></label>
        <button type="button" onClick={() => adjust(1)} aria-label="Raise price by one dollar">+</button>
      </div>
      <p className="cl-price-hint">Similar gear nearby rents for <strong>${low}–${high}</strong> a day. {draft.price !== suggested && <button type="button" className="text-button" onClick={() => onChange({ price: suggested })}>Use ${suggested}</button>}</p>
      {monthly > 0 && <p className="cl-earnings"><Sparkles size={15} />Rent it 4 days a month and earn about <strong>{money(monthly, false)}</strong> after fees.</p>}
    </section>
    <div className="field"><span className="field-label">Weekly discount <small className="field-optional">7+ days</small></span><div className="cl-segment" role="radiogroup" aria-label="Weekly discount">{WEEKLY.map((value) => <button key={value} type="button" role="radio" aria-checked={draft.weeklyDiscount === value} className={draft.weeklyDiscount === value ? 'is-active' : ''} onClick={() => onChange({ weeklyDiscount: value })}>{value ? `${value}%` : 'None'}</button>)}</div></div>
    <div className="field"><span className="field-label">Monthly discount <small className="field-optional">28+ days</small></span><div className="cl-segment" role="radiogroup" aria-label="Monthly discount">{MONTHLY.map((value) => <button key={value} type="button" role="radio" aria-checked={draft.monthlyDiscount === value} className={draft.monthlyDiscount === value ? 'is-active' : ''} onClick={() => onChange({ monthlyDiscount: value })}>{value ? `${value}%` : 'None'}</button>)}</div></div>
    <div className="field"><span className="field-label">Minimum rental</span><div className="cl-segment" role="radiogroup" aria-label="Minimum rental">{[1, 2, 3].map((value) => <button key={value} type="button" role="radio" aria-checked={draft.minDays === value} className={draft.minDays === value ? 'is-active' : ''} onClick={() => onChange({ minDays: value })}>{value} day{value > 1 ? 's' : ''}</button>)}</div></div>
    <div className="card cl-toggle-row">
      <span className="cl-toggle-icon"><Zap size={18} /></span>
      <span><strong>Instant book</strong><small>Verified renters can book without waiting for approval.</small></span>
      <button type="button" role="switch" aria-checked={draft.instantBook} aria-label="Instant book" className="switch" onClick={() => onChange({ instantBook: !draft.instantBook })} />
    </div>
  </div>;
}

/** Shown only after publishing: asks whether to open the live listing to bidding, then collects the setup. */
function AuctionPrompt({ listing, onStart }: { listing: Listing; onStart: (choice: AuctionChoice) => void }) {
  const price = listing.price;
  const [stage, setStage] = useState<'ask' | 'setup' | 'dismissed'>('ask');
  const [choice, setChoice] = useState<AuctionChoice>(() => defaultAuctionChoice(suggestedStartBid(price)));
  const [issue, setIssue] = useState<string | null>(null);
  const change = (patch: Partial<AuctionChoice>) => { setChoice((current) => ({ ...current, ...patch })); setIssue(null); };
  const start = () => {
    const problem = validateAuctionChoice(choice, price);
    if (problem) { setIssue(problem); return; }
    onStart(choice);
  };
  if (stage === 'dismissed') return <button type="button" className="text-button cl-auction-later" onClick={() => setStage('setup')}><Gavel size={15} />Open a live auction instead</button>;
  return <section className={`card cl-auction${stage === 'setup' ? ' is-on' : ''}`} aria-labelledby="cl-auction-title">
    <div className="cl-toggle-row cl-auction-head">
      <span className="cl-toggle-icon"><Gavel size={18} /></span>
      <span><strong id="cl-auction-title">Open it to live bidding?</strong><small>Your listing is live. Let neighbors bid on its first rental for a faster booking.</small></span>
    </div>
    {stage === 'ask' ? <div className="cl-auction-ask">
      <button type="button" className="primary-button" onClick={() => setStage('setup')}>Set up auction</button>
      <button type="button" className="secondary-button" onClick={() => setStage('dismissed')}>Not now</button>
    </div> : <div className="cl-auction-body">
      <label className="field">
        <span className="field-label">Starting bid <small className="field-optional">per day</small></span>
        <span className="cl-money-input"><span>$</span><input type="number" inputMode="numeric" min={1} max={Math.max(1, price - 1)} value={choice.startBid || ''} onChange={(event) => change({ startBid: Math.round(Number(event.target.value)) })} /></span>
        <small className="field-hint">We suggest ${suggestedStartBid(price)}. Bids below your <strong>${reserveFor(price)}</strong> reserve won’t be accepted as a booking.</small>
      </label>
      <div className="field"><span className="field-label">Bidding stays open for</span><div className="cl-segment" role="radiogroup" aria-label="Auction length">{AUCTION_DURATIONS.map(({ hours, label }) => <button key={hours} type="button" role="radio" aria-checked={choice.hours === hours} className={choice.hours === hours ? 'is-active' : ''} onClick={() => change({ hours })}>{label}</button>)}</div></div>
      <div className="field"><span className="field-label">Rental dates up for bid <small className="field-optional">{dateRange(choice.rentalStart, choice.rentalEnd)}</small></span><CalendarRange start={choice.rentalStart} end={choice.rentalEnd} onChange={(rentalStart, rentalEnd) => change({ rentalStart, rentalEnd })} /></div>
      {issue && <p className="cl-error" role="alert">{issue}</p>}
      <div className="cl-auction-ask">
        <button type="button" className="primary-button" onClick={start}><Gavel size={16} />Start live auction</button>
        <button type="button" className="secondary-button" onClick={() => setStage('dismissed')}>Not now</button>
      </div>
    </div>}
  </section>;
}

function ReviewStep({ draft, owner, onEdit }: { draft: ListingDraft; owner: string; onEdit: (step: number) => void }) {
  const rows: [string, string, number][] = [
    ['Category', draft.category ?? '—', 0],
    ['Photos', draft.photos.length ? `${draft.photos.length} photo${draft.photos.length > 1 ? 's' : ''}` : 'Sample cover for now', 1],
    ['Included', draft.includes.length ? draft.includes.join(', ') : 'Everything shown in the photos', 2],
    ['Condition', draft.condition, 2],
    ['Price', `$${draft.price} / day · ${draft.weeklyDiscount}% weekly · ${draft.monthlyDiscount}% monthly`, 3],
    ['Booking', `${draft.instantBook ? 'Instant book' : 'Request to book'} · ${draft.minDays} day minimum`, 3],
  ];
  return <div className="cl-review">
    <PreviewCard draft={draft} owner={owner} />
    <dl className="card cl-summary">{rows.map(([label, value, target]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><button type="button" onClick={() => onEdit(target)} aria-label={`Edit ${label.toLowerCase()}`}><Pencil size={14} /></button></div>)}</dl>
    <p className="cl-legal"><ShieldCheck size={15} />By publishing you agree to the <Link href="/guidelines" className="text-button">community guidelines</Link>. You can pause or edit your listing anytime.</p>
  </div>;
}

function PreviewCard({ draft, owner }: { draft: ListingDraft; owner: string }) {
  const cover = draft.photos[0] ?? (draft.category ? metaFor(draft.category).sample : '');
  return <article className="cl-preview">
    <div className="cl-preview-media">{cover ? <img src={cover} alt="" /> : <span className="cl-preview-empty"><ImagePlus size={26} /></span>}<span className="cl-preview-tag">New listing</span></div>
    <div className="cl-preview-body">
      <div className="cl-preview-row"><strong>{draft.title.trim() || 'Your listing title'}</strong><span><Star size={11} fill="currentColor" />New</span></div>
      <p>{draft.category ?? 'Category'} · Shared by {owner}</p>
      <p className="cl-preview-price"><b>{draft.price ? `$${draft.price}` : '$—'}</b> / day</p>
    </div>
  </article>;
}

function PublishedState({ draft, listing, onAnother }: { draft: ListingDraft; listing: Listing; onAnother: () => void }) {
  const { user, auctions, startAuction, notify } = useDemo();
  const markRef = useRef<HTMLButtonElement>(null);
  const [burst, setBurst] = useState(0);
  const [auctionId, setAuctionId] = useState<string | null>(null);
  const auction = auctionId ? auctions.find((entry) => entry.id === auctionId) : undefined;
  const celebrate = () => {
    setBurst((count) => count + 1);
    navigator.vibrate?.([12, 40, 18]);
  };
  const openAuction = (choice: AuctionChoice) => {
    const id = startAuction({ listing, ...choice });
    if (!id) return;
    setAuctionId(id);
    notify(`Bidding is open for the next ${durationLabel(choice.hours)}.`);
  };
  // Start the celebration at the top so the burst origin is on screen; haptic once on arrival.
  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => { navigator.vibrate?.([12, 40, 18]); }, []);
  return <PageShell title="You’re live" back="/hosting" width="narrow" className="create-listing">
    <Confetti originRef={markRef} burst={burst} />
    <div className="cl-published">
      <button ref={markRef} type="button" key={burst} className="cl-published-mark" onClick={celebrate} aria-label="Celebrate again"><Check size={30} strokeWidth={2.4} /></button>
      <h2>Your gear is ready for its next adventure.</h2>
      <p>{auction ? 'Bidding is open now. Neighbors nearby can bid on your first rental — we’ll ping you as bids come in.' : 'Neighbors nearby can now find, request and book it. We’ll let you know as soon as someone asks.'}</p>
      {auction ? <LiveAuctionCard auction={auction} /> : <AuctionPrompt listing={listing} onStart={openAuction} />}
      <PreviewCard draft={draft} owner={user?.firstName ?? 'You'} />
      <div className="cl-published-actions">
        {auction && <button type="button" className="primary-button" onClick={() => navigate(`/auctions/${auction.id}`)}><Gavel size={16} />Watch live bidding</button>}
        <button type="button" className={auction ? 'secondary-button' : 'primary-button'} onClick={() => navigate(`/gear/${listing.id}`)}>View your listing<ArrowRight size={16} /></button>
        <button type="button" className="secondary-button" onClick={() => navigate('/hosting')}>Go to hosting</button>
        <button type="button" className="text-button" onClick={onAnother}>List another item</button>
      </div>
    </div>
  </PageShell>;
}

/** Ticking summary of an owner's live auction: current bid, activity and time left. */
function LiveAuctionCard({ auction }: { auction: Auction }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const reserve = auction.reservePrice ?? reserveFor(auction.listing.price);
  const ended = auction.endsAt <= now;
  return <Link href={`/auctions/${auction.id}`} className="card cl-live-auction" aria-label={`Live auction, current bid $${auction.currentBid} per day`}>
    <span className="cl-live-status">{ended ? 'Bidding closed' : <><span className="live-dot" aria-hidden="true" />Live now</>}<em>{ended ? 'Ended' : `${auctionTime(auction.endsAt - now)} left`}</em></span>
    <span className="cl-live-bid" aria-live="polite"><b key={auction.currentBid}>${auction.currentBid}</b><small>/ day {auction.bids ? 'current bid' : 'starting bid'}</small></span>
    <span className="cl-live-meta"><span>{auction.bids} bid{auction.bids === 1 ? '' : 's'}</span><span>{auction.watchers} watching</span><span className={auction.currentBid >= reserve && auction.bids ? 'is-met' : ''}>{auction.currentBid >= reserve && auction.bids ? 'Reserve met' : `Reserve $${reserve}`}</span></span>
  </Link>;
}
