import { listings } from '../data';
import type { Listing } from '../data';
import { todayIso } from '../calendar';

/* ---------- Types ---------- */

export type AuthProvider = 'email' | 'google' | 'apple' | 'facebook';
/** user = browsing/new member, renter = borrows gear, owner = lists and hosts gear. */
export type AccountRole = 'user' | 'renter' | 'owner';

export interface Profile {
  id: string;
  role: AccountRole;
  firstName: string;
  lastName: string;
  /** Name exactly as it appears on a government ID. */
  legalName: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  idVerified: boolean;
  paymentAdded: boolean;
  /** Data URL; empty when no photo yet. */
  photo: string;
  bio: string;
  interests: string[];
  location: string;
  radius: number | null;
  dateOfBirth: string;
  memberSince: string;
  provider: AuthProvider;
  rating: number;
  reviewsCount: number;
  rentals: number;
}

export type BookingStatus = 'requested' | 'confirmed' | 'active' | 'returned' | 'completed' | 'cancelled' | 'declined';
export type DepositStatus = 'pending' | 'authorized' | 'released' | 'claimed';
export type Fulfilment = 'pickup' | 'delivery';

export interface Quote {
  days: number;
  subtotal: number;
  discount: number;
  discountLabel: string;
  serviceFee: number;
  deliveryFee: number;
  protection: number;
  tax: number;
  total: number;
  deposit: number;
}

export interface HandoffRecord {
  at: number;
  checklist: Record<string, boolean>;
  photos: string[];
  notes: string;
}

export interface Booking {
  id: string;
  ref: string;
  listingId: string;
  /** Whether the signed-in user is renting the item or lending it. */
  role: 'renter' | 'owner';
  counterpart: { name: string; initials: string };
  start: string;
  end: string;
  fulfilment: Fulfilment;
  withProtection: boolean;
  quote: Quote;
  status: BookingStatus;
  depositStatus: DepositStatus;
  createdAt: number;
  reviewed?: boolean;
  pickup?: HandoffRecord;
  return?: HandoffRecord;
  conversationId?: string;
}

export interface Message { id: string; from: 'me' | 'them' | 'system'; text: string; at: number; image?: string }
export interface Conversation { id: string; listingId: string; bookingId?: string; with: { name: string; initials: string }; messages: Message[]; unread: number }

export type NoticeType = 'booking' | 'outbid' | 'auction-won' | 'auction-ended' | 'message' | 'payment' | 'review' | 'payout';
export interface Notice { id: string; type: NoticeType; title: string; body: string; at: number; read: boolean; href?: string }
export type NoticeChannels = { push: boolean; email: boolean; inApp: boolean };

export type TxnKind = 'earning' | 'payout' | 'refund' | 'payment' | 'deposit-hold' | 'deposit-release';
export interface Txn { id: string; kind: TxnKind; label: string; amount: number; at: number; status: 'pending' | 'completed' }
export interface PaymentMethod { id: string; brand: 'Visa' | 'Mastercard' | 'Amex' | 'Apple Pay' | 'Google Pay'; last4: string; exp: string; isDefault: boolean }
export interface PayoutMethod { bank: string; last4: string; holder: string }

export type ClaimCategory = 'damage' | 'missing-parts' | 'theft' | 'not-as-described' | 'late-return';
export type CaseStatus = 'submitted' | 'under-review' | 'awaiting-you' | 'resolved' | 'closed';
export interface CaseActivity { at: number; who: string; text: string }
export interface Claim { id: string; ref: string; bookingId: string; category: ClaimCategory; subject: string; details: string; amount: number; status: CaseStatus; createdAt: number; evidence: string[]; activity: CaseActivity[] }
export type TicketCategory = 'booking' | 'payment' | 'account' | 'listing' | 'safety' | 'other';
export interface Ticket { id: string; ref: string; category: TicketCategory; subject: string; details: string; bookingId?: string; status: 'open' | 'waiting' | 'resolved'; createdAt: number; activity: CaseActivity[] }

export interface Review {
  id: string;
  listingId: string;
  bookingId?: string;
  author: string;
  initials: string;
  /** Who is being reviewed. */
  about: 'item-owner' | 'renter';
  rating: number;
  scores: { accuracy: number; communication: number; condition: number };
  tags: string[];
  text: string;
  at: number;
}

export type WantedStatus = 'open' | 'responses' | 'fulfilled' | 'cancelled';
export interface Wanted { id: string; title: string; category: string; details: string; start: string; end: string; budget: number; radius: number | null; status: WantedStatus; matches: string[]; createdAt: number }

