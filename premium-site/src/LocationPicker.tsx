import { AlertCircle, Check, LoaderCircle, LocateFixed, MapPin } from 'lucide-react';
import { LOCATION_SUGGESTIONS, RADIUS_OPTIONS } from './location';
import type { LocationStatus, Radius, UserLocation } from './location';

interface LocationPickerProps {
  id: string;
  location: UserLocation;
  status: LocationStatus;
  draft: string;
  radius: Radius;
  attention: boolean;
  onDraftChange: (value: string) => void;
  onUseCurrent: () => void;
  onRadiusChange: (radius: Radius) => void;
}

/** "Where" field: optional current location, a manual city/ZIP entry, and radius chips. */
export default function LocationPicker({ id, location, status, draft, radius, attention, onDraftChange, onUseCurrent, onRadiusChange }: LocationPickerProps) {
  const usingCurrent = location.kind === 'current' && !draft.trim();
  const hintId = `${id}-hint`;
  return <fieldset className="location-picker">
    <legend>Where</legend>
    <button type="button" className={`location-current ${usingCurrent ? 'location-current--active' : ''}`} onClick={onUseCurrent} disabled={status === 'requesting'} aria-pressed={usingCurrent}>
      <span className="location-current-icon">{status === 'requesting' ? <LoaderCircle size={18} className="spin" /> : usingCurrent ? <Check size={18} /> : <LocateFixed size={18} />}</span>
      <span><strong>{status === 'requesting' ? 'Finding you…' : usingCurrent ? 'Using your current location' : 'Use my current location'}</strong><small>Only used to show gear near you</small></span>
    </button>
    <div className={`location-field ${attention ? 'location-field--attention' : ''}`}>
      <label htmlFor={id}>{usingCurrent ? 'Or search somewhere else' : 'City, neighborhood, or ZIP'}</label>
      <span className="input-shell"><MapPin size={18} /><input id={id} list={`${id}-suggestions`} value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="e.g. Irving, TX or 75039" autoComplete="address-level2" maxLength={80} aria-invalid={attention || undefined} aria-describedby={attention ? hintId : undefined} /></span>
      <datalist id={`${id}-suggestions`}>{LOCATION_SUGGESTIONS.map((value) => <option key={value} value={value} />)}</datalist>
      {attention && <p className="location-hint" id={hintId} role="alert"><AlertCircle size={15} />{status === 'denied' ? 'Location access is off.' : status === 'unavailable' ? 'We couldn’t find your location.' : 'Add a location to continue.'} Enter a city or ZIP to see gear near you.</p>}
    </div>
    <div className="radius-chips" role="radiogroup" aria-label="Search radius">
      {RADIUS_OPTIONS.map((option) => <label key={option.label} className="radius-chip"><input type="radio" name={`${id}-radius`} checked={radius === option.value} onChange={() => onRadiusChange(option.value)} /><span>{option.label}</span></label>)}
    </div>
  </fieldset>;
}
