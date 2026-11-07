# YBuy premium concept

An independent, mobile-first UI prototype. The original project and this concept
have separate entry points, styles, dependencies, and ports.

## Run

From the repository root:

```powershell
pnpm --dir premium-site install --frozen-lockfile
pnpm --dir premium-site dev
```

Open <http://localhost:5176>.

For the production preview and validation:

```powershell
pnpm --dir premium-site build
pnpm --dir premium-site preview
pnpm --dir premium-site exec playwright install chromium
pnpm --dir premium-site test
```

Tests start a production preview on port 5177. Port 5176 remains available for
review. Stop a manually started server with Ctrl+C. Rebuild before previewing
source edits.

## Scope

- Home, searchable category discovery, saved collection, rental detail, and 404 UI.
- Search, city/date selection, price filters, sorting, favorites, and request preview.
- Custom range calendars in search and rental details, with keyboard navigation,
  month controls, past-date blocking, and pickup/return highlighting.
- Ten simulated live rental auctions, ticking countdowns, local demo bids, and a
  horizontal auto-scroll rail. Pause/resume and previous/next controls are available.
- Each auction's **Disappear** demo turns it into cloud puffs before removal.
  Reduced motion removes immediately. Restore demo repopulates all ten auctions.
- Inline search (no popup): type what you need, pick a location, dates, and a
  distance (5 mi by default; 10, 25, 50 mi, or any distance).
- Location is never requested while browsing. It is asked only on serious intent
  (search, bid, reserve, closest-first sort). If permission is denied, the location
  field is highlighted so the user can type a city or ZIP.
- Keyboard-operable dialogs with focus trapping and reduced-motion support.

### Demo flows (UI only)

Each flow is a lazily loaded chunk under `src/flows/<flow>/`.

| Flow | Routes |
| --- | --- |
| Sign in, reset password, sign-up wizard (legal name, phone OTP `246810`, photo, location, bio, completion) | `/signin`, `/signin/reset`, `/signup` |
| Checkout and confirmation | `/checkout`, `/checkout/done/:bookingId` |
| Trips, trip detail, reviews, wanted requests | `/trips`, `/trips/:id`, `/trips/:id/review`, `/wanted`, `/wanted/new`, `/wanted/:id` |
| Pickup and return handoff | `/trips/:id/pickup`, `/trips/:id/return` |
| Messaging and notifications | `/inbox`, `/inbox/:id`, `/notifications`, `/notifications/settings` |
| Hosting, listing management, owner auctions, wallet | `/hosting`, `/hosting/listings/:id`, `/hosting/auctions`, `/wallet` |
| Create a listing (category, photos, details, pricing, review, publish; then optionally open a live auction) | `/hosting/new` |
| Auction detail and bidding | `/auctions/:id` |
| Account hub, profile edit, verification, settings, public profiles, item passport | `/profile`, `/profile/edit`, `/profile/verify`, `/profile/settings`, `/people/:name`, `/passport/:listingId` |
| Protection and claims | `/protection`, `/claims`, `/claims/new`, `/claims/:id` |
| Help center, tickets, guidelines, legal | `/help`, `/help/new`, `/help/tickets/:id`, `/guidelines`, `/terms`, `/privacy` |

- All accounts, bookings, messages, payments, and claims are simulated. Demo state
  is kept in `sessionStorage` (`ybuy-premium-demo-v1`) and clears when the tab closes.
  "Reset demo data" is available in the account hub.
- No Supabase, real payments, real identity checks, or live availability.
- Prices, reviews, names, and verification indicators are fictional, explicitly
  labeled sample data.
- The prototype is intentionally `noindex`; deployment and SEO are out of scope
  until the design is approved. No credentials or environment configuration needed.

### Demo accounts (local login)

There are 30 fictional accounts in `src/flows/accounts.ts`: 10 users, 10 renters and 10
owners. They all share the password **`YBuy#Demo2026`**. To use one, open `/signin`, expand
**Try a demo account** and tap a row, or type the email and password.