export interface HostListing { listingId: string; paused: boolean; price: number; weeklyDiscount: number; monthlyDiscount: number; blocked: string[]; instantBook: boolean; minDays: number }

/* ---------- Constants & pricing rules ---------- */

/** Declared replacement value per listing, used for deposit and protection pricing. */
export const DECLARED_VALUE: Record<string, number> = {
  'weekend-camp': 420, 'sony-camera': 1650, 'gravel-bike': 980, 'lake-paddleboard': 640,
  'home-project': 260, 'garden-party': 310, 'trail-backpack': 230, 'photo-day': 720,
};

export const SERVICE_FEE_RATE = 0.08;
export const TAX_RATE = 0.0825;
export const DELIVERY_FEE = 12;
export const PROTECTION_RATE = 0.01;
export const WEEKLY_DISCOUNT = 0.1;
export const MONTHLY_DISCOUNT = 0.25;
/** Demo one-time code shown in the UI hint; no SMS is sent. */
export const DEMO_OTP = '246810';

const round = (value: number) => Math.round(value * 100) / 100;

export function daysBetween(start: string, end: string): number {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.round((b - a) / 86400000);
}

/**
 * Price breakdown for a rental. Rules mirror the main site: weekly (7+ days) and monthly (28+ days)
 * discounts, an 8% service fee, optional flat delivery, optional protection at 1% of declared value
 * per day, tax on the charged amount, and a refundable deposit of 20% of declared value (min $50).
 */
export function quoteFor(listing: Listing, start: string, end: string, options: { fulfilment: Fulfilment; protection: boolean }): Quote | null {
  const days = daysBetween(start, end);
  if (!days) return null;
  const value = DECLARED_VALUE[listing.id] ?? 300;
  const subtotal = listing.price * days;
  const rate = days >= 28 ? MONTHLY_DISCOUNT : days >= 7 ? WEEKLY_DISCOUNT : 0;
  const discount = round(subtotal * rate);
  const discounted = subtotal - discount;
  const serviceFee = round(discounted * SERVICE_FEE_RATE);
  const deliveryFee = options.fulfilment === 'delivery' ? DELIVERY_FEE : 0;
  const protection = options.protection ? round(value * PROTECTION_RATE * days) : 0;
  const tax = round((discounted + serviceFee + deliveryFee + protection) * TAX_RATE);
  return {
    days, subtotal, discount, discountLabel: rate === MONTHLY_DISCOUNT ? 'Monthly discount' : rate ? 'Weekly discount' : '',
    serviceFee, deliveryFee, protection, tax,
    total: round(discounted + serviceFee + deliveryFee + protection + tax),
    deposit: Math.max(50, Math.round(value * 0.2)),
  };
}

/* ---------- Formatting ---------- */

export const money = (value: number, cents = true) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
export const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
export const dateRange = (start: string, end: string) => `${shortDate(start)} – ${shortDate(end)}`;

