import type { Category, Listing } from '../../data';
import { makeId, shiftDays } from '../model';
import type { HostListing, Profile } from '../model';

export type ListingCategory = Exclude<Category, 'All gear'>;

export interface CategoryMeta {
  value: ListingCategory;
  hint: string;
  /** Used as the cover until the owner adds their own photo. */
  sample: string;
  /** Suggested daily price band for similar gear nearby. */
  band: [number, number];
  /** Typical replacement value, used to prefill the protection field. */
  typicalValue: number;
  suggestions: string[];
}

export const CATEGORY_META: CategoryMeta[] = [
  { value: 'Outdoors', hint: 'Tents, bikes, packs, trail gear', sample: '/images/camp.jpg', band: [15, 40], typicalValue: 350, suggestions: ['Carry bag', 'Setup guide', 'Repair kit', 'Headlamp', 'Water bottle'] },
  { value: 'Cameras', hint: 'Cameras, lenses, drones, lighting', sample: '/images/camera.jpg', band: [20, 60], typicalValue: 900, suggestions: ['Two batteries', 'Charger', 'Memory card', 'Lens cap', 'Padded case'] },
  { value: 'Tools', hint: 'Drills, saws, ladders, washers', sample: '/images/tools.jpg', band: [8, 25], typicalValue: 220, suggestions: ['Bits set', 'Charger', 'Safety glasses', 'Carry case', 'Extension cord'] },
  { value: 'On the water', hint: 'Paddleboards, kayaks, coolers', sample: '/images/kayak.jpg', band: [25, 50], typicalValue: 600, suggestions: ['Paddle', 'Life jacket', 'Leash', 'Pump', 'Dry bag'] },
  { value: 'Celebrations', hint: 'Party kits, speakers, décor', sample: '/images/party.jpg', band: [15, 40], typicalValue: 300, suggestions: ['String lights', 'Speaker', 'Table linens', 'Extension cord', 'Setup help'] },
];

export const metaFor = (category: ListingCategory) => CATEGORY_META.find((entry) => entry.value === category) ?? CATEGORY_META[0];

export interface ListingDraft {
  category: ListingCategory | null;
  photos: string[];
  title: string;
  description: string;
  includes: string[];
  condition: 'Like new' | 'Great' | 'Good';
  declaredValue: number;
  price: number;
  weeklyDiscount: number;
  monthlyDiscount: number;
  instantBook: boolean;
  minDays: number;
}

export const emptyDraft = (): ListingDraft => ({
  category: null, photos: [], title: '', description: '', includes: [], condition: 'Great', declaredValue: 0,
  price: 0, weeklyDiscount: 10, monthlyDiscount: 25, instantBook: false, minDays: 1,
});

const DRAFT_KEY = 'ybuy-listing-draft-v1';

export function loadDraft(): ListingDraft {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (raw) return { ...emptyDraft(), ...(JSON.parse(raw) as Partial<ListingDraft>) };
  } catch { /* unreadable draft: start fresh */ }
  return emptyDraft();
}

export function saveDraft(draft: ListingDraft): void {
  try { window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {
    // Photos can exceed the storage quota; keep the text so the member does not lose their work.
    try { window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, photos: [] })); } catch { /* storage unavailable */ }
  }
}

export function clearDraft(): void {
  try { window.sessionStorage.removeItem(DRAFT_KEY); } catch { /* storage unavailable */ }
}

/** Lets the quick "Share your gear" panel hand a title and price to the full flow. */
export function seedDraft(title: string, price: number): void {
  saveDraft({ ...loadDraft(), title, price });
}

export const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

/** Downscales a photo to a ~1200px JPEG data URL so drafts stay small enough for session storage. */
export function compressPhoto(file: File, maxSide = 1200, quality = 0.78): Promise<string> {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('Choose an image file (JPG, PNG, HEIC or WebP).'));
  if (file.size > MAX_PHOTO_BYTES) return Promise.reject(new Error('Each photo must be smaller than 15 MB.'));
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext('2d');
      URL.revokeObjectURL(url);
      if (!context) { reject(new Error('Your browser could not process that photo.')); return; }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That photo could not be read. Try another one.')); };
    image.src = url;
  });
}

export type StepIssue = string | null;

/** Validation per step; returns the first problem or null when the step is complete. */
export function validateStep(step: number, draft: ListingDraft): StepIssue {
  if (step === 0 && !draft.category) return 'Choose a category to continue.';
  if (step === 2) {
    if (draft.title.trim().length < 6) return 'Give your listing a title of at least 6 characters.';
    if (draft.description.trim().length < 30) return 'Add a short description (at least 30 characters) so renters know what to expect.';
    if (!Number.isFinite(draft.declaredValue) || draft.declaredValue < 20 || draft.declaredValue > 20000) return 'Enter a replacement value between $20 and $20,000.';
  }
  if (step === 3) {
    if (!Number.isInteger(draft.price) || draft.price < 1 || draft.price > 1000) return 'Set a daily price between $1 and $1,000.';
  }
  return null;
}

/** Owner choices for a live auction offered once a listing is live. */
export interface AuctionChoice {
  startBid: number;
  hours: number;
  rentalStart: string;
  rentalEnd: string;
}

export const defaultAuctionChoice = (startBid: number): AuctionChoice => ({ startBid, hours: 24, rentalStart: shiftDays(7), rentalEnd: shiftDays(9) });

/** Returns a user-facing issue with the auction setup, or null when it can start. */
export function validateAuctionChoice(choice: AuctionChoice, price: number): StepIssue {
  if (!Number.isInteger(choice.startBid) || choice.startBid < 1 || choice.startBid >= price) return `Set a starting bid between $1 and $${Math.max(1, price - 1)} so bidding has room to climb.`;
  if (!choice.rentalStart || !choice.rentalEnd || choice.rentalStart <= shiftDays(Math.ceil(choice.hours / 24)) || choice.rentalEnd < choice.rentalStart) return 'Rental dates must start after the auction closes.';
  return null;
}

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'listing';

/** Turns a completed draft into a marketplace listing plus its hosting settings. */
export function buildListing(draft: ListingDraft, owner: Profile): { listing: Listing; host: Omit<HostListing, 'listingId'> } {
  const category = draft.category ?? 'Outdoors';
  const meta = metaFor(category);
  const listing: Listing = {
    id: makeId(`my-${slug(draft.title)}`),
    title: draft.title.trim(),
    category,
    image: draft.photos[0] ?? meta.sample,
    imageAlt: `${draft.title.trim()}, shared by ${owner.firstName}`,
    price: draft.price,
    rating: 0,
    reviews: 0,
    distance: 0.3,
    owner: owner.firstName,
    initials: `${owner.firstName[0] ?? ''}${owner.lastName[0] ?? ''}`.toUpperCase(),
    description: draft.description.trim(),
    includes: draft.includes.length ? draft.includes : ['Everything shown in the photos'],
    tag: 'New listing',
    gallery: draft.photos.length > 1 ? draft.photos : undefined,
    condition: draft.condition,
  };
  return {
    listing,
    host: { paused: false, price: draft.price, weeklyDiscount: draft.weeklyDiscount, monthlyDiscount: draft.monthlyDiscount, blocked: [], instantBook: draft.instantBook, minDays: draft.minDays },
  };
}
