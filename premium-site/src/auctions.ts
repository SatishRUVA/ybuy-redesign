import { listings } from './data';
import type { Listing } from './data';

export interface Auction {
  id: string;
  title: string;
  listing: Listing;
  currentBid: number;
  bids: number;
  watchers: number;
  startedAt: number;
  endsAt: number;
  /** Set after a local demo bid so the card can show the leading state. */
  youLead?: boolean;
  /** Owner-created auctions only: who hosts it, the lowest accepted daily bid, and the rental window up for bid. */
  hostId?: string;
  reservePrice?: number;
  rentalStart?: string;
  rentalEnd?: string;
}

export const HOST_AUCTION_PREFIX = 'host-auction-';
export const AUCTION_DURATIONS = [
  { hours: 1, label: '1 hour' }, { hours: 6, label: '6 hours' }, { hours: 24, label: '24 hours' }, { hours: 72, label: '3 days' },
] as const;

export const isHostAuction = (auction: Pick<Auction, 'id'>) => auction.id.startsWith(HOST_AUCTION_PREFIX);
/** Owners never rent below 65% of their usual daily price through an auction. */
export const reserveFor = (dailyPrice: number) => Math.max(1, Math.round(dailyPrice * 0.65));
export const suggestedStartBid = (dailyPrice: number) => Math.max(1, Math.round(dailyPrice * 0.5));
export const durationLabel = (hours: number) => AUCTION_DURATIONS.find((entry) => entry.hours === hours)?.label ?? `${hours} hours`;

export interface AuctionSetup {
  listing: Listing;
  startBid: number;
  hours: number;
  rentalStart: string;
  rentalEnd: string;
  /** Delay before bidding opens; 0 starts the auction immediately. */
  startsInMs?: number;
  /** Defaults to 65% of the listing's daily price. */
  reservePrice?: number;
}

export function createHostAuction(setup: AuctionSetup, hostId: string, now = Date.now()): Auction {
  const startedAt = now + Math.max(0, setup.startsInMs ?? 0);
  return {
    id: `${HOST_AUCTION_PREFIX}${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    title: setup.listing.title, listing: setup.listing,
    currentBid: setup.startBid, bids: 0, watchers: 0,
    startedAt, endsAt: startedAt + setup.hours * 3600000,
    hostId, reservePrice: setup.reservePrice ?? reserveFor(setup.listing.price), rentalStart: setup.rentalStart, rentalEnd: setup.rentalEnd,
  };
}

export const ENDING_SOON_MS = 10 * 60000;

export function createDemoAuctions(now = Date.now()): Auction[] {
  const titles = ['A weekend camping kit', 'The camera-day bundle', 'A bike for the long way home', 'A morning on the water', 'The DIY weekend set', 'Dinner under the lights', 'Your next trail companion', 'A portrait afternoon', 'The family photo kit', 'One unforgettable gathering'];
  const minutesLeft = [6, 9, 14, 19, 26, 34, 43, 55, 68, 82];
  return titles.map((title, index) => ({
    id: `auction-${index + 1}`, title, listing: listings[index % listings.length],
    currentBid: [18, 30, 24, 22, 8, 16, 10, 14, 26, 20][index],
    bids: [6, 12, 8, 4, 9, 7, 3, 5, 10, 11][index],
    watchers: [14, 22, 11, 9, 17, 8, 6, 12, 15, 19][index],
    startedAt: now - 30 * 60000,
    endsAt: now + minutesLeft[index] * 60000,
  }));
}

/** Percentage below the listing's usual daily price; never negative. */
export function stealPercent(bid: number, usual: number): number {
  if (!Number.isFinite(bid) || !Number.isFinite(usual) || usual <= 0) return 0;
  return Math.max(0, Math.round((1 - bid / usual) * 100));
}

/** Remaining share of the auction window, clamped to 0..1. */
export function timeShare(auction: Pick<Auction, 'startedAt' | 'endsAt'>, now: number): number {
  const total = auction.endsAt - auction.startedAt;
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (auction.endsAt - now) / total));
}

export function auctionTime(remaining: number): string {
  if (remaining <= 0) return 'Ended';
  const seconds = Math.ceil(remaining / 1000);
  return `${Math.floor(seconds / 3600).toString().padStart(2, '0')}:${Math.floor(seconds % 3600 / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
