import { lazy, Suspense } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import { matchRoute } from '../router';

type Params = Record<string, string>;
type Page = LazyExoticComponent<ComponentType<{ params: Params }>>;

/** Lazily loads one named export so each flow ships as its own chunk. */
function page<M>(loader: () => Promise<M>, name: keyof M): Page {
  return lazy(async () => ({ default: (await loader())[name] as ComponentType<{ params: Params }> }));
}

const auth = () => import('./auth/AuthPages');
const profile = () => import('./profile/ProfilePages');
const checkout = () => import('./checkout/CheckoutPages');
const trips = () => import('./trips/TripsPages');
const inbox = () => import('./inbox/InboxPages');
const notifications = () => import('./notifications/NotificationsPages');
const handoff = () => import('./handoff/HandoffPages');
const hosting = () => import('./hosting/HostingPages');
const createListing = () => import('./hosting/CreateListingPage');
const wallet = () => import('./wallet/WalletPages');
const auctions = () => import('./auctions/AuctionPages');
const protection = () => import('./protection/ProtectionPages');
const support = () => import('./support/SupportPages');

/** Order matters: more specific patterns first. */
const ROUTES: [string, Page][] = [
  ['/signin', page(auth, 'SignInPage')],
  ['/signin/reset', page(auth, 'ResetPasswordPage')],
  ['/signup', page(auth, 'SignUpPage')],

  ['/profile', page(profile, 'AccountHubPage')],
  ['/profile/edit', page(profile, 'EditProfilePage')],
  ['/profile/verify', page(profile, 'VerificationPage')],
  ['/profile/settings', page(profile, 'SettingsPage')],
  ['/people/:name', page(profile, 'PublicProfilePage')],
  ['/passport/:listingId', page(profile, 'PassportPage')],

  ['/checkout', page(checkout, 'CheckoutPage')],
  ['/checkout/done/:bookingId', page(checkout, 'ConfirmationPage')],

  ['/trips', page(trips, 'TripsPage')],
  ['/trips/:id', page(trips, 'TripDetailPage')],
  ['/trips/:id/review', page(trips, 'ReviewPage')],
  ['/trips/:id/pickup', page(handoff, 'PickupPage')],
  ['/trips/:id/return', page(handoff, 'ReturnPage')],
  ['/wanted', page(trips, 'WantedPage')],
  ['/wanted/new', page(trips, 'NewWantedPage')],
  ['/wanted/:id', page(trips, 'WantedDetailPage')],

  ['/inbox', page(inbox, 'InboxPage')],
  ['/inbox/:id', page(inbox, 'InboxPage')],
  ['/notifications', page(notifications, 'NotificationsPage')],
  ['/notifications/settings', page(notifications, 'NotificationSettingsPage')],

  ['/hosting', page(hosting, 'HostingPage')],
  ['/hosting/new', page(createListing, 'CreateListingPage')],
  ['/hosting/listings/:id', page(hosting, 'ManageListingPage')],
  ['/hosting/auctions', page(auctions, 'OwnerAuctionsPage')],
  ['/wallet', page(wallet, 'WalletPage')],
  ['/auctions/:id', page(auctions, 'AuctionDetailPage')],

  ['/protection', page(protection, 'ProtectionPage')],
  ['/claims', page(protection, 'ClaimsPage')],
  ['/claims/new', page(protection, 'NewClaimPage')],
  ['/claims/:id', page(protection, 'ClaimDetailPage')],

  ['/help', page(support, 'HelpCenterPage')],
  ['/help/new', page(support, 'NewTicketPage')],
  ['/help/tickets/:id', page(support, 'TicketDetailPage')],
  ['/guidelines', page(support, 'GuidelinesPage')],
  ['/terms', page(support, 'TermsPage')],
  ['/privacy', page(support, 'PrivacyPage')],
];

function PageSkeleton() {
  return <div className="flow-skeleton container" aria-busy="true" aria-label="Loading page"><span /><span /><span /></div>;
}

/** Returns the flow page for a path, or null when the path is not a flow route. */
export function renderFlowRoute(path: string) {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path;
  for (const [pattern, Component] of ROUTES) {
    const params = matchRoute(pattern, clean);
    if (params) return <Suspense fallback={<PageSkeleton />}><Component key={clean} params={params} /></Suspense>;
  }
  return null;
}

/** Paths where the mobile bottom navigation should be hidden (focused task flows). */
export function isFocusedFlow(path: string): boolean {
  return /^\/(signin|signup|checkout)(\/|$)/.test(path) || /^\/trips\/[^/]+\/(pickup|return|review)$/.test(path) || /^\/inbox\/[^/]+$/.test(path) || path === '/hosting/new';
}
