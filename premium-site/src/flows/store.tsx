import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createDemoAuctions, createHostAuction, isHostAuction } from '../auctions';
import type { Auction, AuctionSetup } from '../auctions';
import { navigate } from '../router';
import { profileForProvider, verifyDemoLogin } from './accounts';
import { createDemoProfile, createSeed, makeId, makeRef, registerCustomListings } from './model';
import type { Listing } from '../data';
import type { AuthProvider, Booking, CaseActivity, Claim, Conversation, DemoData, HostListing, Message, Notice, NoticeChannels, NoticeType, Profile, Review, Ticket, Wanted } from './model';

const STORAGE_KEY = 'ybuy-premium-demo-v1';
const HOST_AUCTIONS_KEY = 'ybuy-host-auctions-v1';
/** Simulated neighbor bidding on member auctions: how often, how likely, and how far above the usual price it may climb. */
const BID_TICK_MS = 7000;
const BID_CHANCE = 0.45;
const BID_CEILING = 1.15;

function loadAuctions(): Auction[] {
  let hosted: Auction[] = [];
  try {
    const raw = window.sessionStorage.getItem(HOST_AUCTIONS_KEY);
    if (raw) hosted = (JSON.parse(raw) as Auction[]).filter((auction) => isHostAuction(auction) && typeof auction.endsAt === 'number');
  } catch { /* unreadable: start without member auctions */ }
  return [...hosted, ...createDemoAuctions()];
}

interface Persisted { user: Profile | null; data: DemoData }

function load(): Persisted {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Persisted;
  } catch { /* corrupted or unavailable storage falls back to a fresh seed */ }
  return { user: null, data: createSeed() };
}

export interface CheckoutDraft { listingId: string; start: string; end: string; auctionId?: string; auctionPrice?: number }

export interface DemoStore {
  user: Profile | null;
  data: DemoData;
  /** Generic immutable update for anything not covered by a named action. */
  mutate: (fn: (data: DemoData) => DemoData) => void;

  /* Auth */
  signIn: (provider: AuthProvider, email?: string) => Profile;
  /** Email/password sign in against the local demo accounts; returns null when credentials do not match. */
  signInWithPassword: (email: string, password: string) => Profile | null;
  signUp: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  signOut: () => void;
  /** Runs action immediately when signed in, otherwise sends the user to sign in and resumes afterwards. */
  requireAuth: (action?: () => void, returnTo?: string) => void;
  /** Call after a successful sign in / sign up to resume whatever the user was doing. */
  completeAuth: () => void;

  /* UI */
  toast: string;
  notify: (message: string) => void;
  dismissToast: () => void;
  checkoutDraft: CheckoutDraft | null;
  setCheckoutDraft: (draft: CheckoutDraft | null) => void;

  /* Auctions */
  auctions: Auction[];
  setAuctions: (update: (current: Auction[]) => Auction[]) => void;
  placeBid: (auctionId: string, amount: number) => boolean;
  /** Starts (or schedules) an auction hosted by the signed-in member. Returns the auction id. */
  startAuction: (setup: AuctionSetup) => string | null;

  /* Domain actions */
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  ensureConversation: (input: { listingId: string; bookingId?: string; with: Conversation['with'] }) => string;
  sendMessage: (conversationId: string, text: string, image?: string) => void;
  receiveMessage: (conversationId: string, text: string) => void;
  markConversationRead: (conversationId: string) => void;
  pushNotice: (notice: Omit<Notice, 'id' | 'at' | 'read'>) => void;
  markNotice: (id: string, read?: boolean) => void;
  markAllNotices: () => void;
  setPref: (type: NoticeType, channel: keyof NoticeChannels, value: boolean) => void;
  addReview: (review: Omit<Review, 'id' | 'at'>) => void;
  addWanted: (wanted: Omit<Wanted, 'id' | 'createdAt' | 'status' | 'matches'> & { matches?: string[] }) => Wanted;
  updateWanted: (id: string, patch: Partial<Wanted>) => void;
  updateHostListing: (listingId: string, patch: Partial<HostListing>) => void;
  /** Publishes a member listing: adds it to Explore and the hosting dashboard. */
  publishListing: (listing: Listing, host: Omit<HostListing, 'listingId'>, declaredValue: number) => void;
  addClaim: (claim: Omit<Claim, 'id' | 'ref' | 'createdAt' | 'status' | 'activity'>) => Claim;
  addTicket: (ticket: Omit<Ticket, 'id' | 'ref' | 'createdAt' | 'status' | 'activity'>) => Ticket;
  addCaseReply: (kind: 'claim' | 'ticket', id: string, entry: Omit<CaseActivity, 'at'>) => void;
  resetDemo: () => void;

  /* Derived */
  unreadMessages: number;
  unreadNotices: number;
}

