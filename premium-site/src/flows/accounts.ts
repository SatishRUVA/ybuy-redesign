import type { AccountRole, AuthProvider, Profile } from './model';

/**
 * Local demo accounts for the UI preview: 10 users, 10 renters, 10 owners.
 *
 * These are fictional fixtures for clicking through the prototype only. Emails use the
 * reserved `.test` domain so they can never reach a real inbox. Once Supabase is wired
 * up, replace this module with a seed script and real auth; never ship shared passwords.
 */
export const DEMO_PASSWORD = 'YBuy#Demo2026';

export const ROLE_LABELS: Record<AccountRole, { title: string; plural: string; blurb: string }> = {
  user: { title: 'User', plural: 'Users', blurb: 'New members browsing and saving gear' },
  renter: { title: 'Renter', plural: 'Renters', blurb: 'Verified neighbors who borrow often' },
  owner: { title: 'Owner', plural: 'Owners', blurb: 'Hosts who list and lend their gear' },
};

/** [first, last, city, interests, bio, rentals, rating, reviews, memberSince, verification flags: phone/id/payment] */
type Seed = [string, string, string, string[], string, number, number, number, string, [boolean, boolean, boolean]];

const USERS: Seed[] = [
  ['Olivia', 'Bennett', 'Dallas, TX', ['Outdoors', 'Events'], 'Just moved to Dallas and looking for weekend plans.', 0, 0, 0, '2026', [true, false, false]],
  ['Ethan', 'Brooks', 'Plano, TX', ['Cameras'], 'Learning photography one weekend at a time.', 1, 5, 1, '2026', [true, false, true]],
  ['Sofia', 'Martinez', 'Irving, TX', ['Celebrations', 'DIY'], 'Planning my sister’s backyard engagement party.', 0, 0, 0, '2026', [false, false, false]],
  ['Noah', 'Patel', 'Frisco, TX', ['Cycling', 'Hiking'], 'Curious about gravel riding before I buy a bike.', 2, 4.9, 2, '2025', [true, true, false]],
  ['Ava', 'Thompson', 'Arlington, TX', ['Water sports'], 'Lake days are my favorite days.', 0, 0, 0, '2026', [true, false, false]],
  ['Liam', 'Nguyen', 'Richardson, TX', ['DIY', 'Tools'], 'First-time homeowner with a long project list.', 1, 5, 1, '2026', [true, false, true]],
  ['Mia', 'Johnson', 'Garland, TX', ['Camping', 'Music'], 'Weekend camper, festival fan.', 0, 0, 0, '2026', [false, false, false]],
  ['Lucas', 'Garcia', 'Grapevine, TX', ['Photography', 'Hiking'], 'Saving up for a camera, renting until then.', 2, 4.8, 2, '2025', [true, true, true]],
  ['Chloe', 'Davis', 'Coppell, TX', ['Events'], 'I host the family holidays every year.', 0, 0, 0, '2026', [true, false, false]],
  ['Mason', 'Lee', 'Carrollton, TX', ['Outdoors', 'Cycling'], 'Trying a little more outside this year.', 1, 5, 1, '2026', [true, false, false]],
];

const RENTERS: Seed[] = [
  ['Jordan', 'Hayes', 'Irving, TX', ['Camping', 'Hiking'], 'Out on the trail most weekends. I return gear cleaner than I found it.', 18, 4.97, 15, '2023', [true, true, true]],
  ['Emma', 'Wilson', 'Dallas, TX', ['Photography', 'Events'], 'Freelance photographer who rents lenses for special shoots.', 32, 4.99, 29, '2022', [true, true, true]],
  ['Daniel', 'Kim', 'Plano, TX', ['Cycling'], 'Gravel and road rides around North Texas.', 11, 4.92, 9, '2024', [true, true, true]],
  ['Grace', 'Turner', 'Las Colinas, TX', ['Water sports', 'Outdoors'], 'Paddleboarding at sunrise whenever I can.', 9, 5, 8, '2024', [true, true, true]],
  ['Ryan', 'Cooper', 'Fort Worth, TX', ['DIY', 'Tools'], 'Weekend renovator. Always careful with tools.', 24, 4.95, 21, '2023', [true, true, true]],
  ['Zoe', 'Mitchell', 'Frisco, TX', ['Events', 'Music'], 'Event planner borrowing décor and sound gear.', 38, 4.98, 34, '2022', [true, true, true]],
  ['Isaac', 'Moore', 'Denton, TX', ['Camping', 'Photography'], 'Astrophotography trips out west.', 7, 4.9, 6, '2025', [true, true, true]],
  ['Hannah', 'Clark', 'Addison, TX', ['Hiking', 'Outdoors'], 'Planning my first backpacking trip.', 4, 5, 4, '2025', [true, true, true]],
  ['Owen', 'Reed', 'Euless, TX', ['Water sports', 'Camping'], 'Lake weekends with the family.', 13, 4.94, 12, '2024', [true, true, true]],
  ['Lily', 'Foster', 'Southlake, TX', ['Photography', 'Celebrations'], 'Documenting every family celebration.', 15, 4.96, 13, '2023', [true, true, true]],
];

