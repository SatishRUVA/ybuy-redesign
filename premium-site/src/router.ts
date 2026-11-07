import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';

const CHANGE = 'ybuy:navigate';

/** Client-side navigation shared by every page. Scrolls to top like a real page change. */
export function navigate(next: string, options: { replace?: boolean } = {}) {
  if (options.replace) window.history.replaceState({}, '', next);
  else window.history.pushState({}, '', next);
  window.dispatchEvent(new Event(CHANGE));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/** Goes back when there is in-app history, otherwise to a sensible fallback. */
export function goBack(fallback = '/') {
  if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) window.history.back();
  else navigate(fallback);
}

export function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    window.addEventListener(CHANGE, update);
    return () => { window.removeEventListener('popstate', update); window.removeEventListener(CHANGE, update); };
  }, []);
  return { path, navigate };
}

/** Matches "/trips/:id" style patterns. Returns params or null. */
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split('/').filter(Boolean);
  const b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

/** onClick handler for <a href> that keeps modifier-click behaviour (new tab etc.). */
export function linkHandler(href: string) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(href);
  };
}