const DemoContext = createContext<DemoStore | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load);
  const [toast, setToast] = useState('');
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraft | null>(null);
  const [auctions, setAuctionsState] = useState<Auction[]>(loadAuctions);
  const auctionsRef = useRef(auctions);
  const userId = state.user?.id;
  const pending = useRef<{ action?: () => void; returnTo?: string } | null>(null);

  useEffect(() => {
    try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full (large photos) – keep in memory only */ }
  }, [state]);

  useEffect(() => {
    auctionsRef.current = auctions;
    try { window.sessionStorage.setItem(HOST_AUCTIONS_KEY, JSON.stringify(auctions.filter(isHostAuction))); } catch { /* quota: keep in memory */ }
  }, [auctions]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  registerCustomListings(state.data.myListings, state.data.declaredValues);

  const mutate = useCallback((fn: (data: DemoData) => DemoData) => setState((current) => ({ ...current, data: fn(current.data) })), []);
  const notify = useCallback((message: string) => setToast(message), []);

  // Neighbors bid on live member auctions so owners can watch bidding happen.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      const raises = new Map<string, number>();
      const events: { auction: Auction; kind: 'first' | 'reserve' }[] = [];
      for (const auction of auctionsRef.current) {
        if (!isHostAuction(auction) || auction.startedAt > now || auction.endsAt <= now || Math.random() > BID_CHANCE) continue;
        const ceiling = Math.round(auction.listing.price * BID_CEILING);
        if (auction.bids > 0 && auction.currentBid >= ceiling) continue;
        const amount = auction.bids === 0 ? auction.currentBid : Math.min(ceiling, auction.currentBid + (auction.currentBid < 20 ? 1 : 2));
        raises.set(auction.id, amount);
        const reserve = auction.reservePrice ?? 0;
        if (auction.hostId === userId) {
          if (auction.bids === 0) events.push({ auction, kind: 'first' });
          else if (auction.currentBid < reserve && amount >= reserve) events.push({ auction, kind: 'reserve' });
        }
      }
      if (!raises.size) return;
      setAuctionsState((current) => current.map((auction) => {
        const amount = raises.get(auction.id);
        return amount === undefined ? auction : { ...auction, currentBid: amount, bids: auction.bids + 1, watchers: auction.watchers + (Math.random() < 0.6 ? 1 : 0), youLead: false };
      }));
      events.forEach(({ auction, kind }) => mutate((d) => ({ ...d, notices: [{
        id: makeId('n'), at: Date.now(), read: false, type: 'outbid',
        title: kind === 'first' ? 'First bid on your auction' : 'Reserve met',
        body: kind === 'first' ? `A neighbor bid ${'$'}${auction.currentBid} / day on “${auction.title}”.` : `Bids on “${auction.title}” reached your ${'$'}${auction.reservePrice} reserve.`,
        href: `/auctions/${auction.id}`,
      }, ...d.notices] })));
    }, BID_TICK_MS);
    return () => window.clearInterval(timer);
  }, [userId, mutate]);


  const store = useMemo<DemoStore>(() => {
    const { user, data } = state;
    const setUser = (next: Profile | null) => setState((current) => ({ ...current, user: next }));

    const pushNotice: DemoStore['pushNotice'] = (notice) => mutate((d) => ({ ...d, notices: [{ ...notice, id: makeId('n'), at: Date.now(), read: false }, ...d.notices] }));

    return {
      user, data, mutate, toast, notify, dismissToast: () => setToast(''), checkoutDraft, setCheckoutDraft,

      signIn: (provider, email) => {
        const profile = profileForProvider(email, provider) ?? createDemoProfile(provider, email);
        setUser(profile);
        return profile;
      },
      signInWithPassword: (email, password) => {
        const profile = verifyDemoLogin(email, password);
        if (profile) setUser(profile);
        return profile;
      },
      signUp: (profile) => setUser(profile),
      updateProfile: (patch) => setState((current) => current.user ? { ...current, user: { ...current.user, ...patch } } : current),
      signOut: () => { setUser(null); pending.current = null; notify('Signed out. See you soon.'); navigate('/'); },
      requireAuth: (action, returnTo) => {
        if (user) { action?.(); return; }
        pending.current = { action, returnTo: returnTo ?? window.location.pathname };
        navigate('/signin');
      },
      completeAuth: () => {
        const next = pending.current;
        pending.current = null;
        navigate(next?.returnTo && !next.returnTo.startsWith('/signin') && !next.returnTo.startsWith('/signup') ? next.returnTo : '/', { replace: true });
        if (next?.action) window.setTimeout(next.action, 0);
      },

      auctions,
      setAuctions: (update) => setAuctionsState(update),
      placeBid: (auctionId, amount) => {
        const auction = auctions.find((value) => value.id === auctionId);
        if (!auction || auction.endsAt <= Date.now() || amount <= auction.currentBid) return false;
        if (auction.hostId && auction.hostId === state.user?.id) return false;
        setAuctionsState((current) => current.map((value) => value.id === auctionId ? { ...value, currentBid: amount, bids: value.bids + 1, youLead: true } : value));
        return true;
      },
      startAuction: (setup) => {
        if (!state.user) return null;
        const auction = createHostAuction(setup, state.user.id);
        setAuctionsState((current) => [auction, ...current]);
        return auction.id;
      },

      addBooking: (booking) => mutate((d) => ({ ...d, bookings: [booking, ...d.bookings] })),
      updateBooking: (id, patch) => mutate((d) => ({ ...d, bookings: d.bookings.map((b) => b.id === id ? { ...b, ...patch } : b) })),
      ensureConversation: ({ listingId, bookingId, with: counterpart }) => {
        const existing = data.conversations.find((c) => (bookingId && c.bookingId === bookingId) || (!bookingId && c.listingId === listingId && c.with.name === counterpart.name));
        if (existing) return existing.id;
        const id = makeId('cv');
        mutate((d) => ({ ...d, conversations: [{ id, listingId, bookingId, with: counterpart, unread: 0, messages: [] }, ...d.conversations] }));
        return id;
      },
      sendMessage: (conversationId, text, image) => {
        const message: Message = { id: makeId('m'), from: 'me', text, at: Date.now(), image };
        mutate((d) => ({ ...d, conversations: d.conversations.map((c) => c.id === conversationId ? { ...c, messages: [...c.messages, message] } : c) }));
      },
      receiveMessage: (conversationId, text) => {
        const message: Message = { id: makeId('m'), from: 'them', text, at: Date.now() };
        mutate((d) => ({ ...d, conversations: d.conversations.map((c) => c.id === conversationId ? { ...c, messages: [...c.messages, message], unread: c.unread + 1 } : c) }));
      },
      markConversationRead: (conversationId) => mutate((d) => ({ ...d, conversations: d.conversations.map((c) => c.id === conversationId && c.unread ? { ...c, unread: 0 } : c) })),
      pushNotice,
      markNotice: (id, read = true) => mutate((d) => ({ ...d, notices: d.notices.map((n) => n.id === id ? { ...n, read } : n) })),
      markAllNotices: () => mutate((d) => ({ ...d, notices: d.notices.map((n) => ({ ...n, read: true })) })),
      setPref: (type, channel, value) => mutate((d) => ({ ...d, prefs: { ...d.prefs, [type]: { ...d.prefs[type], [channel]: value } } })),
      addReview: (review) => mutate((d) => ({ ...d, reviews: [{ ...review, id: makeId('r'), at: Date.now() }, ...d.reviews], bookings: d.bookings.map((b) => b.id === review.bookingId ? { ...b, reviewed: true } : b) })),
      addWanted: (input) => {
        const wanted: Wanted = { ...input, matches: input.matches ?? [], id: makeId('w'), createdAt: Date.now(), status: 'open' };
        mutate((d) => ({ ...d, wanted: [wanted, ...d.wanted] }));
        return wanted;
      },
      updateWanted: (id, patch) => mutate((d) => ({ ...d, wanted: d.wanted.map((w) => w.id === id ? { ...w, ...patch } : w) })),
      publishListing: (listing, host, declaredValue) => mutate((d) => ({
        ...d,
        myListings: [listing, ...(d.myListings ?? [])],
        declaredValues: { ...(d.declaredValues ?? {}), [listing.id]: declaredValue },
        hostListings: [{ ...host, listingId: listing.id }, ...d.hostListings],
      })),
      updateHostListing: (listingId, patch) => mutate((d) => ({ ...d, hostListings: d.hostListings.map((h) => h.listingId === listingId ? { ...h, ...patch } : h) })),
      addClaim: (input) => {
        const claim: Claim = { ...input, id: makeId('cl'), ref: makeRef('CL'), createdAt: Date.now(), status: 'submitted', activity: [{ at: Date.now(), who: 'You', text: `Claim submitted${input.evidence.length ? ` with ${input.evidence.length} ${input.evidence.length === 1 ? 'photo' : 'photos'}` : ''}.` }] };
        mutate((d) => ({ ...d, claims: [claim, ...d.claims] }));
        return claim;
      },
      addTicket: (input) => {
        const ticket: Ticket = { ...input, id: makeId('tk'), ref: makeRef('SP'), createdAt: Date.now(), status: 'open', activity: [{ at: Date.now(), who: 'You', text: input.details }] };
        mutate((d) => ({ ...d, tickets: [ticket, ...d.tickets] }));
        return ticket;
      },
      addCaseReply: (kind, id, entry) => mutate((d) => kind === 'claim'
        ? { ...d, claims: d.claims.map((c) => c.id === id ? { ...c, activity: [...c.activity, { ...entry, at: Date.now() }] } : c) }
        : { ...d, tickets: d.tickets.map((t) => t.id === id ? { ...t, activity: [...t.activity, { ...entry, at: Date.now() }] } : t) }),
      resetDemo: () => { setState({ user: state.user, data: createSeed() }); setAuctionsState(createDemoAuctions()); notify('Demo data reset.'); },

      unreadMessages: data.conversations.reduce((sum, c) => sum + c.unread, 0),
      unreadNotices: data.notices.filter((n) => !n.read).length,
    };
  }, [state, toast, checkoutDraft, auctions, mutate, notify]);

  return <DemoContext.Provider value={store}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoStore {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo must be used inside <DemoProvider>.');
  return value;
}