export function relativeTime(at: number, now = Date.now()): string {
  const diff = Math.round((now - at) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  if (diff < 2880) return 'Yesterday';
  return new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const clockTime = (at: number) => new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/* Member-published listings are registered here so every flow resolves them like sample gear. */
let customListings: Listing[] = [];

export function registerCustomListings(items: Listing[] | undefined, values: Record<string, number> = {}): void {
  customListings = items ?? [];
  Object.assign(DECLARED_VALUE, values);
}

/** Sample collection plus anything the member has published, newest member listings first. */
export function allListings(): Listing[] {
  return customListings.length ? [...customListings, ...listings] : listings;
}

export function listingById(id: string): Listing | undefined {
  return customListings.find((listing) => listing.id === id) ?? listings.find((listing) => listing.id === id);
}

export function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeRef(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

/** 0–100 profile completion used by the sign-up progress ring and the profile page. */
export function profileCompletion(profile: Profile | null): { percent: number; items: { label: string; done: boolean }[] } {
  if (!profile) return { percent: 0, items: [] };
  const items = [
    { label: 'Legal name', done: !!profile.legalName },
    { label: 'Email verified', done: profile.emailVerified },
    { label: 'Mobile verified', done: profile.phoneVerified },
    { label: 'Profile photo', done: !!profile.photo },
    { label: 'Preferred location', done: !!profile.location },
    { label: 'Short bio', done: profile.bio.trim().length >= 20 },
    { label: 'Government ID', done: profile.idVerified },
    { label: 'Payment method', done: profile.paymentAdded },
  ];
  return { percent: Math.round(items.filter((item) => item.done).length / items.length * 100), items };
}

/* ---------- Seed data (relative to today so the demo always looks current) ---------- */

export function shiftDays(days: number): string {
  const date = new Date(`${todayIso()}T12:00:00`);
  date.setDate(date.getDate() + days);
  return todayIso(date);
}

const HOUR = 3600000;

function seedBooking(id: string, listingId: string, role: Booking['role'], counterpart: Booking['counterpart'], from: number, to: number, status: BookingStatus, depositStatus: DepositStatus, extra: Partial<Booking> = {}): Booking {
  const listing = listingById(listingId) ?? listings[0];
  const start = shiftDays(from);
  const end = shiftDays(to);
  const quote = quoteFor(listing, start, end, { fulfilment: 'pickup', protection: true }) as Quote;
  return { id, ref: `YB-${id.slice(-4).toUpperCase()}`, listingId, role, counterpart, start, end, fulfilment: 'pickup', withProtection: true, quote, status, depositStatus, createdAt: Date.now() - 4 * 24 * HOUR, ...extra };
}

export interface DemoData {
  bookings: Booking[];
  conversations: Conversation[];
  notices: Notice[];
  txns: Txn[];
  paymentMethods: PaymentMethod[];
  payout: PayoutMethod | null;
  claims: Claim[];
  tickets: Ticket[];
  reviews: Review[];
  wanted: Wanted[];
  hostListings: HostListing[];
  /** Listings the signed-in member published through the create-listing flow. */
  myListings: Listing[];
  /** Declared replacement value for member listings (deposit and protection pricing). */
  declaredValues?: Record<string, number>;
  prefs: Record<NoticeType, NoticeChannels>;
}

export function createSeed(now = Date.now()): DemoData {
  const bookings: Booking[] = [
    seedBooking('bk-cam1', 'sony-camera', 'renter', { name: 'Andre', initials: 'AL' }, 2, 5, 'confirmed', 'authorized', { conversationId: 'cv-andre' }),
    seedBooking('bk-bik2', 'gravel-bike', 'renter', { name: 'Sam', initials: 'SC' }, -1, 2, 'active', 'authorized', { conversationId: 'cv-sam', pickup: { at: now - 20 * HOUR, checklist: { clean: true, working: true, complete: true }, photos: [], notes: 'Small scuff on the left crank, already there.' } }),
    seedBooking('bk-cmp3', 'weekend-camp', 'renter', { name: 'Maya', initials: 'MK' }, -12, -9, 'completed', 'released', { conversationId: 'cv-maya' }),
    seedBooking('bk-pty4', 'garden-party', 'renter', { name: 'Leo', initials: 'LD' }, -30, -28, 'completed', 'released', { reviewed: true }),
    seedBooking('bk-pad5', 'lake-paddleboard', 'renter', { name: 'Priya', initials: 'PS' }, 9, 11, 'cancelled', 'released'),
    seedBooking('bk-own6', 'trail-backpack', 'owner', { name: 'Jordan', initials: 'JB' }, 3, 6, 'requested', 'pending', { conversationId: 'cv-jordan' }),
    seedBooking('bk-own7', 'home-project', 'owner', { name: 'Riley', initials: 'RT' }, 1, 3, 'confirmed', 'authorized'),
    seedBooking('bk-own8', 'photo-day', 'owner', { name: 'Casey', initials: 'CM' }, -8, -6, 'completed', 'released'),
  ];
  const message = (id: string, from: Message['from'], text: string, hoursAgo: number): Message => ({ id, from, text, at: now - hoursAgo * HOUR });
  const conversations: Conversation[] = [
    { id: 'cv-andre', listingId: 'sony-camera', bookingId: 'bk-cam1', with: { name: 'Andre', initials: 'AL' }, unread: 2, messages: [
      message('m1', 'system', 'Booking confirmed. Your deposit is authorized, not charged.', 30),
      message('m2', 'me', 'Hi Andre! Excited to try the camera. Is Saturday 10am OK for pickup?', 29),
      message('m3', 'them', 'Saturday at 10 works great. I’ll charge both batteries the night before.', 3),
      message('m4', 'them', 'I’m near the coffee shop on Main St — easy parking there.', 2.8),
    ] },
    { id: 'cv-sam', listingId: 'gravel-bike', bookingId: 'bk-bik2', with: { name: 'Sam', initials: 'SC' }, unread: 0, messages: [
      message('m5', 'them', 'Enjoy the ride! The seat post adjusts with the quick-release lever.', 20),
      message('m6', 'me', 'Thanks Sam, it rides beautifully.', 6),
    ] },
    { id: 'cv-maya', listingId: 'weekend-camp', bookingId: 'bk-cmp3', with: { name: 'Maya', initials: 'MK' }, unread: 0, messages: [
      message('m7', 'me', 'Everything is packed and back on your porch. Thanks so much!', 216),
      message('m8', 'them', 'Got it, all perfect. Hope you had a great weekend!', 214),
    ] },
    { id: 'cv-jordan', listingId: 'trail-backpack', bookingId: 'bk-own6', with: { name: 'Jordan', initials: 'JB' }, unread: 1, messages: [
      message('m9', 'them', 'Hi! Would the backpack fit a 15" laptop as well? Planning a hike + work trip.', 1),
    ] },
  ];
  const notice = (id: string, type: NoticeType, title: string, body: string, hoursAgo: number, read: boolean, href?: string): Notice => ({ id, type, title, body, at: now - hoursAgo * HOUR, read, href });
  const notices: Notice[] = [
    notice('n1', 'message', 'Andre sent you a message', '“I’m near the coffee shop on Main St — easy parking there.”', 2.8, false, '/inbox/cv-andre'),
    notice('n2', 'outbid', 'You’ve been outbid', 'Someone bid $32 on “The camera-day bundle”. 9 minutes left.', 1.5, false, '/auctions/auction-2'),
    notice('n3', 'booking', 'New request for your trail backpack', 'Jordan wants to borrow it for 3 days. Respond within 24 hours.', 1, false, '/hosting'),
    notice('n4', 'review', 'How was the camping kit?', 'Leave a review for Maya — it helps the whole neighborhood.', 26, true, '/trips/bk-cmp3/review'),
    notice('n5', 'auction-won', 'You won “Dinner under the lights”', 'Complete payment within 12 hours to secure it.', 50, true, '/trips'),
    notice('n6', 'payout', 'Payout on the way', '$118.40 is headed to your bank ending 4021.', 72, true, '/wallet'),
    notice('n7', 'payment', 'Deposit released', 'Your $84 deposit for the camping kit was released.', 200, true, '/wallet'),
  ];
  const txns: Txn[] = [
    { id: 't1', kind: 'earning', label: 'Home project kit · Riley', amount: 25.92, at: now - 6 * HOUR, status: 'pending' },
    { id: 't6', kind: 'deposit-hold', label: 'Deposit hold · Camera kit', amount: -330, at: now - 30 * HOUR, status: 'pending' },
    { id: 't2', kind: 'payout', label: 'Payout to Chase ••4021', amount: -118.4, at: now - 72 * HOUR, status: 'completed' },
    { id: 't3', kind: 'earning', label: 'Portrait lens · Casey', amount: 40.48, at: now - 150 * HOUR, status: 'completed' },
    { id: 't4', kind: 'deposit-release', label: 'Deposit released · Camping kit', amount: 84, at: now - 200 * HOUR, status: 'completed' },
    { id: 't5', kind: 'payment', label: 'Camping kit · Maya', amount: -100.32, at: now - 300 * HOUR, status: 'completed' },
  ];
  const reviews: Review[] = [
    { id: 'r1', listingId: 'weekend-camp', author: 'Taylor', initials: 'TG', about: 'item-owner', rating: 5, scores: { accuracy: 5, communication: 5, condition: 5 }, tags: ['Spotless', 'Great communication'], text: 'Everything was exactly as described and Maya even left a little map of her favorite campsites.', at: now - 20 * 24 * HOUR },
    { id: 'r2', listingId: 'sony-camera', author: 'Morgan', initials: 'ML', about: 'item-owner', rating: 5, scores: { accuracy: 5, communication: 4, condition: 5 }, tags: ['Easy pickup', 'Like new'], text: 'Andre walked me through the settings. Photos came out beautiful.', at: now - 34 * 24 * HOUR },
    { id: 'r3', listingId: 'gravel-bike', author: 'Chris', initials: 'CW', about: 'item-owner', rating: 4, scores: { accuracy: 4, communication: 5, condition: 4 }, tags: ['Friendly owner'], text: 'Great bike, tires could use a little air but Sam had a pump ready.', at: now - 50 * 24 * HOUR },
    { id: 'r4', listingId: 'photo-day', author: 'Casey', initials: 'CM', about: 'item-owner', rating: 5, scores: { accuracy: 5, communication: 5, condition: 5 }, tags: ['Like new'], text: 'Lovely lens, returned it the same evening. Would borrow again.', at: now - 5 * 24 * HOUR },
    { id: 'r5', listingId: 'weekend-camp', author: 'Maya', initials: 'MK', about: 'renter', rating: 5, scores: { accuracy: 5, communication: 5, condition: 5 }, tags: ['On time', 'Returned clean'], text: 'Alex took great care of the kit and returned it early. Welcome back anytime!', at: now - 8 * 24 * HOUR },
  ];
  const wanted: Wanted[] = [
    { id: 'w1', title: 'Pressure washer for a deck', category: 'Tools', details: 'Electric is fine. Need it for one Saturday.', start: shiftDays(5), end: shiftDays(6), budget: 30, radius: 10, status: 'responses', matches: ['home-project'], createdAt: now - 48 * HOUR },
    { id: 'w2', title: 'Two kayaks for a lake day', category: 'On the water', details: 'Paddles and life jackets would be ideal.', start: shiftDays(14), end: shiftDays(15), budget: 60, radius: 25, status: 'open', matches: ['lake-paddleboard'], createdAt: now - 10 * HOUR },
  ];
  const hostListings: HostListing[] = [
    { listingId: 'trail-backpack', paused: false, price: 16, weeklyDiscount: 10, monthlyDiscount: 25, blocked: [shiftDays(8), shiftDays(9)], instantBook: false, minDays: 1 },
    { listingId: 'home-project', paused: false, price: 12, weeklyDiscount: 10, monthlyDiscount: 20, blocked: [], instantBook: true, minDays: 1 },
    { listingId: 'photo-day', paused: true, price: 22, weeklyDiscount: 15, monthlyDiscount: 30, blocked: [], instantBook: false, minDays: 2 },
  ];
  const all: NoticeChannels = { push: true, email: true, inApp: true };
  return {
    bookings, conversations, notices, txns, reviews, wanted, hostListings, myListings: [],
    paymentMethods: [{ id: 'pm1', brand: 'Visa', last4: '4242', exp: '08/29', isDefault: true }],
    payout: { bank: 'Chase', last4: '4021', holder: 'Alex Rivera' },
    claims: [{ id: 'cl1', ref: 'CL-8Q2M', bookingId: 'bk-own8', category: 'damage', subject: 'Small scratch on lens hood', details: 'Noticed a light scratch on the lens hood after return. Lens glass is fine.', amount: 25, status: 'under-review', createdAt: now - 4 * 24 * HOUR, evidence: [], activity: [
      { at: now - 4 * 24 * HOUR, who: 'You', text: 'Claim submitted with 2 photos.' },
      { at: now - 3 * 24 * HOUR, who: 'Casey', text: 'Sorry about that — happy to cover a replacement hood.' },
      { at: now - 2 * 24 * HOUR, who: 'YBuy Trust team', text: 'We’re reviewing both sides. Expect an update within 2 business days.' },
    ] }],
    tickets: [{ id: 'tk1', ref: 'SP-41KD', category: 'payment', subject: 'When will my deposit be released?', details: 'Returned the camping kit 9 days ago.', bookingId: 'bk-cmp3', status: 'resolved', createdAt: now - 8 * 24 * HOUR, activity: [
      { at: now - 8 * 24 * HOUR, who: 'You', text: 'When will my deposit be released?' },
      { at: now - 8 * 24 * HOUR + 2 * HOUR, who: 'Jess · YBuy Support', text: 'Deposits release once the owner confirms the return. Maya confirmed today, so it’s on its way!' },
    ] }],
    prefs: { booking: { ...all }, outbid: { ...all, email: false }, 'auction-won': { ...all }, 'auction-ended': { push: false, email: true, inApp: true }, message: { ...all, email: false }, payment: { ...all }, review: { push: false, email: true, inApp: true }, payout: { ...all } },
  };
}

/** Profile used when someone signs in (any provider) in the demo. */
export function createDemoProfile(provider: AuthProvider, email = 'alex.rivera@example.com'): Profile {
  return {
    id: makeId('usr'), role: 'user', firstName: 'Alex', lastName: 'Rivera', legalName: 'Alexandra Rivera', email, phone: '+1 (214) 555-0142',
    phoneVerified: true, emailVerified: true, idVerified: false, paymentAdded: true, photo: '', bio: 'Weekend hiker, amateur photographer, and always up for a backyard dinner with neighbors.',
    interests: ['Outdoors', 'Cameras'], location: 'Irving, TX', radius: 5, dateOfBirth: '1992-04-18', memberSince: '2024', provider, rating: 4.96, reviewsCount: 14, rentals: 11,
  };
}
