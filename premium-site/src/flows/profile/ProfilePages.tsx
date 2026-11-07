import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, BadgeCheck, Bell, Bike, Camera, Check, ChevronRight, CircleHelp, FileCheck2, Heart, IdCard, Languages, LockKeyhole, MapPin, MessageCircle, PackageCheck, Pencil, ShieldCheck, SlidersHorizontal, UserRound, Wallet } from 'lucide-react';
import { navigate } from '../../router';
import { listings } from '../../data';
import { DECLARED_VALUE, DEMO_OTP, listingById, longDate, money, profileCompletion } from '../model';
import type { Profile } from '../model';
import { useDemo } from '../store';
import { ROLE_LABELS } from '../accounts';
import { Avatar, EmptyState, Link, PageShell, Pill, ProgressRing, Stars } from '../ui';
import './profile.css';

const fullName = (profile: Pick<Profile, 'firstName' | 'lastName'>) => `${profile.firstName} ${profile.lastName}`.trim();

/** Creates a compact photo data URL without storing the original upload. */
async function profilePhoto(file: File): Promise<string> {
  const source = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = source;
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Could not open photo')); });
    const scale = Math.min(320 / image.width, 320 / image.height, 1);
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext('2d'); if (!context) throw new Error('Photo resizing is unavailable');
    context.drawImage(image, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/jpeg', 0.82);
  } finally { URL.revokeObjectURL(source); }
}

/** Shows the signed-in member's account hub and working shortcuts. */
export function AccountHubPage({ params }: { params: Record<string, string> }) {
  void params;
  const { user, resetDemo, signOut, requireAuth } = useDemo();
  if (!user) return <PageShell width="narrow" title="Your account" back="/"><div className="profile-auth"><UserRound size={30} /><h2>Your YBuy account</h2><p>Sign in to manage your profile, trips and gear.</p><button className="primary-button" onClick={() => requireAuth()}>Sign in or create an account</button></div></PageShell>;
  const completion = profileCompletion(user); const next = completion.items.find((item) => !item.done); const name = fullName(user);
  const rows = [
    [PackageCheck, 'Trips & rentals', 'Upcoming and past reservations', '/trips'], [Heart, 'Requests', 'Gear you are looking for', '/wanted'],
    [MessageCircle, 'Inbox', 'Messages with your neighbors', '/inbox'], [Bell, 'Notifications', 'Updates about your activity', '/notifications'],
    [Bike, 'Hosting dashboard', 'Manage your listings and requests', '/hosting'], [Wallet, 'Wallet & payments', 'Payment methods, deposits and payouts', '/wallet'],
    [ShieldCheck, 'YBuy Protection', 'How every rental is looked after', '/protection'], [FileCheck2, 'Claims', 'Follow up on a rental issue', '/claims'],
    [CircleHelp, 'Help center', 'Answers and support requests', '/help'], [SlidersHorizontal, 'Account settings', 'Login, privacy and preferences', '/profile/settings'],
    [Bell, 'Notification settings', 'Choose what you hear about', '/notifications/settings'], [ShieldCheck, 'Community guidelines', 'How we take care of one another', '/guidelines'],
    [FileCheck2, 'Terms of service', 'The basics of using YBuy', '/terms'], [LockKeyhole, 'Privacy', 'How your information is used', '/privacy'],
  ] as const;
  return <PageShell width="narrow" title="Account" subtitle="Your profile, preferences and activity in one place." back="/"><div className="profile-hub">
    <section className="profile-hub-identity card"><Avatar name={name} photo={user.photo} size={72} /><div className="profile-hub-person"><h2>{name}</h2><Pill tone="accent">{ROLE_LABELS[user.role ?? 'user'].title} account</Pill><p>Member since {user.memberSince} <span>·</span> <Stars value={user.rating} /> <span>{user.rating.toFixed(2)}</span></p><Link href={`/people/${encodeURIComponent(name)}`} className="profile-inline-link">View public profile <ArrowRight size={15} /></Link></div><Link href="/profile/edit" className="profile-edit-link"><Pencil size={16} /><span>Edit</span></Link></section>
    <section className="profile-progress-card card"><ProgressRing percent={completion.percent} size={70} stroke={6} /><div><h3>Your profile is {completion.percent}% complete</h3><p>{next ? `Add ${next.label.toLowerCase()} to help neighbors feel confident.` : 'Your profile is ready for the neighborhood.'}</p>{next && <Link href={next.label.includes('verified') || next.label === 'Government ID' ? '/profile/verify' : '/profile/edit'} className="profile-inline-link">{next.label === 'Government ID' ? 'Verify your ID' : `Complete ${next.label.toLowerCase()}`} <ArrowRight size={15} /></Link>}</div></section>
    <section className="profile-verify-strip" aria-label="Verification status">{([['Email', user.emailVerified], ['Phone', user.phoneVerified], ['ID', user.idVerified], ['Payment', user.paymentAdded]] as const).map(([label, done]) => <Link key={label} href="/profile/verify" className={done ? 'is-verified' : ''}><span className="profile-verify-mark">{done ? <Check size={14} /> : <span />}</span>{label}{done && <span className="sr-only"> verified</span>}</Link>)}</section>
    <section className="profile-menu-list card" aria-label="Account links">{rows.map(([Icon, title, hint, href]) => <Link key={href} href={href} className="profile-menu-row"><span className="profile-menu-icon"><Icon size={19} strokeWidth={1.7} /></span><span className="profile-menu-copy"><strong>{title}</strong><small>{hint}</small></span><ChevronRight size={18} className="profile-chevron" /></Link>)}
      <button type="button" className="profile-menu-row" onClick={() => { if (window.confirm('Reset bookings, messages, claims and tickets to the original demo data?')) resetDemo(); }}><span className="profile-menu-icon"><ArrowDownRight size={19} /></span><span className="profile-menu-copy"><strong>Reset demo data</strong><small>Restore the original preview activity</small></span><ChevronRight size={18} className="profile-chevron" /></button>
      <button type="button" className="profile-menu-row profile-signout" onClick={signOut}><span className="profile-menu-icon"><ArrowRight size={19} /></span><span className="profile-menu-copy"><strong>Sign out</strong><small>Leave this demo account</small></span><ChevronRight size={18} className="profile-chevron" /></button>
    </section>
    <section className="profile-host-promo"><div><span className="profile-promo-icon"><Bike size={21} /></span><h2>Have something worth sharing?</h2><p>Let your neighbors borrow the gear you already own.</p><Link href="/hosting" className="secondary-button">Explore hosting <ArrowRight size={16} /></Link></div><div className="profile-promo-art" aria-hidden="true"><span>GOOD GEAR</span><Bike size={80} strokeWidth={1} /></div></section>
  </div></PageShell>;
}

