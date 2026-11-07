import type { ReactNode } from 'react';
import { ArrowLeft, Lock, Star } from 'lucide-react';
import { goBack, linkHandler } from '../router';
import { listingById } from './model';
import { useDemo } from './store';

/** In-app link that keeps the SPA navigation and modifier-click behaviour. */
export function Link({ href, children, className, label, onClick }: { href: string; children: ReactNode; className?: string; label?: string; onClick?: () => void }) {
  const handler = linkHandler(href);
  return <a href={href} className={className} aria-label={label} onClick={(event) => { onClick?.(); handler(event); }}>{children}</a>;
}

/**
 * Standard page frame for every flow. Mobile gets a sticky app-style top bar with a back button;
 * tablet/desktop gets a large editorial heading. `aside` renders as a sticky right column on desktop.
 */
export function PageShell({ title, subtitle, eyebrow, back, actions, aside, children, width = 'default', className = '' }: {
  title: string;
  subtitle?: ReactNode;
  eyebrow?: string;
  /** Fallback path for the back button; omit to hide it. */
  back?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
}) {
  return <div className={`flow-page flow-page--${width} ${aside ? 'flow-page--split' : ''} ${className}`}>
    <div className="flow-topbar">
      {back ? <button type="button" className="flow-topbar-back" aria-label="Go back" onClick={() => goBack(back)}><ArrowLeft size={20} /></button> : <span className="flow-topbar-spacer" />}
      <span className="flow-topbar-title" aria-hidden="true">{title}</span>
      <span className="flow-topbar-actions">{actions}</span>
    </div>
    <header className="flow-header container">
      {back && <button type="button" className="flow-back" onClick={() => goBack(back)}><ArrowLeft size={16} />Back</button>}
      <div className="flow-header-row">
        <div>
          {eyebrow && <span className="flow-eyebrow">{eyebrow}</span>}
          <h1 className="flow-title page-intro">{title}</h1>
          {subtitle && <p className="flow-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="flow-header-actions">{actions}</div>}
      </div>
    </header>
    <div className="flow-body container">
      <div className="flow-main">{children}</div>
      {aside && <aside className="flow-aside">{aside}</aside>}
    </div>
  </div>;
}

/** Shows a premium sign-in prompt instead of the page when nobody is signed in. */
export function AuthRequired({ children, title, reason }: { children: ReactNode; title: string; reason: string }) {
  const { user, requireAuth } = useDemo();
  if (user) return <>{children}</>;
  return <div className="flow-page flow-page--narrow">
    <div className="auth-required container">
      <span className="auth-required-icon"><Lock size={26} strokeWidth={1.6} /></span>
      <h1>{title}</h1>
      <p>{reason}</p>
      <button type="button" className="primary-button" onClick={() => requireAuth()}>Sign in or create an account</button>
      <span className="form-disclaimer">Takes less than a minute. No real account is created in this preview.</span>
    </div>
  </div>;
}

export function Avatar({ name, initials, photo, size = 44, className = '' }: { name: string; initials?: string; photo?: string; size?: number; className?: string }) {
  const letters = initials ?? name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return <span className={`avatar ${className}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }} aria-hidden={photo ? undefined : true}>
    {photo ? <img src={photo} alt={`${name}’s photo`} /> : letters}
  </span>;
}

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'live';

export function Pill({ tone = 'neutral', children, dot = false }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return <span className={`pill pill--${tone}`}>{dot && <span className="pill-dot" />}{children}</span>;
}

/** Accessible tab-style segmented control. */
export function Segmented<T extends string>({ options, value, onChange, label, className = '' }: { options: { value: T; label: string; count?: number }[]; value: T; onChange: (value: T) => void; label: string; className?: string }) {
  return <div className={`segmented ${className}`} role="tablist" aria-label={label}>
    {options.map((option) => <button key={option.value} type="button" role="tab" aria-selected={value === option.value} className={value === option.value ? 'is-active' : ''} onClick={() => onChange(option.value)}>
      {option.label}{option.count !== undefined && option.count > 0 && <span className="segmented-count">{option.count}</span>}
    </button>)}
  </div>;
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return <div className="flow-empty"><span className="flow-empty-icon">{icon}</span><h3>{title}</h3><p>{body}</p>{action}</div>;
}

export function Stars({ value, size = 14, label }: { value: number; size?: number; label?: string }) {
  return <span className="stars" role="img" aria-label={label ?? `${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} fill={n <= Math.round(value) ? 'currentColor' : 'none'} className={n <= Math.round(value) ? 'is-on' : ''} />)}
  </span>;
}

export function ProgressRing({ percent, size = 72, stroke = 6, children }: { percent: number; size?: number; stroke?: number; children?: ReactNode }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return <span className="progress-ring" style={{ width: size, height: size }} role="img" aria-label={`${percent}% complete`}>
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="progress-ring-track" />
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="progress-ring-value" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)} />
    </svg>
    <span className="progress-ring-label">{children ?? `${percent}%`}</span>
  </span>;
}

export function ListingThumb({ listingId, size = 64, className = '' }: { listingId: string; size?: number; className?: string }) {
  const listing = listingById(listingId);
  if (!listing) return null;
  return <img className={`listing-thumb ${className}`} src={listing.image} alt="" width={size} height={size} style={{ width: size, height: size }} loading="lazy" />;
}

/** Label + control wrapper with optional hint and error, used by all flow forms. */
export function Field({ label, hint, error, children, htmlFor, optional }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string; optional?: boolean }) {
  return <div className={`field ${error ? 'field--error' : ''}`}>
    <label className="field-label" htmlFor={htmlFor}>{label}{optional && <span className="field-optional">Optional</span>}</label>
    {children}
    {error ? <p className="field-message field-message--error" role="alert">{error}</p> : hint ? <p className="field-message">{hint}</p> : null}
  </div>;
}