/** The first seven match listing owners in data.ts, so their public profiles show their gear. */
const OWNERS: Seed[] = [
  ['Maya', 'Kim', 'Irving, TX', ['Camping', 'Outdoors'], 'Our camping kit has seen a dozen state parks. Happy to share tips.', 64, 4.98, 24, '2022', [true, true, true]],
  ['Andre', 'Lewis', 'Irving, TX', ['Photography'], 'Photographer. My cameras deserve more time out of the bag.', 52, 4.96, 18, '2022', [true, true, true]],
  ['Sam', 'Carter', 'Dallas, TX', ['Cycling'], 'Bike mechanic on weekends. Every bike leaves tuned.', 77, 4.99, 31, '2021', [true, true, true]],
  ['Priya', 'Shah', 'Grapevine, TX', ['Water sports'], 'Lake Grapevine regular. Boards come with a dry bag.', 41, 4.95, 16, '2023', [true, true, true]],
  ['Nina', 'Park', 'Irving, TX', ['DIY', 'Tools'], 'Retired contractor sharing a well-kept tool wall.', 90, 4.97, 27, '2021', [true, true, true]],
  ['Leo', 'Diaz', 'Coppell, TX', ['Events', 'Celebrations'], 'Party kits for every kind of get-together.', 36, 4.94, 12, '2023', [true, true, true]],
  ['Jamie', 'Wong', 'Lewisville, TX', ['Photography', 'Hiking'], 'Lenses and trail gear, cleaned after every rental.', 44, 4.93, 14, '2023', [true, true, true]],
  ['Marcus', 'Hill', 'Arlington, TX', ['Camping', 'Tools'], 'Overlanding gear and a garage full of good tools.', 58, 4.96, 22, '2022', [true, true, true]],
  ['Rosa', 'Alvarez', 'Dallas, TX', ['Music', 'Events'], 'Sound systems and lighting for backyard shows.', 29, 4.92, 11, '2024', [true, true, true]],
  ['Ben', 'Okafor', 'Plano, TX', ['Cycling', 'Water sports'], 'E-bikes and kayaks, ready for your weekend.', 47, 4.97, 19, '2022', [true, true, true]],
];

export interface DemoAccount { role: AccountRole; email: string; password: string; profile: Profile }

function toAccount(role: AccountRole, seed: Seed, index: number): DemoAccount {
  const [firstName, lastName, location, interests, bio, rentals, rating, reviewsCount, memberSince, [phoneVerified, idVerified, paymentAdded]] = seed;
  const email = `${firstName}.${lastName}@${role}.ybuy.test`.toLowerCase();
  const number = String(index + 1).padStart(2, '0');
  return {
    role,
    email,
    password: DEMO_PASSWORD,
    profile: {
      id: `usr-${role}-${number}`, role, firstName, lastName, legalName: `${firstName} ${lastName}`, email,
      phone: `+1 (214) 555-${role === 'user' ? '01' : role === 'renter' ? '02' : '03'}${number}`,
      phoneVerified, emailVerified: true, idVerified, paymentAdded, photo: '', bio, interests, location,
      radius: role === 'owner' ? 10 : 5, dateOfBirth: `19${85 + (index % 12)}-0${(index % 9) + 1}-1${index % 9}`, memberSince,
      provider: 'email', rating, reviewsCount, rentals,
    },
  };
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  ...USERS.map((seed, index) => toAccount('user', seed, index)),
  ...RENTERS.map((seed, index) => toAccount('renter', seed, index)),
  ...OWNERS.map((seed, index) => toAccount('owner', seed, index)),
];

export function findDemoAccount(email: string): DemoAccount | undefined {
  const needle = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((account) => account.email === needle);
}

/** Returns a fresh copy of the profile when the credentials match, otherwise null. */
export function verifyDemoLogin(email: string, password: string): Profile | null {
  const account = findDemoAccount(email);
  if (!account || password !== DEMO_PASSWORD) return null;
  return { ...account.profile, interests: [...account.profile.interests] };
}

/** Social buttons sign in as the matching demo account when the email is known. */
export function profileForProvider(email: string | undefined, provider: AuthProvider): Profile | null {
  const account = email ? findDemoAccount(email) : undefined;
  return account ? { ...account.profile, provider, interests: [...account.profile.interests] } : null;
}