| Role | Email pattern | Profile |
| --- | --- | --- |
| User | `first.last@user.ybuy.test` (e.g. `olivia.bennett@user.ybuy.test`) | New members with mixed verification and little rental history |
| Renter | `first.last@renter.ybuy.test` (e.g. `jordan.hayes@renter.ybuy.test`) | Fully verified, with frequent rentals and reviews |
| Owner | `first.last@owner.ybuy.test` (e.g. `maya.kim@owner.ybuy.test`) | Fully verified hosts; Maya, Andre, Sam, Priya, Nina, Leo and Jamie own the sample listings |

Some notes on how this works:
- An unknown email or a wrong password shows an error.
- Social buttons sign in as a demo account if its email is already typed in; otherwise they use a sample profile.
- Accounts created with sign up last only for the current browser session.
- The `.test` domain is reserved, so these addresses can never reach a real inbox.
- This is a fixture for the prototype only. Replace it with Supabase Auth and a seed script during integration.

## Design

The design borrows travel-marketplace clarity and Apple-like restraint rather
than copying either brand. System typography, white/mist surfaces, pine accents,
rounded photography, and quiet touch/hover feedback keep gear and planning central.
The auction rail pauses on hover, keyboard focus, touch, hidden tabs, or reduced
motion. Page scrolling is never intercepted. The cloud removal is a bounded,
user-triggered GSAP animation, not a continuous background effect.

Alternatives considered were a gadget-like object showroom and a neighborhood
editorial journal. The chosen direction, "a little getaway, close to home," is more
intuitive for a broad rental audience and works equally well on mobile.

Skiper UI (<https://skiper-ui.com>) and Vengeance UI
(<https://www.vengenceui.com>) are interaction references. This implementation
does not import their proprietary components. It uses original CSS interactions,
GSAP page entrances, and Radix accessible dialogs. Licensed component integration
can be considered after selecting the design.

## Placeholder photography

All photos are illustrative, locally stored placeholders, not actual inventory.
Sources are public Unsplash image CDN assets, except the tools image from Pexels.
Replace them with approved, authentic inventory before launch.
Source licensing: <https://unsplash.com/license> and
<https://www.pexels.com/license/>. Verify permissions for the intended final use.

- Sign-in panel: Unsplash `photo-1470770841072-f978cf4d019e` (`escape.jpg`)
- Home hero showcase (`public/images/hero/`, 1800w and 900w each), each slide linked to a real listing:
  - Camping: Unsplash `photo-1478131143081-80f7f84ca84d`
  - On the water: Unsplash `photo-1517176118179-65244903d13c`
  - Photography: Unsplash `photo-1452587925148-ce544e77e70d`
  - Celebrations: Unsplash `photo-1519671482749-fd09be7ccebf`
- Camping: Unsplash `photo-1504280390367-361c6d9f38f4`
- Camera: Unsplash `photo-1516035069371-29a1b244cc32`
- Bicycle: Unsplash `photo-1485965120184-e220f721d03e`
- Water: Unsplash `photo-1472745942893-4b9f730c7668`
- Celebration: Unsplash `photo-1511795409834-ef04bbd61622`
- Hiking: Unsplash `photo-1551632811-561732d1e306`
- Lens: Unsplash `photo-1617005082133-548c4dd27f35`
- Tools: <https://www.pexels.com/photo/5974365/>

## Integration boundary

Mock inventory and pure filtering/pricing helpers live in `src/data.ts`.
Demo domain types, pricing (`quoteFor`), and seed data live in `src/flows/model.ts`;
all mutations go through the `useDemo()` store in `src/flows/store.tsx`. Replacing the
store's actions with Supabase calls is the integration seam: pages do not touch storage
directly. Routing is a small History API helper in `src/router.ts`, and the route
table is `src/flows/routes.tsx`. No existing application providers or styles
are imported, so approving this concept does not require migrating backend code.
