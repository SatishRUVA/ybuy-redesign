import { useState } from 'react';
import { ArrowDownLeft, Bell, CalendarCheck, Check, CheckCheck, ChevronRight, CreditCard, Gavel, Mail, MessageCircle, Moon, Settings2, ShieldCheck, Sparkles, Star, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { navigate } from '../../router';
import type { DemoData, Notice, NoticeType } from '../model';
import { relativeTime } from '../model';
import { useDemo } from '../store';
import { AuthRequired, EmptyState, Link, PageShell, Segmented } from '../ui';
import './notifications.css';

const noticeIcons: Record<NoticeType, LucideIcon> = { booking: CalendarCheck, outbid: Gavel, 'auction-won': Trophy, 'auction-ended': Gavel, message: MessageCircle, payment: CreditCard, review: Star, payout: ArrowDownLeft };
const categories: { id: string; label: string; detail: string; icon: LucideIcon; types: NoticeType[] }[] = [
  { id: 'bookings', label: 'Bookings & trips', detail: 'Requests, confirmations, and a nudge before you meet.', icon: CalendarCheck, types: ['booking'] },
  { id: 'messages', label: 'Messages', detail: 'A new hello or an update from your neighbor.', icon: MessageCircle, types: ['message'] },
  { id: 'auctions', label: 'Auctions & bids', detail: 'Outbid alerts, winning bids, and auction endings.', icon: Gavel, types: ['outbid', 'auction-won', 'auction-ended'] },
  { id: 'payments', label: 'Payments', detail: 'Receipts, deposit updates, and payouts.', icon: CreditCard, types: ['payment', 'payout'] },
  { id: 'reviews', label: 'Reviews', detail: 'Share a little appreciation after a good rental.', icon: Star, types: ['review'] },
  { id: 'promotions', label: 'Promotions & tips', detail: 'Fresh finds and thoughtful ways to share more.', icon: Sparkles, types: [] },
];
type Channel = 'push' | 'email' | 'sms';
interface CommunicationSettings { quietHours?: boolean; sms?: Record<string, boolean>; promotions?: { push: boolean; email: boolean; sms: boolean } }
type SettingsData = DemoData & { communicationSettings?: CommunicationSettings };

/** SMS, marketing, and quiet-hours are demo metadata: the shared model only has transactional push/email/in-app. */
function settingsFor(data: DemoData): CommunicationSettings { return (data as SettingsData).communicationSettings ?? {}; }

function groupFor(at: number) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  if (at >= today.getTime()) return 'Today';
  if (at >= monday.getTime()) return 'This week';
  return 'Earlier';
}

function NoticeRow({ notice }: { notice: Notice }) {
  const { markNotice, notify } = useDemo();
  const Icon = noticeIcons[notice.type];
  return <article className={`notifications-row ${notice.read ? '' : 'notifications-row--unread'}`}>
    <button className="notifications-open" type="button" onClick={() => { markNotice(notice.id); if (notice.href) navigate(notice.href); else notify('You’re all caught up on this update.'); }}>
      <span className={`notifications-symbol notifications-symbol--${notice.type}`}><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></span>
      <span className="notifications-copy"><span className="notifications-title">{notice.title}{!notice.read && <span className="notifications-dot" aria-label="Unread" />}</span><span className="notifications-body">{notice.body}</span><time dateTime={new Date(notice.at).toISOString()}>{relativeTime(notice.at)}</time></span>
      {notice.href && <ChevronRight className="notifications-chevron" size={16} aria-hidden="true" />}
    </button>
    <button className="icon-button notifications-read" type="button" aria-label={`${notice.read ? 'Mark unread' : 'Mark read'}: ${notice.title}`} title={notice.read ? 'Mark unread' : 'Mark read'} onClick={() => { markNotice(notice.id, !notice.read); notify(notice.read ? 'Marked as unread.' : 'Marked as read.'); }}>{notice.read ? <Mail size={18} /> : <Check size={18} />}</button>
  </article>;
}

