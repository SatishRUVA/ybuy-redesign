export const categories = ['All gear', 'Outdoors', 'Cameras', 'Tools', 'On the water', 'Celebrations'] as const;
export type Category = typeof categories[number];
export type Sort = 'Recommended' | 'Price: low to high' | 'Closest first';

export interface Listing {
  id: string;
  title: string;
  category: Category;
  image: string;
  imageAlt: string;
  price: number;
  rating: number;
  reviews: number;
  distance: number;
  owner: string;
  initials: string;
  description: string;
  includes: string[];
  tag?: string;
  /** Extra photos for member-published listings; `image` stays the cover. */
  gallery?: string[];
  condition?: 'Like new' | 'Great' | 'Good';
}

export const listings: Listing[] = [
  {
    id: 'weekend-camp', title: 'A weekend under the stars', category: 'Outdoors',
    image: '/images/camp.jpg', imageAlt: 'A forest seen from inside a camping tent',
    price: 28, rating: 4.98, reviews: 24, distance: 0.8, owner: 'Maya', initials: 'MK',
    description: 'A thoughtfully packed two-person camping kit. Just choose a spot, make a little room in your car, and head out for a slower weekend.',
    includes: ['Two-person tent', 'Two sleeping pads', 'Camp lantern', 'Easy setup guide'], tag: 'Guest favorite',
  },
  {
    id: 'sony-camera', title: 'Capture something worth keeping', category: 'Cameras',
    image: '/images/camera.jpg', imageAlt: 'A camera and lenses arranged on a dark surface',
    price: 42, rating: 4.96, reviews: 18, distance: 1.2, owner: 'Andre', initials: 'AL',
    description: 'A mirrorless camera and versatile lens for the family gathering, the day trip, or simply seeing your neighborhood a little differently.',
    includes: ['Mirrorless camera', '35mm lens', 'Two batteries', 'Memory card'], tag: 'Popular this week',
  },
  {
    id: 'gravel-bike', title: 'Take the scenic route', category: 'Outdoors',
    image: '/images/bike.jpg', imageAlt: 'A bicycle ready for a leisurely ride',
    price: 35, rating: 4.99, reviews: 31, distance: 2.4, owner: 'Sam', initials: 'SC',
    description: 'A comfortable, well-maintained bike for discovering the trail you always drive past. A helmet and a small repair kit come along for the ride.',
    includes: ['Medium-size bicycle', 'Helmet', 'Repair kit', 'Water bottle cage'], tag: 'Guest favorite',
  },
  {
    id: 'lake-paddleboard', title: 'A little closer to the water', category: 'On the water',
    image: '/images/kayak.jpg', imageAlt: 'A child on a paddleboard beside a wooded lakeshore',
    price: 32, rating: 4.95, reviews: 16, distance: 31.5, owner: 'Priya', initials: 'PS',
    description: 'A paddleboard for a quiet morning on the lake. Easy to carry, simple to inflate, and made for the kind of day you do not want to rush.',
    includes: ['Paddleboard', 'Adjustable paddle', 'Life jacket and leash', 'Pump and carry bag'],
  },
  {
    id: 'home-project', title: 'For the project on your list', category: 'Tools',
    image: '/images/tools.jpg', imageAlt: 'A person holding a cordless drill for a home project',
    price: 12, rating: 4.97, reviews: 27, distance: 1.6, owner: 'Nina', initials: 'NP',
    description: 'A cordless drill set that makes a small home project feel manageable. Charged batteries, useful bits, and a neighbor happy to explain the basics.',
    includes: ['Cordless drill', 'Two batteries', 'Bit assortment', 'Protective case'],
  },
  {
    id: 'garden-party', title: 'Bring everyone together', category: 'Celebrations',
    image: '/images/party.jpg', imageAlt: 'A beautifully set indoor banquet table',
    price: 24, rating: 4.94, reviews: 12, distance: 7.4, owner: 'Leo', initials: 'LD',
    description: 'A simple gathering kit for a backyard dinner. Good lighting and a few considered details turn an ordinary evening into a reason to get together.',
    includes: ['String lights', 'Table linen', 'Serving trays', 'Battery candles'],
  },
  {
    id: 'trail-backpack', title: 'Pack light. Go a little further.', category: 'Outdoors',
    image: '/images/hike.jpg', imageAlt: 'A hiker exploring a green mountain trail',
    price: 16, rating: 4.98, reviews: 21, distance: 1.9, owner: 'Alex', initials: 'AR',
    description: 'A comfortable trail pack for a day outside. Enough room for the essentials, without the weight of everything you do not need.',
    includes: ['30-liter backpack', 'Rain cover', 'Trekking poles', 'Trail guide'],
  },
  {
    id: 'photo-day', title: 'Find your next perspective', category: 'Cameras',
    image: '/images/lens.jpg', imageAlt: 'A camera lens photographed in soft natural light',
    price: 22, rating: 4.93, reviews: 14, distance: 16.2, owner: 'Jamie', initials: 'JW',
    description: 'A portrait lens for slowing down and looking closely. Ideal for an afternoon of portraits or the small details of a place you love.',
    includes: ['Portrait lens', 'Lens hood', 'Cleaning cloth', 'Padded bag'],
  },
];

export interface Filters {
  query: string;
  category: Category;
  maxPrice: number;
  sort: Sort;
  favoritesOnly: boolean;
  favorites: readonly string[];
  /** Miles from the searcher; 
ull/omitted means any distance. */
  maxDistance?: number | null;
}

export function filterListings(items: readonly Listing[], filters: Filters): Listing[] {
  const query = filters.query.trim().toLowerCase();
  const filtered = items.filter((item) =>
    (filters.category === 'All gear' || item.category === filters.category)
    && item.price <= filters.maxPrice
    && (filters.maxDistance == null || item.distance <= filters.maxDistance)
    && (!filters.favoritesOnly || filters.favorites.includes(item.id))
    && (!query || `${item.title} ${item.category} ${item.description} ${item.includes.join(' ')}`.toLowerCase().includes(query)),
  );
  if (filters.sort === 'Price: low to high') return filtered.sort((a, b) => a.price - b.price);
  if (filters.sort === 'Closest first') return filtered.sort((a, b) => a.distance - b.distance);
  return filtered;
}

export function rentalTotal(price: number, start: string, end: string): { days: number; total: number } | null {
  if (!Number.isFinite(price) || price < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return null;
  const first = Date.parse(`${start}T00:00:00Z`);
  const last = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(first) || !Number.isFinite(last) || last <= first) return null;
  if (new Date(first).toISOString().slice(0, 10) !== start || new Date(last).toISOString().slice(0, 10) !== end) return null;
  const days = Math.round((last - first) / 86400000);
  return { days, total: price * days };
}
