import type { FormEvent } from 'react';
import { AlertCircle, ChevronDown, LoaderCircle, LocateFixed, MapPin, Navigation, Search } from 'lucide-react';
import CalendarRange from './CalendarRange';
import { LOCATION_SUGGESTIONS, RADIUS_OPTIONS } from './location';
import type { LocationStatus, Radius, UserLocation } from './location';

interface InlineSearchProps {
  query: string;
  onQueryChange: (value: string) => void;
  location: UserLocation;
  locationStatus: LocationStatus;
  locationDraft: string;
  locationAttention: boolean;
  onLocationDraftChange: (value: string) => void;
  onUseCurrent: () => void;
  radius: Radius;
  onRadiusChange: (radius: Radius) => void;
  start: string;
  end: string;
  onDatesChange: (start: string, end: string) => void;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Always-visible search: type what and where, pick dates inline, choose a distance (5 mi default). */
export default function InlineSearch(props: InlineSearchProps) {
  const { query, onQueryChange, location, locationStatus, locationDraft, locationAttention, onLocationDraftChange, onUseCurrent, radius, onRadiusChange, start, end, onDatesChange, error, onSubmit } = props;
  const usingCurrent = location.kind === 'current' && !locationDraft.trim();
  const requesting = locationStatus === 'requesting';
  const hint = locationAttention
    ? `${locationStatus === 'denied' ? 'Location access is off.' : locationStatus === 'unavailable' ? 'We couldn’t find your location.' : 'Add a location to search nearby.'} Type a city or ZIP.`
    : '';

  return <form className="inline-search" role="search" aria-label="Search rentals" onSubmit={onSubmit} noValidate>
    <label className="inline-field inline-field--what">
      <span className="inline-label">What</span>
      <span className="inline-control"><Search size={18} aria-hidden="true" /><input id="search-query" type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Tent, camera, bike…" autoComplete="off" enterKeyHint="search" maxLength={80} /></span>
    </label>

    <div className={`inline-field inline-field--where ${locationAttention ? 'inline-field--attention' : ''}`}>
      <label className="inline-label" htmlFor="search-location">Where</label>
      <span className="inline-control">
        {usingCurrent ? <Navigation size={17} aria-hidden="true" className="inline-current-icon" /> : <MapPin size={18} aria-hidden="true" />}
        <input id="search-location" list="search-location-suggestions" value={locationDraft} onChange={(event) => onLocationDraftChange(event.target.value)} placeholder={usingCurrent ? 'Current location' : 'City or ZIP'} autoComplete="address-level2" enterKeyHint="search" maxLength={80} aria-invalid={locationAttention || undefined} aria-describedby={hint ? 'search-location-hint' : undefined} />
        <button type="button" className={`inline-locate ${usingCurrent ? 'inline-locate--active' : ''}`} onClick={onUseCurrent} disabled={requesting} aria-label={requesting ? 'Finding your location' : 'Use my current location'} aria-pressed={usingCurrent}>
          {requesting ? <LoaderCircle size={17} className="spin" /> : <LocateFixed size={17} />}
        </button>
      </span>
      <datalist id="search-location-suggestions">{LOCATION_SUGGESTIONS.map((value) => <option key={value} value={value} />)}</datalist>
    </div>

    <div className="inline-when">
      <CalendarRange start={start} end={end} onChange={onDatesChange} />
    </div>

    <label className="inline-field inline-field--distance">
      <span className="inline-label">Distance</span>
      <span className="inline-control">
        <select value={radius === null ? 'any' : String(radius)} onChange={(event) => onRadiusChange(event.target.value === 'any' ? null : Number(event.target.value) as Radius)}>
          {RADIUS_OPTIONS.map((option) => <option key={option.label} value={option.value === null ? 'any' : option.value}>{option.label}</option>)}
        </select>
        <ChevronDown size={15} aria-hidden="true" />
      </span>
    </label>

    <button className="inline-submit" type="submit" disabled={requesting}>
      {requesting ? <LoaderCircle size={19} className="spin" /> : <Search size={19} />}<span>{requesting ? 'Locating…' : 'Search'}</span>
    </button>

    {(hint || error) && <div className="inline-messages">
      {hint && <p className="location-hint" id="search-location-hint" role="alert"><AlertCircle size={15} />{hint}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>}
  </form>;
}
