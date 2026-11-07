import { useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Compass, FileText, HeartHandshake, LifeBuoy, LockKeyhole, MessageCircle, PackageCheck, Search, ShieldCheck, Siren, Sparkles, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { navigate } from '../../router';
import { longDate } from '../model';
import type { TicketCategory } from '../model';
import { useDemo } from '../store';
import { EmptyState, Link, PageShell, Pill } from '../ui';
import './support.css';

const topics: { title: string; icon: LucideIcon; href: string; search: string }[] = [
  { title: 'Booking & trips', icon: PackageCheck, href: '/trips', search: 'rental reservation booking trip pickup return' },
  { title: 'Payments & refunds', icon: Sparkles, href: '/wallet', search: 'payment deposit refund wallet charge' },
  { title: 'Hosting', icon: Users, href: '/hosting', search: 'owner host listing share gear' },
  { title: 'Auctions & bidding', icon: Compass, href: '/auctions/auction-2', search: 'auction bid offer' },
  { title: 'Safety & protection', icon: ShieldCheck, href: '/protection', search: 'safety protection claim damage theft' },
  { title: 'Account & verification', icon: LockKeyhole, href: '/profile/verify', search: 'account verification identity phone email' },
];
const articles = [
  { title: 'How does the refundable deposit work?', topic: 'Payments & refunds', answer: 'The deposit is an authorization hold, not a charge. It is usually released after the owner confirms the return. The amount is at least $50, or 20% of the item’s declared value.' },
  { title: 'What should I check at pickup?', topic: 'Booking & trips', answer: 'Take a moment with the owner to review the included pieces and current condition. Use the pickup checklist, note anything you both notice, and add photos if they help.' },
  { title: 'How do I report damage?', topic: 'Safety & protection', answer: 'Open YBuy Protection and start a claim from the relevant booking. Share when it happened, a clear description and any photos or receipts that help explain the situation.' },
  { title: 'When will I receive a payout?', topic: 'Payments & refunds', answer: 'Payout timing depends on your bank. You can see the demo payout method and recent activity in Wallet & payments. No real money moves in this preview.' },
  { title: 'How do I verify my identity?', topic: 'Account & verification', answer: 'Visit Profile → Verification and follow the ID prompts. In this design preview, the document review is simulated and your information is not sent anywhere.' },
  { title: 'How do I make my listing easier to book?', topic: 'Hosting', answer: 'Use recent photos, list every included accessory, describe the condition honestly, and keep your availability current. Quick, clear messages make planning easier too.' },
  { title: 'How do auctions work?', topic: 'Auctions & bidding', answer: 'Place a bid above the current amount before the timer ends. Auctions in this preview are a design demo only; bids do not create a real purchase.' },
];
const ticketCategory: Record<string, TicketCategory> = { 'Booking & trips': 'booking', 'Payments & refunds': 'payment', Hosting: 'listing', 'Auctions & bidding': 'other', 'Safety & protection': 'safety', 'Account & verification': 'account', Other: 'other' };
const ticketStatusTone = (status: 'open' | 'waiting' | 'resolved'): 'success' | 'warning' | 'info' => status === 'resolved' ? 'success' : status === 'waiting' ? 'warning' : 'info';

/** Helps neighbors find answers, support options, and their active requests. */
export function HelpCenterPage({ params }: { params: Record<string, string> }) {
  void params;
  const { user, data } = useDemo(); const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const visibleTopics = useMemo(() => topics.filter((topic) => !q || `${topic.title} ${topic.search}`.toLowerCase().includes(q)), [q]);
  const visibleArticles = useMemo(() => articles.filter((article) => !q || `${article.title} ${article.topic} ${article.answer}`.toLowerCase().includes(q)), [q]);
  return <PageShell title="How can we help?" subtitle="Clear answers for the little things and the not-so-little ones." back="/"><div className="support-help-page">
    <section className="support-help-search"><div className="support-search-box"><Search size={20} /><input type="search" aria-label="Search help articles" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search bookings, payments, safety…" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={17} /></button>}</div><p>Search answers from neighbors and the YBuy team.</p></section>
    <section className="support-help-topics"><div className="support-section-heading"><h2>Browse by topic</h2><span>{visibleTopics.length} topics</span></div>{visibleTopics.length ? <div className="support-topic-grid">{visibleTopics.map(({ title, icon: Icon, href }) => <Link key={title} href={href} className="card support-topic-card"><span><Icon size={20} /></span><strong>{title}</strong><ChevronRight size={17} /></Link>)}</div> : <p className="support-no-results">No topics match “{query}”. Try another search.</p>}</section>
    <section className="support-help-articles"><div className="support-section-heading"><h2>Popular answers</h2><span>{visibleArticles.length} articles</span></div>{visibleArticles.length ? visibleArticles.map((article) => <details className="support-article" key={article.title}><summary><span><small>{article.topic}</small><strong>{article.title}</strong></span><ChevronRight size={18} /></summary><p>{article.answer}</p></details>) : <p className="support-no-results">No articles match “{query}”. Try a broader search.</p>}</section>
    {user && <section className="support-tickets-section"><div className="support-section-heading"><div><h2>Your support requests</h2><p>Keep track of conversations with our team.</p></div><Link href="/help/new" className="secondary-button">New request</Link></div>{data.tickets.length ? <div className="support-ticket-list">{data.tickets.map((ticket) => <Link key={ticket.id} href={`/help/tickets/${ticket.id}`} className="card support-ticket-row"><span className="support-ticket-mark"><MessageCircle size={19} /></span><span className="support-ticket-copy"><strong>{ticket.subject}</strong><small>{ticket.ref} <span>·</span> {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small></span><Pill tone={ticketStatusTone(ticket.status)}>{ticket.status === 'waiting' ? 'Waiting on you' : ticket.status === 'open' ? 'Open' : 'Resolved'}</Pill><ChevronRight size={16} /></Link>)}</div> : <EmptyState icon={<MessageCircle size={22} />} title="No support requests yet" body="If you need a hand, send our team a message." action={<Link href="/help/new" className="secondary-button">Contact support</Link>} />}</section>}
    <section className="support-contact-panel"><div className="support-contact-icon"><HeartHandshake size={23} /></div><div><h2>Still need a hand?</h2><p>Send a message and our team will follow up here.</p><Link href="/help/new" className="support-contact-link">Message us <ArrowRight size={15} /></Link></div><div className="support-emergency"><Siren size={19} /><p><strong>In immediate danger?</strong><br />Call local emergency services. YBuy support is not an emergency line.</p></div></section>
  </div></PageShell>;
}

/** Opens a support request with optional booking, file names and urgency. */
export function NewTicketPage({ params }: { params: Record<string, string> }) {
  void params;
  const { user, data, addTicket, notify } = useDemo(); const [category, setCategory] = useState('Booking & trips'); const [bookingId, setBookingId] = useState('');
  const [subject, setSubject] = useState(''); const [details, setDetails] = useState(''); const [urgency, setUrgency] = useState('Normal'); const [files, setFiles] = useState<string[]>([]); const [error, setError] = useState('');
  if (!user) return <PageShell title="Contact support" back="/help"><div className="support-auth"><LifeBuoy size={28} /><h2>Sign in to message support</h2><p>Your support history stays with your account.</p><Link href="/signin" className="primary-button">Sign in</Link></div></PageShell>;
  const submit = () => { if (!subject.trim() || !details.trim()) { setError('Add a subject and describe what you need help with.'); return; } const attachmentLine = files.length ? `\n\nAttachments: ${files.join(', ')}` : ''; const ticket = addTicket({ category: ticketCategory[category], subject: subject.trim(), details: `[${urgency} priority] ${details.trim()}${attachmentLine}`, ...(bookingId ? { bookingId } : {}) }); notify('Your request was sent.'); navigate(`/help/tickets/${ticket.id}`); };
  return <PageShell title="Message support" subtitle="Tell us what’s going on. We’ll keep the conversation here." back="/help"><div className="support-new-ticket"><section className="card support-form-card">
    <label className="field"><span className="field-label">What can we help with?</span><select className="control" value={category} onChange={(event) => setCategory(event.target.value)}>{topics.map((topic) => <option key={topic.title}>{topic.title}</option>)}<option>Other</option></select></label>
    <label className="field"><span className="field-label">Related rental <span className="field-optional">Optional</span></span><select className="control" value={bookingId} onChange={(event) => setBookingId(event.target.value)}><option value="">Not about a specific rental</option>{data.bookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.counterpart.name} · {longDate(booking.start)}</option>)}</select></label>
    <label className="field"><span className="field-label">Subject</span><input className="control" maxLength={100} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="A short summary" /></label>
    <label className="field"><span className="field-label">How can we help?</span><textarea className="control support-textarea" maxLength={1500} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Add details that will help us understand." /></label>
    <div className="field"><span className="field-label">Attachments <span className="field-optional">Optional</span></span><label className="support-file-picker"><FileText size={19} /><span>Add filenames for context</span><input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).map((file) => file.name))} /></label>{files.length > 0 && <span className="field-message">{files.length} file{files.length === 1 ? '' : 's'}: {files.join(', ')}</span>}</div>
    <label className="field"><span className="field-label">Urgency</span><select className="control" value={urgency} onChange={(event) => setUrgency(event.target.value)}><option>Normal</option><option>Time-sensitive</option><option>Urgent safety concern</option></select><span className="field-message">If you are in immediate danger, call local emergency services.</span></label>
    {error && <p className="field-message field-message--error" role="alert">{error}</p>}
    <p className="form-disclaimer">Demo only — no real message is sent. Replies appear in your support request.</p><button className="primary-button" type="button" onClick={submit}>Send request <ArrowRight size={16} /></button>
  </section></div></PageShell>;
}

