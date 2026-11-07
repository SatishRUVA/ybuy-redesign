/**
 * Location helpers for the premium concept.
 * The browser permission prompt is only triggered from explicit, high-intent actions
 * (search, bid, request, "Closest first"), never on page load or while browsing.
 */

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export type UserLocation =
  | { kind: 'none' }
  | { kind: 'current'; latitude: number; longitude: number }
  | { kind: 'manual'; label: string };

/** Search radius in miles; `null` means any distance. */
export type Radius = 5 | 10 | 25 | 50 | null;

export const DEFAULT_RADIUS: Radius = 5;
export const RADIUS_OPTIONS: readonly { value: Radius; label: string }[] = [
  { value: 5, label: '5 mi' },
  { value: 10, label: '10 mi' },
  { value: 25, label: '25 mi' },
  { value: 50, label: '50 mi' },
  { value: null, label: 'Any distance' },
];

export const LOCATION_SUGGESTIONS = ['Irving, TX', 'Dallas, TX', 'Fort Worth, TX', 'Austin, TX', 'Plano, TX'];

export class LocationError extends Error {
  constructor(public readonly reason: 'denied' | 'unavailable') {
    super(reason === 'denied' ? 'Location permission denied' : 'Location unavailable');
    this.name = 'LocationError';
  }
}

/** Wraps the Geolocation API in a promise with a coarse, privacy-friendly request. */
export function requestCurrentPosition(timeout = 10000): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new LocationError('unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => reject(new LocationError(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable')),
      { enableHighAccuracy: false, maximumAge: 10 * 60000, timeout },
    );
  });
}

/** Accepts a city, neighborhood, or 5-digit ZIP. Returns a trimmed label or null when invalid. */
export function normalizeLocation(value: string): string | null {
  const label = value.replace(/\s+/g, ' ').trim();
  if (label.length < 2 || label.length > 80) return null;
  if (!/^[\p{L}\p{N} .,'-]+$/u.test(label)) return null;
  return label;
}

export function locationLabel(location: UserLocation): string {
  if (location.kind === 'current') return 'Current location';
  if (location.kind === 'manual') return location.label;
  return 'Add location';
}

export function radiusLabel(radius: Radius): string {
  return radius === null ? 'Any distance' : `Within ${radius} mi`;
}