/** A grouped, filterable activity feed with explicit read controls alongside each update. */
export function NotificationsPage({ params }: { params: Record<string, string> }) {
  void params;
  const { user, data, markAllNotices, unreadNotices, notify } = useDemo();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const notices = [...data.notices].filter((n) => filter === 'all' || !n.read).sort((a, b) => b.at - a.at);
  if (!user) return <AuthRequired title="A little update, just for you" reason="Sign in for booking updates, new messages, and the moments that matter.">{null}</AuthRequired>;
  return <PageShell title="Your updates" subtitle="The little things that keep everything moving." eyebrow="IN THE KNOW" back="/profile" width="narrow" className="notifications-page" actions={<Link href="/notifications/settings" className="icon-button" label="Notification settings"><Settings2 size={21} /></Link>}>
    <div className="notifications-toolbar"><Segmented label="Filter notifications" options={[{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread', count: unreadNotices }]} value={filter} onChange={setFilter} /><button type="button" className="text-button" disabled={!unreadNotices} onClick={() => { markAllNotices(); notify('All caught up. Every update is marked as read.'); }}><CheckCheck size={17} aria-hidden="true" />Mark all read</button></div>
    {notices.length ? <div className="notifications-groups">{['Today', 'This week', 'Earlier'].map((group) => {
      const items = notices.filter((n) => groupFor(n.at) === group);
      return items.length > 0 && <section key={group} aria-label={group}><h2 className="notifications-group-title">{group}</h2><div className="notifications-group">{items.map((notice) => <NoticeRow notice={notice} key={notice.id} />)}</div></section>;
    })}</div> : <EmptyState icon={<Bell size={28} />} title={filter === 'unread' ? 'A lovely kind of quiet.' : 'Nothing new, for now.'} body={filter === 'unread' ? 'You’re all caught up. We’ll keep the important things right here.' : 'Your booking updates, messages, and neighborhood news will appear here.'} action={filter === 'unread' ? <button className="secondary-button" onClick={() => setFilter('all')}>See all updates</button> : <Link className="secondary-button" href="/">Find your next adventure</Link>} />}
    <div className="notifications-footer"><ShieldCheck size={16} aria-hidden="true" /><span>Less noise. Just what matters to you.</span><Link href="/notifications/settings" className="text-button">Your preferences</Link></div>
  </PageShell>;
}

/** Per-category communication preferences persisted alongside the demo store. */
export function NotificationSettingsPage({ params }: { params: Record<string, string> }) {
  void params;
  const { user, data, setPref, mutate, pushNotice, notify } = useDemo();
  const settings = settingsFor(data);
  const changeExtra = (patch: Partial<CommunicationSettings>) => mutate((d) => ({ ...d, communicationSettings: { ...settingsFor(d), ...patch } } as SettingsData));
  const enabled = (category: typeof categories[number], channel: Channel) => {
    if (!category.types.length) return settings.promotions?.[channel] ?? false;
    if (channel === 'sms') return settings.sms?.[category.id] ?? false;
    return category.types.every((type) => data.prefs[type][channel]);
  };
  const toggle = (category: typeof categories[number], channel: Channel) => {
    const value = !enabled(category, channel);
    if (!category.types.length) changeExtra({ promotions: { push: false, email: false, sms: false, ...settings.promotions, [channel]: value } });
    else if (channel === 'sms') changeExtra({ sms: { ...settings.sms, [category.id]: value } });
    else category.types.forEach((type) => setPref(type, channel, value));
    notify(`${category.label}: ${channel === 'sms' ? 'SMS' : channel === 'push' ? 'push' : 'email'} ${value ? 'on' : 'off'}.`);
  };
  if (!user) return <AuthRequired title="Make room for what matters" reason="Sign in to choose how and when you hear from YBuy.">{null}</AuthRequired>;
  return <PageShell title="Your kind of quiet" subtitle="Choose what reaches you, and where. Change your mind anytime." eyebrow="NOTIFICATION PREFERENCES" back="/notifications" width="narrow" className="notifications-page">
    <div className="notice-banner"><Bell size={20} aria-hidden="true" /><p>Updates always stay in your YBuy inbox. These switches control the extra ways we reach you.</p></div>
    <section className="card notifications-preferences" aria-label="Notification categories">
      {categories.map((category) => <div className="notifications-pref-row" key={category.id}>
        <div className="notifications-pref-heading"><span className="notifications-pref-icon"><category.icon size={21} strokeWidth={1.6} aria-hidden="true" /></span><div><h2>{category.label}</h2><p>{category.detail}</p></div></div>
        <div className="notifications-channels">{(['push', 'email', 'sms'] as const).map((channel) => <label key={channel} className="notifications-channel"><span>{channel === 'sms' ? 'SMS' : channel === 'push' ? 'Push' : 'Email'}</span><input type="checkbox" role="switch" className="switch" checked={enabled(category, channel)} aria-checked={enabled(category, channel)} aria-label={`${category.label}: ${channel === 'sms' ? 'SMS' : channel}`} onChange={() => toggle(category, channel)} /></label>)}</div>
      </div>)}
    </section>
    <section className="card notifications-quiet"><div className="notifications-pref-heading"><span className="notifications-pref-icon"><Moon size={21} aria-hidden="true" /></span><div><h2>Quiet hours</h2><p>A little breathing room, 10 pm – 8 am in your local time.</p></div><label className="notifications-quiet-toggle"><input className="switch" type="checkbox" role="switch" aria-label="Quiet hours, 10 pm to 8 am" aria-checked={settings.quietHours ?? false} checked={settings.quietHours ?? false} onChange={(event) => { changeExtra({ quietHours: event.target.checked }); notify(event.target.checked ? 'Quiet hours saved: 10 pm – 8 am.' : 'Quiet hours turned off.'); }} /></label></div><p className="form-disclaimer">Urgent safety and account notices may still reach you. Quiet hours won’t hide in-app updates.</p></section>
    <section className="card card--soft notifications-test"><span className="notifications-pref-icon"><Sparkles size={22} aria-hidden="true" /></span><h2>Try a little hello.</h2><p>Send yourself a sample update to see how it feels.</p><button className="secondary-button" type="button" onClick={() => { pushNotice({ type: 'booking', title: 'A little hello from YBuy', body: 'Your notifications are ready. Here’s to your next great rental.', href: '/notifications/settings' }); notify('Test notification sent. Find it in Your updates.'); }}>Send test notification</button><Link href="/notifications" className="text-button">View your updates <ChevronRight size={15} aria-hidden="true" /></Link></section>
    <p className="form-disclaimer">Saved automatically in this demo session. Push, email, SMS, and quiet-hour delivery are preview preferences only; no real messages are sent.</p>
  </PageShell>;
}