/** Lets a member update their public-facing details and photo. */
export function EditProfilePage({ params }: { params: Record<string, string> }) {
  void params;
  const { user, updateProfile, notify } = useDemo();
  const [savedLanguages] = useState(() => { try { return window.sessionStorage.getItem('ybuy-profile-languages') ?? 'English'; } catch { return 'English'; } });
  const [values, setValues] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', bio: user?.bio ?? '', location: user?.location ?? '', radius: user ? user.radius : 5, interests: user?.interests ?? [], languages: savedLanguages });
  const [photo, setPhoto] = useState(user?.photo ?? ''); const [error, setError] = useState('');
  const changed = !!user && (values.firstName !== user.firstName || values.lastName !== user.lastName || values.bio !== user.bio || values.location !== user.location || values.radius !== user.radius || JSON.stringify(values.interests) !== JSON.stringify(user.interests) || photo !== user.photo || values.languages !== savedLanguages);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (changed) { event.preventDefault(); event.returnValue = ''; } };
    const guardNavigation = (event: MouseEvent) => {
      if (!changed || !(event.target instanceof Element)) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!event.target.closest('a[href], .flow-back, .flow-topbar-back')) return;
      if (!window.confirm('You have unsaved changes. Leave without saving?')) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    window.addEventListener('beforeunload', guard);
    window.addEventListener('click', guardNavigation, true);
    return () => { window.removeEventListener('beforeunload', guard); window.removeEventListener('click', guardNavigation, true); };
  }, [changed]);
  if (!user) return <PageShell width="narrow" title="Edit profile" back="/profile"><div className="profile-auth"><UserRound size={30} /><h2>Sign in to edit your profile</h2><p>Your profile helps neighbors know who they are renting from.</p><Link href="/signin" className="primary-button">Sign in</Link></div></PageShell>;
  const set = (key: 'firstName' | 'lastName' | 'bio' | 'location' | 'radius', value: string | number) => setValues((current) => ({ ...current, [key]: value }));
  const toggleInterest = (interest: string) => setValues((current) => ({ ...current, interests: current.interests.includes(interest) ? current.interests.filter((item) => item !== interest) : [...current.interests, interest] }));
  const upload = async (file?: File) => { if (!file) return; if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return; } try { setPhoto(await profilePhoto(file)); setError(''); } catch { setError('This photo could not be resized. Choose another image.'); } };
  const save = () => { if (!values.firstName.trim() || !values.lastName.trim()) { setError('Add your first and last name to continue.'); return; } updateProfile({ firstName: values.firstName.trim(), lastName: values.lastName.trim(), bio: values.bio.trim(), location: values.location.trim(), radius: values.radius === 0 ? null : values.radius, interests: values.interests, photo }); try { window.sessionStorage.setItem('ybuy-profile-languages', values.languages); } catch { /* session storage may be unavailable */ } notify('Profile saved.'); navigate('/profile'); };
  return <PageShell width="narrow" title="Edit profile" subtitle="A little about you helps the right neighbors find you." back="/profile" className="profile-edit-page"><div className="profile-form-stack">
    <section className="card profile-photo-card"><Avatar name={`${values.firstName} ${values.lastName}`} photo={photo} size={84} /><div><h2>Your photo</h2><p>Use a clear photo so neighbors recognize you at pickup.</p><div className="button-row"><label className="secondary-button profile-upload-button"><Camera size={16} />Choose photo<input type="file" accept="image/*" capture="user" onChange={(event) => void upload(event.target.files?.[0])} /></label>{photo && <button className="text-button" type="button" onClick={() => setPhoto('')}>Remove</button>}</div></div></section>
    <section className="card profile-form-card"><h2>About you</h2><div className="profile-form-grid">
      <label className="field"><span className="field-label">First name</span><input className="control" autoComplete="given-name" value={values.firstName} onChange={(event) => set('firstName', event.target.value)} /></label>
      <label className="field"><span className="field-label">Last name</span><input className="control" autoComplete="family-name" value={values.lastName} onChange={(event) => set('lastName', event.target.value)} /></label>
      <label className="field profile-full"><span className="field-label">Legal name</span><input className="control" value={user.legalName} disabled /><span className="field-message">Changing your legal name requires re-verification. <Link href="/profile/verify">Learn more</Link></span></label>
      <label className="field profile-full"><span className="field-label">A short introduction <span>{values.bio.length}/280</span></span><textarea className="control profile-textarea" maxLength={280} value={values.bio} onChange={(event) => set('bio', event.target.value)} placeholder="What do you enjoy doing around the neighborhood?" /></label>
      <label className="field profile-full"><span className="field-label">Preferred location</span><input className="control" autoComplete="address-level2" value={values.location} onChange={(event) => set('location', event.target.value)} placeholder="City or neighborhood" /></label>
    </div>
    <div className="profile-field-block"><h3>Search radius</h3><div className="profile-chip-row" role="group" aria-label="Search radius">{[5, 10, 25, 50, 0].map((radius) => <button key={radius} type="button" className={`chip ${values.radius === radius || (radius === 0 && values.radius === null) ? 'is-active' : ''}`} onClick={() => set('radius', radius)}>{radius === 0 ? 'Any distance' : `${radius} mi`}</button>)}</div></div>
    <div className="profile-field-block"><h3>Interests</h3><p className="profile-muted">Pick a few things you like to do.</p><div className="profile-chip-row">{['Outdoors', 'Cameras', 'Cycling', 'Cooking', 'DIY', 'Celebrations', 'On the water', 'Music'].map((interest) => <button key={interest} type="button" className={`chip ${values.interests.includes(interest) ? 'is-active' : ''}`} aria-pressed={values.interests.includes(interest)} onClick={() => toggleInterest(interest)}>{interest}</button>)}</div></div>
    <label className="field profile-language"><span className="field-label">Languages</span><div className="profile-language-input"><Languages size={18} /><input className="control" value={values.languages} onChange={(event) => setValues((current) => ({ ...current, languages: event.target.value }))} /></div></label>
    {error && <p className="field-message field-message--error" role="alert">{error}</p>}</section></div>
    <div className="sticky-cta profile-save-bar"><span className="sticky-cta-summary"><strong>{changed ? 'Unsaved changes' : 'Your profile'}</strong><span>Visible to the YBuy community</span></span><button type="button" className="primary-button" onClick={save}>Save changes</button></div>
  </PageShell>;
}

