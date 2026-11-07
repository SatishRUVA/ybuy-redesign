import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { calendarDays, todayIso } from './calendar';
import { rentalTotal } from './data';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function CalendarRange({ start, end, onChange }: { start: string; end: string; onChange: (start: string, end: string) => void }) {
  const today = todayIso();
  const initial = start >= today ? start : today;
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<'pickup' | 'return'>('pickup');
  const [month, setMonth] = useState(() => new Date(`${initial.slice(0, 7)}-01T12:00:00`));
  const [focusedDate, setFocusedDate] = useState(initial);
  const [hoveredDate, setHoveredDate] = useState('');
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const pickupButton = useRef<HTMLButtonElement>(null);
  const returnButton = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef(false);
  const id = useId();
  const total = rentalTotal(1, start, end);

  useLayoutEffect(() => {
    if (expanded && pendingFocus.current) {
      buttons.current.get(focusedDate)?.focus();
      pendingFocus.current = false;
    }
  }, [expanded, focusedDate, month, mode]);

  function open(next: 'pickup' | 'return') {
    const selecting = next === 'return' && start ? 'return' : 'pickup';
    let date = selecting === 'return' ? end || start : start || today;
    if (selecting === 'return' && date <= start) {
      const nextDay = new Date(`${start}T12:00:00`);
      nextDay.setDate(nextDay.getDate() + 1);
      date = todayIso(nextDay);
    }
    if (date < today) date = today;
    setMode(selecting);
    setMonth(new Date(`${date.slice(0, 7)}-01T12:00:00`));
    setFocusedDate(date);
    setExpanded(true);
    pendingFocus.current = true;
  }

  function select(date: string) {
    setHoveredDate('');
    if (mode === 'pickup') {
      onChange(date, '');
      setMode('return');
      const next = new Date(`${date}T12:00:00`);
      next.setDate(next.getDate() + 1);
      setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
      setFocusedDate(todayIso(next));
      pendingFocus.current = true;
    } else {
      onChange(start, date);
      setExpanded(false);
      returnButton.current?.focus();
    }
  }

  function changeMonth(direction: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + direction, 1);
    const first = todayIso(next);
    setMonth(next);
    setFocusedDate(first < today ? today : first);
  }

  function dayKey(event: KeyboardEvent<HTMLButtonElement>, iso: string) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setExpanded(false);
      (mode === 'pickup' ? pickupButton : returnButton).current?.focus();
      return;
    }
    const date = new Date(`${iso}T12:00:00`);
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in offsets) date.setDate(date.getDate() + offsets[event.key]);
    else if (event.key === 'Home') date.setDate(date.getDate() - date.getDay());
    else if (event.key === 'End') date.setDate(date.getDate() + 6 - date.getDay());
    else if (event.key === 'PageUp' || event.key === 'PageDown') {
      const day = date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() + (event.key === 'PageUp' ? -1 : 1));
      date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
    } else return;
    event.preventDefault();
    const next = todayIso(date);
    if (next < today || (mode === 'return' && next <= start)) return;
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setFocusedDate(next);
    pendingFocus.current = true;
  }

  return <div className="date-range-picker">
    <div className="date-range-triggers">
      <button ref={pickupButton} type="button" aria-label="Choose pickup date" aria-expanded={expanded && mode === 'pickup'} aria-controls={`${id}-calendar`} onClick={() => open('pickup')} className={expanded && mode === 'pickup' ? 'date-trigger--active' : ''}><CalendarDays size={18} /><span><small>Pickup</small><strong>{start ? shortDate(start) : 'Add a date'}</strong></span></button>
      <button ref={returnButton} type="button" aria-label="Choose return date" aria-expanded={expanded && mode === 'return'} aria-controls={`${id}-calendar`} onClick={() => open('return')} className={expanded && mode === 'return' ? 'date-trigger--active' : ''}><CalendarDays size={18} /><span><small>Return</small><strong>{end ? shortDate(end) : 'Add a date'}</strong></span></button>
    </div>
    {expanded && <div className="range-calendar" id={`${id}-calendar`}>
      <div className="calendar-instruction"><span>{mode === 'pickup' ? 'When does your good day start?' : 'And when will you bring it back?'}</span><button type="button" className="icon-button" aria-label="Close calendar" onClick={() => { setExpanded(false); (mode === 'pickup' ? pickupButton : returnButton).current?.focus(); }}><X size={17} /></button></div>
      <div className="calendar-navigation"><button type="button" className="icon-button" aria-label="Previous month" disabled={todayIso(month).slice(0, 7) <= today.slice(0, 7)} onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button><span aria-live="polite">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span><button type="button" className="icon-button" aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={18} /></button></div>
      <div className="calendar-months">
        {[0, 1].map((offset) => {
          const current = new Date(month.getFullYear(), month.getMonth() + offset, 1);
          const days = calendarDays(current.getFullYear(), current.getMonth());
          const label = current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          return <div className={`calendar-month ${offset ? 'calendar-month--second' : ''}`} key={label}>
            <h3>{label}</h3>
            <table role="grid" aria-label={label}><thead><tr>{weekdays.map((day) => <th scope="col" key={day}><abbr title={day}>{day.slice(0, 2)}</abbr></th>)}</tr></thead><tbody>
              {Array.from({ length: 6 }, (_, row) => <tr key={row}>{days.slice(row * 7, row * 7 + 7).map((date, column) => {
                const selected = !!date && (date === start || date === end);
                const rangeEnd = end || (mode === 'return' && hoveredDate > start ? hoveredDate : '');
                const inRange = !!date && !!start && !!rangeEnd && date >= start && date <= rangeEnd;
                return <td role="gridcell" key={date || `blank-${column}`} aria-selected={selected || inRange} className={`${inRange ? 'calendar-in-range' : ''} ${date === start ? 'calendar-range-start' : ''} ${date === end ? 'calendar-range-end' : ''}`}>
                  {date && <button type="button" ref={(node) => { if (node) buttons.current.set(date, node); else buttons.current.delete(date); }} data-date={date} tabIndex={date === focusedDate ? 0 : -1} disabled={date < today || (mode === 'return' && date <= start)} aria-label={new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} aria-pressed={selected} aria-current={date === today ? 'date' : undefined} onClick={() => select(date)} onFocus={() => setFocusedDate(date)} onKeyDown={(event) => dayKey(event, date)} onMouseEnter={() => setHoveredDate(date)} onMouseLeave={() => setHoveredDate('')}>{Number(date.slice(-2))}</button>}
                </td>;
              })}</tr>)}
            </tbody></table>
          </div>;
        })}
      </div>
      <p className="calendar-help">Arrow keys move between days. Choose pickup, then return.</p>
    </div>}
    <div className="date-range-summary"><span role="status" aria-live="polite">{total ? <><Check size={14} />{total.days} {total.days === 1 ? 'day' : 'days'} to make the most of it</> : start ? 'Pickup selected. Choose a later return date.' : 'A little flexibility goes a long way.'}</span>{(start || end) && <button type="button" onClick={() => { onChange('', ''); setExpanded(false); pickupButton.current?.focus(); }}>Clear dates</button>}</div>
  </div>;
}