/** Shows a support conversation and lets the member reply or resolve it. */
export function TicketDetailPage({ params }: { params: Record<string, string> }) {
  const { user, data, addCaseReply, mutate, notify } = useDemo(); const ticket = data.tickets.find((entry) => entry.id === params.id); const [reply, setReply] = useState('');
  if (!user) return <PageShell title="Support request" back="/help"><div className="support-auth"><LifeBuoy size={28} /><h2>Sign in to view this conversation</h2><p>Your support messages are private to your account.</p><Link href="/signin" className="primary-button">Sign in</Link></div></PageShell>;
  if (!ticket) return <PageShell title="Support request" back="/help"><EmptyState icon={<MessageCircle size={23} />} title="Request not found" body="This support request may have been removed or its link may be out of date." /></PageShell>;
  const send = () => { if (!reply.trim()) return; addCaseReply('ticket', ticket.id, { who: 'You', text: reply.trim() }); mutate((d) => ({ ...d, tickets: d.tickets.map((item) => item.id === ticket.id ? { ...item, status: 'open' } : item) })); setReply(''); notify('Reply sent.'); window.setTimeout(() => { addCaseReply('ticket', ticket.id, { who: 'Jess · YBuy Support', text: 'Thanks for the extra details. We’re looking into this and will follow up here shortly.' }); mutate((d) => ({ ...d, tickets: d.tickets.map((item) => item.id === ticket.id && item.status !== 'resolved' ? { ...item, status: 'waiting' } : item) })); }, 1400); };
  const resolve = () => { mutate((d) => ({ ...d, tickets: d.tickets.map((item) => item.id === ticket.id ? { ...item, status: 'resolved', activity: [...item.activity, { at: Date.now(), who: 'You', text: 'Marked this request as resolved.' }] } : item) })); notify('Request marked resolved.'); };
  return <PageShell title="Support request" subtitle={`${ticket.ref} · ${ticket.subject}`} back="/help" actions={<Pill tone={ticketStatusTone(ticket.status)}>{ticket.status === 'waiting' ? 'Waiting on you' : ticket.status === 'open' ? 'Open' : 'Resolved'}</Pill>}><div className="support-ticket-detail">
    <section className="card support-ticket-summary"><div><span className="support-ticket-mark"><MessageCircle size={20} /></span><span><small>{ticket.ref} · {ticket.category}</small><h2>{ticket.subject}</h2></span></div><Pill tone={ticketStatusTone(ticket.status)}>{ticket.status === 'waiting' ? 'Waiting on you' : ticket.status === 'open' ? 'Open' : 'Resolved'}</Pill></section>
    <section className="card support-conversation"><div className="support-section-heading"><h2>Conversation</h2><span>Started {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span></div><ol className="support-conversation-list">{[...ticket.activity].sort((a, b) => a.at - b.at).map((entry, index) => <li key={`${entry.at}-${index}`} className={entry.who === 'You' ? 'from-member' : 'from-support'}><span className="support-message-avatar">{entry.who === 'You' ? 'You' : 'YB'}</span><div><div className="support-message-header"><strong>{entry.who}</strong><time>{new Date(entry.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time></div><p>{entry.text}</p></div></li>)}</ol>
      {ticket.status !== 'resolved' ? <div className="support-reply-box"><label className="field"><span className="field-label">Your reply</span><textarea className="control support-textarea" value={reply} maxLength={1500} onChange={(event) => setReply(event.target.value)} placeholder="Add a detail or reply to our team." /></label><div className="support-reply-actions"><span>Replies are part of this demo.</span><button className="primary-button" type="button" disabled={!reply.trim()} onClick={send}>Send reply <ArrowRight size={15} /></button></div></div> : <div className="support-resolved-note"><Check size={17} /> This request is marked resolved.</div>}
    </section>
    {ticket.status !== 'resolved' && <button className="secondary-button support-resolve" type="button" onClick={resolve}>Mark as resolved</button>}
  </div></PageShell>;
}

const guidelineSections = [
  { id: 'respect', title: 'Be respectful', icon: HeartHandshake, body: 'Treat neighbors with care. Communicate clearly, respect boundaries, and leave room for different experiences. Harassment, threats, discrimination and unwanted contact are not welcome.' },
  { id: 'accurate', title: 'List gear honestly', icon: Check, body: 'Use current photos, describe the condition accurately, and include every part a renter should expect. Keep your availability and pickup details up to date.' },
  { id: 'handoffs', title: 'Make safe handoffs', icon: ShieldCheck, body: 'Agree on a public, well-lit handoff when possible. Review the condition and included items together. Keep booking conversations and payments on YBuy.' },
  { id: 'prohibited', title: 'Keep prohibited items off YBuy', icon: X, body: 'Do not list or request weapons, drugs, animals, counterfeit goods, hazardous materials, stolen property, or anything illegal or unsafe to lend.' },
  { id: 'care', title: 'Take care of shared things', icon: PackageCheck, body: 'Follow the owner’s reasonable instructions, use gear only as intended, and return it on time in the condition agreed at pickup. Speak up early if plans change.' },
];

/** Sets clear expectations for safe, thoughtful gear sharing. */
export function GuidelinesPage({ params }: { params: Record<string, string> }) {
  void params;
  return <PageShell title="Community guidelines" subtitle="A good neighborhood starts with how we show up for one another." back="/profile"><div className="support-guidelines-layout"><nav className="support-guidelines-nav" aria-label="Guideline sections">{guidelineSections.map(({ id, title }) => <a key={id} href={`#${id}`}>{title}</a>)}</nav><div className="support-guidelines-content"><div className="support-guidelines-intro"><span className="support-legal-mark"><Users size={24} /></span><p>YBuy works when every person feels respected and every item is treated with care. These shared expectations apply to all members.</p></div>{guidelineSections.map(({ id, title, icon: Icon, body }) => <section id={id} className="card support-guideline-card" key={id}><span><Icon size={20} /></span><div><h2>{title}</h2><p>{body}</p></div></section>)}<section className="support-guidelines-help"><p>If you see something that does not feel right, tell us. We’ll review reports with care.</p><Link href="/help/new" className="secondary-button">Contact support <ArrowRight size={15} /></Link></section></div></div></PageShell>;
}

const legalContent = {
  terms: {
    title: 'Terms of service', intro: 'These sample terms describe a few basics for a YBuy design preview.',
    sections: [
      ['Using YBuy', 'YBuy helps neighbors discover, request, and lend gear. You are responsible for the information you share and for following local laws when using the service.'],
      ['Member accounts', 'Keep your account details accurate and your sign-in information private. You must be old enough to enter into an agreement in your location to use rental features.'],
      ['Listings and rentals', 'Owners should describe items accurately and keep availability current. Renters should use items as intended, follow agreed pickup and return details, and report concerns promptly.'],
      ['Payments and deposits', 'Prices, fees, deposits and payouts are shown before a rental is confirmed. A deposit may be held temporarily and released after return, subject to the applicable review process.'],
      ['Protection and claims', 'Optional protection and claims are subject to the terms shown for the specific rental. Submitting a claim does not guarantee reimbursement; information from both parties may be considered.'],
      ['Community safety', 'Do not use YBuy to list prohibited goods, break the law, threaten another member, or make a handoff unsafe. We may limit access when needed to protect the community.'],
      ['Changes to these terms', 'We may update these sample terms as the service changes. The date at the top indicates when this preview was last revised.'],
    ],
  },
  privacy: {
    title: 'Privacy', intro: 'A plain-language look at information in this YBuy design preview.',
    sections: [
      ['Information you add', 'A real service may use the details you provide, such as your name, contact information, profile details, messages and rental activity, to operate your account.'],
      ['How information is used', 'Information can help coordinate rentals, support payments, prevent misuse, answer support requests and improve the service. We aim to ask only for what is useful for those purposes.'],
      ['Identity and payment details', 'Sensitive identity and payment information should be handled with care and limited to the people and systems that need it. This preview does not send documents or card details to a server.'],
      ['Information shared with others', 'A public profile may show details you choose to share. Booking information is shared with the people involved in a rental so they can coordinate a handoff.'],
      ['Your choices', 'You can review profile visibility, change your account details, and contact support. Some information may be retained when required for safety, legal or accounting reasons.'],
      ['Cookies and storage', 'This preview stores demo state in your browser session. Clearing site data or ending the session may remove it. A production service may use additional storage technologies.'],
      ['Questions', 'For a real account, use the privacy contact in the production service. This sample page is not a request channel and does not create legal rights.'],
    ],
  },
};

/** Renders the shared, readable sample legal-document layout. */
function LegalDocument({ kind }: { kind: 'terms' | 'privacy' }) {
  const document = legalContent[kind];
  return <PageShell title={document.title} subtitle={document.intro} back="/profile"><div className="support-legal-layout"><nav className="support-legal-nav" aria-label="On this page"><strong>On this page</strong>{document.sections.map(([title], index) => <a key={title} href={`#legal-${index + 1}`}>{index + 1}. {title}</a>)}</nav><article className="support-legal-document"><div className="support-legal-note"><FileText size={17} /><span>Sample terms for design preview — not legal advice.</span></div><p className="support-legal-updated">Last updated November 6, 2026</p>{document.sections.map(([title, body], index) => <section id={`legal-${index + 1}`} key={title}><h2>{index + 1}. {title}</h2><p>{body}</p></section>)}</article></div></PageShell>;
}

/** Presents the sample terms of service. */
export function TermsPage({ params }: { params: Record<string, string> }) { void params; return <LegalDocument kind="terms" />; }
/** Presents the sample privacy notice. */
export function PrivacyPage({ params }: { params: Record<string, string> }) { void params; return <LegalDocument kind="privacy" />; }