/** Guides a member through contact, identity and payment verification. */
export function VerificationPage({ params }: { params: Record<string, string> }) {
  void params;
  const { user, updateProfile, notify } = useDemo(); const [otp, setOtp] = useState(''); const [idType, setIdType] = useState('Driver’s license');
  const [front, setFront] = useState(false); const [back, setBack] = useState(false); const [selfie, setSelfie] = useState(false); const [reviewing, setReviewing] = useState(false);
  if (!user) return <PageShell width="narrow" title="Verification" back="/profile"><div className="profile-auth"><IdCard size={30} /><h2>Sign in to verify your account</h2><p>Verified details help keep every handoff comfortable.</p><Link href="/signin" className="primary-button">Sign in</Link></div></PageShell>;
  const startReview = () => { setReviewing(true); window.setTimeout(() => { updateProfile({ idVerified: true }); setReviewing(false); notify('Identity verified in this demo.'); }, 1800); };
  const fileInput = (label: string, selected: boolean, update: (value: boolean) => void, capture: 'user' | 'environment') => <label className="secondary-button profile-document-upload"><Camera size={16} />{selected ? `${label} added` : label}<input type="file" accept="image/*" capture={capture} onChange={(event) => update(!!event.target.files?.length)} /></label>;
  const card = (title: string, description: string, done: boolean, action: JSX.Element) => <section className="card profile-verify-card"><div className="profile-verify-card-icon">{done ? <BadgeCheck size={22} /> : <LockKeyhole size={21} />}</div><div className="profile-verify-card-main"><div className="profile-verify-heading"><div><h2>{title}</h2><p>{description}</p></div><Pill tone={done ? 'success' : 'neutral'}>{done ? 'Verified' : 'To do'}</Pill></div>{!done && <div className="profile-verify-action">{action}</div>}</div></section>;
  return <PageShell width="narrow" title="Verification" subtitle="A few quick checks make sharing gear feel safer for everyone." back="/profile"><div className="profile-verify-list">
    {card('Email address', user.email, user.emailVerified, <p className="profile-verify-static">Verified for this account</p>)}
    {card('Mobile number', user.phone || 'Add a mobile number in account settings', user.phoneVerified, <div className="profile-otp"><p>For this demo, use the code <strong>{DEMO_OTP}</strong>.</p><div className="profile-otp-form"><input className="control" inputMode="numeric" autoComplete="one-time-code" aria-label="Six digit verification code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="6-digit code" /><button className="primary-button" type="button" onClick={() => otp === DEMO_OTP ? (updateProfile({ phoneVerified: true }), notify('Phone number verified.')) : notify('That code does not match. Try 246810.')}>Verify</button></div><p className="profile-verify-static">No text message is sent.</p></div>)}
    {card('Government ID', 'A private identity check, never shown on your profile.', user.idVerified, <div className="profile-id-check"><label className="field"><span className="field-label">ID type</span><select className="control" value={idType} onChange={(event) => setIdType(event.target.value)}><option>Driver’s license</option><option>Passport</option><option>State ID</option></select></label><div className="profile-upload-grid">{fileInput('Front photo', front, setFront, 'environment')}{idType !== 'Passport' && fileInput('Back photo', back, setBack, 'environment')}{fileInput('Quick selfie', selfie, setSelfie, 'user')}</div><button className="primary-button" type="button" disabled={!front || (idType !== 'Passport' && !back) || !selfie || reviewing} onClick={startReview}>{reviewing ? 'Reviewing your ID…' : 'Submit for review'}</button><p className="profile-verify-static">This is a simulated review. No document leaves your device or account.</p></div>)}
    {card('Payment method', 'Add a payment method for deposits and rentals.', user.paymentAdded, <Link href="/wallet" className="secondary-button">Go to wallet <ArrowRight size={15} /></Link>)}
    <aside className="profile-privacy-note"><ShieldCheck size={21} /><div><h3>Why verification matters</h3><p>Verified contact and identity details help neighbors coordinate, and help our Trust team respond if something goes wrong. Private ID documents are never part of your public profile.</p></div></aside>
  </div></PageShell>;
}

/** Manages the demo member's login, privacy and account controls. */
export function SettingsPage({ params }: { params: Record<string, string> }) {
  void params;
  const { user, updateProfile, notify, signOut } = useDemo();
  const [google, setGoogle] = useState(user?.provider === 'google'); const [apple, setApple] = useState(user?.provider === 'apple'); const [facebook, setFacebook] = useState(user?.provider === 'facebook');
  const [showCity, setShowCity] = useState(true); const [searchable, setSearchable] = useState(true); const [password, setPassword] = useState('');
  const [units, setUnits] = useState(() => { try { return window.sessionStorage.getItem('ybuy-distance-unit') ?? 'Miles'; } catch { return 'Miles'; } });
  const [currency, setCurrency] = useState(() => { try { return window.sessionStorage.getItem('ybuy-currency') ?? 'USD · $'; } catch { return 'USD · $'; } });
  if (!user) return <PageShell width="narrow" title="Account settings" back="/profile"><div className="profile-auth"><UserRound size={30} /><h2>Sign in to manage settings</h2><p>Change your account and privacy preferences.</p><Link href="/signin" className="primary-button">Sign in</Link></div></PageShell>;
  const toggle = (label: string, value: boolean, onChange: (value: boolean) => void) => <button type="button" role="switch" aria-checked={value} aria-label={label} className="switch" onClick={() => onChange(!value)} />;
  const savePreference = (key: string, value: string, setter: (next: string) => void) => { setter(value); try { window.sessionStorage.setItem(key, value); } catch { /* session storage may be unavailable */ } };
  const danger = (action: 'deactivate' | 'delete') => { if (!window.confirm(action === 'delete' ? 'Delete this demo account and sign out? This cannot be undone.' : 'Deactivate your demo account for this session?')) return; if (action === 'delete') { signOut(); return; } notify('Account deactivated for this demo.'); signOut(); };
  return <PageShell width="narrow" title="Account settings" subtitle="Choose how you sign in and what neighbors can see." back="/profile"><div className="profile-settings-list">
    <section className="card profile-settings-card"><h2>Account information</h2><label className="field"><span className="field-label">Email</span><input className="control" type="email" value={user.email} onChange={(event) => updateProfile({ email: event.target.value })} /></label><label className="field"><span className="field-label">Phone</span><input className="control" type="tel" value={user.phone} onChange={(event) => updateProfile({ phone: event.target.value })} /></label><div className="profile-password"><label className="field"><span className="field-label">New password</span><input className="control" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label><button className="secondary-button" type="button" onClick={() => { if (password.length < 8) { notify('Use at least 8 characters for a new password.'); return; } setPassword(''); notify('Password updated for this demo.'); }}>Update password</button></div></section>
    <section className="card profile-settings-card"><h2>Login methods</h2><p className="profile-muted">Connected ways to sign in to this account.</p>{([[google, setGoogle, 'Google'], [apple, setApple, 'Apple'], [facebook, setFacebook, 'Facebook']] as const).map(([connected, setter, label]) => <div className="profile-setting-row" key={label}><span><strong>{label}</strong><small>{connected ? 'Connected' : 'Not connected'}</small></span>{toggle(`${label} sign-in`, connected, setter)}</div>)}</section>
    <section className="card profile-settings-card"><h2>Privacy</h2><div className="profile-setting-row"><span><strong>Show my city on my profile</strong><small>Only your city, not your street address</small></span>{toggle('Show my city on my profile', showCity, setShowCity)}</div><div className="profile-setting-row"><span><strong>Searchable by neighbors</strong><small>Let neighbors find your profile and listings</small></span>{toggle('Searchable by neighbors', searchable, setSearchable)}</div></section>
    <section className="card profile-settings-card"><h2>Display preferences</h2><div className="profile-setting-row"><span><strong>Distance</strong><small>Used for nearby gear and locations</small></span><select className="control profile-setting-select" value={units} onChange={(event) => savePreference('ybuy-distance-unit', event.target.value, setUnits)}><option>Miles</option><option>Kilometers</option></select></div><div className="profile-setting-row"><span><strong>Currency</strong><small>Shown across prices and payments</small></span><select className="control profile-setting-select" value={currency} onChange={(event) => savePreference('ybuy-currency', event.target.value, setCurrency)}><option>USD · $</option><option>CAD · $</option></select></div></section>
    <section className="card profile-settings-card profile-danger-zone"><h2>Danger zone</h2><p className="profile-muted">These actions only affect this local demo.</p><button className="danger-button" type="button" onClick={() => danger('deactivate')}>Deactivate account</button><button className="text-button profile-delete" type="button" onClick={() => danger('delete')}>Delete demo account</button><small>Demo only. No account data is sent to a server.</small></section>
  </div></PageShell>;
}

/** Presents a public neighbor profile from their listings and reviews. */
export function PublicProfilePage({ params }: { params: Record<string, string> }) {
  const { user, data } = useDemo();
  const requestedName = (params.name ?? '').replace(/[-_]+/g, ' ').trim();
  const ownerListings = listings.filter((listing) => listing.owner.toLowerCase() === requestedName.toLowerCase().split(' ')[0]);
  const isCurrent = !!user && `${user.firstName} ${user.lastName}`.toLowerCase() === requestedName.toLowerCase();
  const name = isCurrent ? fullName(user!) : ownerListings[0]?.owner ?? (requestedName || 'Your neighbor');
  const person = isCurrent ? user : null;
  const reviews = data.reviews.filter((review) => ownerListings.some((listing) => listing.id === review.listingId) && review.about === 'item-owner');
  const rating = person?.rating ?? (ownerListings.length ? ownerListings.reduce((sum, listing) => sum + listing.rating, 0) / ownerListings.length : 4.9);
  const count = person?.reviewsCount ?? ownerListings.reduce((sum, listing) => sum + listing.reviews, 0);
  return <PageShell title={name} subtitle="Meet a neighbor who loves sharing good gear." back="/"><div className="profile-public">
    <section className="profile-public-hero card"><Avatar name={name} photo={person?.photo} size={100} /><div className="profile-public-summary"><h2>{name}</h2><div className="profile-public-badges"><Pill tone="success"><BadgeCheck size={14} /> Identity verified</Pill><Pill tone="info"><Check size={14} /> Phone verified</Pill></div><p>Member since {person?.memberSince ?? '2022'} <span>·</span> <Stars value={rating} /> <strong>{rating.toFixed(2)}</strong> ({count} reviews)</p><p className="profile-public-response">Usually responds within a few hours</p></div></section>
    <section className="profile-public-about"><div><h2>About {name.split(' ')[0]}</h2><p>{person?.bio || (ownerListings.length ? `A neighbor sharing ${ownerListings.map((item) => item.category.toLowerCase()).join(' and ')} gear. Happy to help you get started.` : 'A thoughtful neighbor in the YBuy community. More details will appear here as they share gear.')}</p>{person?.location && <p className="profile-public-location"><MapPin size={16} /> Lives in {person.location.split(',')[0]}</p>}</div><div className="profile-public-stats"><span><strong>{ownerListings.length || '—'}</strong> listings</span><span><strong>{person?.rentals ?? ownerListings.reduce((sum, item) => sum + item.reviews, 0)}</strong> rentals</span></div></section>
    <section className="profile-public-section"><div className="profile-section-heading"><h2>Gear shared by {name.split(' ')[0]}</h2><span>{ownerListings.length} listings</span></div>{ownerListings.length ? <div className="profile-listing-grid">{ownerListings.map((listing) => <Link key={listing.id} href={`/gear/${listing.id}`} className="profile-listing-card"><img src={listing.image} alt={listing.imageAlt} /><span className="profile-listing-copy"><strong>{listing.title}</strong><small>{money(listing.price, false)} / day <span>·</span> <Stars value={listing.rating} /> {listing.rating.toFixed(2)}</small></span></Link>)}</div> : <EmptyState icon={<Bike size={22} />} title="No gear listed just yet" body="This neighbor's gear will appear here when they share it." />}</section>
    <section className="profile-public-section"><div className="profile-section-heading"><h2>Reviews</h2><span>{reviews.length || count} neighbor notes</span></div><div className="profile-review-grid">{(reviews.length ? reviews.slice(0, 3) : [{ id: 'welcome', author: 'YBuy neighbors', text: 'Every rental is a chance to help someone make a little more of their day.', rating, at: Date.now() }]).map((review) => <article className="card profile-review" key={review.id}><Stars value={review.rating} /><p>“{review.text}”</p><small>{review.author} <span>·</span> {new Date(review.at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</small></article>)}</div></section>
    <p className="profile-report"><Link href="/help/new">Report this profile <ArrowRight size={15} /></Link></p>
  </div></PageShell>;
}

/** Shows an item's provenance, included pieces and rental history. */
export function PassportPage({ params }: { params: Record<string, string> }) {
  const { data } = useDemo(); const item = listingById(params.listingId ?? '');
  const history = useMemo(() => item ? data.bookings.filter((booking) => booking.listingId === item.id && booking.status !== 'cancelled').sort((a, b) => a.createdAt - b.createdAt) : [], [data.bookings, item]);
  if (!item) return <PageShell width="narrow" title="Item passport" subtitle="A record of the gear shared on YBuy." back="/"><EmptyState icon={<FileCheck2 size={24} />} title="Passport not found" body="This item may have been removed or its link may be out of date." /></PageShell>;
  const value = DECLARED_VALUE[item.id] ?? 300; const latest = history[history.length - 1]; const grades = ['A', 'A−', 'B+', 'A', 'A'];
  return <PageShell width="narrow" title="Item passport" subtitle="A little history for a well-loved thing." back={`/gear/${item.id}`}><article className="passport-document">
    <header className="passport-head"><span className="passport-mark"><PackageCheck size={23} /></span><span><strong>YBuy · item passport</strong><small>Shared gear record</small></span><Pill tone="success"><Check size={13} /> Verified listing</Pill></header>
    <div className="passport-image"><img src={item.image} alt={item.imageAlt} /><span>ITEM ID <strong>YB-{item.id.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase()}</strong></span></div>
    <div className="passport-title"><div><h2>{item.title}</h2><p>Shared by {item.owner} <span>·</span> {item.category}</p></div><div><small>Declared value</small><strong>{money(value, false)}</strong></div></div>
    <section className="passport-section"><h3>Included with this item</h3><ul className="passport-includes">{item.includes.map((piece, index) => <li key={piece}><span><Check size={15} />{piece}</span><Pill tone={grades[index % grades.length].startsWith('A') ? 'success' : 'neutral'}>Grade {grades[index % grades.length]}</Pill></li>)}</ul></section>
    <section className="passport-section passport-history"><div className="profile-section-heading"><h3>Care and rental history</h3><span>{history.length} rentals</span></div><ol className="timeline">{[{ title: 'Listed on YBuy', detail: 'Owner prepared this item for sharing', at: history[0]?.createdAt ?? Date.now() - 180 * 86400000 }, ...history.map((booking) => ({ title: booking.status === 'completed' ? 'Rental completed' : `Rental ${booking.status}`, detail: `${booking.counterpart.name} · ${longDate(booking.start)} – ${longDate(booking.end)}`, at: booking.createdAt })), { title: 'Last inspection', detail: latest ? 'Checked at the most recent handoff' : 'Owner checked included pieces before listing', at: latest?.createdAt ?? Date.now() - 86400000 }].map((entry, index) => <li key={`${entry.title}-${index}`} className={index === 0 ? 'is-done' : ''}><span className="timeline-dot"><Check size={13} /></span><div><strong>{entry.title}</strong><span>{entry.detail} <span>·</span> {new Date(entry.at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span></div></li>)}</ol></section>
    <div className="passport-inspection-photo"><img src={item.image} alt={`Latest inspection photo of ${item.title}`} /><span><Camera size={15} /> Latest inspection photo</span></div>
    <footer className="passport-foot"><span><ShieldCheck size={18} /><span><strong>Eligible for YBuy Protection</strong><small>Optional protection is available at checkout.</small></span></span><Link href="/protection">How protection works <ArrowRight size={15} /></Link></footer>
  </article></PageShell>;
}





