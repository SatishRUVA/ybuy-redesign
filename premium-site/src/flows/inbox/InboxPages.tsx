import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, CheckCheck, ImagePlus, MessageCircle, Search, ShieldCheck, X } from 'lucide-react';
import { navigate } from '../../router';
import { clockTime, dateRange, listingById, relativeTime } from '../model';
import type { Conversation } from '../model';
import { useDemo } from '../store';
import { AuthRequired, Avatar, EmptyState, Link, ListingThumb, Pill, Segmented } from '../ui';
import { resizeAttachment } from './attachments';
import './inbox.css';

type Filter = 'all' | 'unread' | 'renting' | 'hosting';
const filters: { value: Filter; label: string }[] = [{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }, { value: 'renting', label: 'Renting' }, { value: 'hosting', label: 'Hosting' }];
const quickReplies = ['Is it still available?', 'Can I pick up earlier?', 'Thanks!'];

function replyFor(text: string, image: boolean) {
  if (image) return 'Thanks for the photo! That’s helpful. We can check everything together at handoff.';
  if (/earl|time|pick\s?up|arriv/i.test(text)) return 'Let’s work out a time here before changing the pickup plan. What time works best for you?';
  if (/avail/i.test(text)) return 'Happy to help! The booking page has the latest dates. Let me know what you have in mind.';
  if (/thank/i.test(text)) return 'You’re very welcome! See you soon.';
  return 'Thanks for checking in! I’ll keep an eye on our chat. Let me know if you need anything before we meet.';
}

function PhotoPreview({ src, onClose }: { src: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) node.showModal();
    return () => { if (node?.open) node.close(); };
  }, []);
  return <dialog ref={dialog} className="inbox-photo-preview" aria-label="Shared photo" onClose={onClose}><button type="button" className="icon-button" aria-label="Close photo" onClick={() => dialog.current?.close()}><X size={21} /></button><img src={src} alt="Shared attachment, full view" /><a className="secondary-button" href={src} download="ybuy-shared-photo.jpg">Save photo</a></dialog>;
}

function Thread({ conversation }: { conversation: Conversation }) {
  const { data, sendMessage, receiveMessage, markConversationRead, notify } = useDemo();
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [preview, setPreview] = useState('');
  const [loadingImage, setLoadingImage] = useState(false);
  const [typing, setTyping] = useState(0);
  const [error, setError] = useState('');
  const textarea = useRef<HTMLTextAreaElement>(null);
  const messages = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const mounted = useRef(true);
  const booking = data.bookings.find((b) => b.id === conversation.bookingId);
  const listing = listingById(conversation.listingId);
  const latestMine = [...conversation.messages].reverse().find((m) => m.from === 'me');
  const latestTheirs = [...conversation.messages].reverse().find((m) => m.from === 'them');

  useEffect(() => {
    if (conversation.unread) markConversationRead(conversation.id);
  }, [conversation.id, conversation.unread, markConversationRead]);
  useEffect(() => {
    const node = textarea.current;
    if (node) { node.style.height = 'auto'; node.style.height = `${Math.min(node.scrollHeight, 140)}px`; }
  }, [text]);
  useEffect(() => { if (messages.current) messages.current.scrollTop = messages.current.scrollHeight; }, [conversation.messages.length, typing]);
  useEffect(() => {
    mounted.current = true;
    const activeTimers = timers.current;
    return () => { mounted.current = false; activeTimers.forEach(window.clearTimeout); };
  }, []);

  const send = () => {
    if ((!text.trim() && !image) || loadingImage) return;
    const sent = text.trim();
    const hadImage = !!image;
    sendMessage(conversation.id, sent, image || undefined);
    setText(''); setImage(''); setError(''); setTyping((n) => n + 1);
    timers.current.push(window.setTimeout(() => {
      receiveMessage(conversation.id, replyFor(sent, hadImage));
      setTyping((n) => Math.max(0, n - 1));
    }, 1900));
    textarea.current?.focus();
  };

  return <section className="inbox-thread" aria-label={`Conversation with ${conversation.with.name}`}>
    {preview && <PhotoPreview src={preview} onClose={() => setPreview('')} />}
    <header className="inbox-thread-header">
      <Link href="/inbox" className="icon-button inbox-back" label="Back to messages"><ArrowLeft size={21} /></Link>
      <Avatar name={conversation.with.name} initials={conversation.with.initials} size={42} />
      <div className="inbox-person"><h1>{conversation.with.name}</h1><span>{booking?.role === 'owner' ? 'Your renter' : 'Your neighbor'} · Usually replies quickly</span></div>
      <Link href={booking ? `/trips/${booking.id}` : `/gear/${conversation.listingId}`} className="inbox-context-chip" label={booking ? 'View trip' : 'View listing'}><ListingThumb listingId={conversation.listingId} size={36} /></Link>
    </header>
    <div className="inbox-booking-context">
      <ListingThumb listingId={conversation.listingId} size={48} />
      <div><strong>{listing?.title ?? 'Your shared adventure'}</strong><span>{booking ? dateRange(booking.start, booking.end) : 'A little more sharing, a lot more living'}</span></div>
      <div className="inbox-context-end"><Pill tone={booking?.status === 'active' ? 'success' : 'neutral'}>{booking?.status ?? 'Inquiry'}</Pill><Link href={booking ? `/trips/${booking.id}` : `/gear/${conversation.listingId}`} className="text-button">{booking ? 'View trip' : 'View listing'}</Link></div>
    </div>
    <p className="inbox-safety"><ShieldCheck size={15} aria-hidden="true" />Keep payments and messages on YBuy.</p>
    <div className="inbox-messages" ref={messages} role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions text">
      {conversation.messages.length === 0 && <div className="inbox-hello"><Avatar name={conversation.with.name} size={64} /><h2>A good adventure starts with hello.</h2><p>Ask a question or make a plan with {conversation.with.name}.</p></div>}
      {conversation.messages.map((message, index) => {
        const day = new Date(message.at).toDateString();
        const previous = conversation.messages[index - 1];
        return <div key={message.id}>
          {(!previous || new Date(previous.at).toDateString() !== day) && <div className="inbox-date"><span>{day === new Date().toDateString() ? 'Today' : new Date(message.at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>}
          {message.from === 'system' ? <p className="inbox-system">{message.text}</p> : <div className={`inbox-message inbox-message--${message.from}`}>
            <div className="inbox-bubble">{message.image && <button type="button" className="inbox-photo-button" aria-label="View attached photo" onClick={() => setPreview(message.image ?? '')}><img src={message.image} alt={`Photo shared by ${message.from === 'me' ? 'you' : conversation.with.name}`} /></button>}{message.text && <p>{message.text}</p>}</div>
            <span className="inbox-message-meta"><time dateTime={new Date(message.at).toISOString()}>{clockTime(message.at)}</time>{message.id === latestMine?.id && <span><CheckCheck size={12} aria-hidden="true" />{latestTheirs && latestTheirs.at >= message.at ? 'Read' : 'Delivered'}</span>}</span>
          </div>}
        </div>;
      })}
      {typing > 0 && <div className="inbox-typing" role="status"><span /><span /><span /><small>{conversation.with.name} is typing · demo</small></div>}
    </div>
    <div className="inbox-compose-area">
      <div className="inbox-quick-replies" aria-label="Quick replies">{quickReplies.map((reply) => <button type="button" className="chip" key={reply} onClick={() => { setText(reply); textarea.current?.focus(); }}>{reply}</button>)}</div>
      {image && <div className="inbox-attachment"><img src={image} alt="Photo ready to send" /><button type="button" className="icon-button" aria-label="Remove photo" onClick={() => setImage('')}><X size={18} /></button></div>}
      {error && <p className="field-error" role="alert">{error}</p>}
      <form className="inbox-composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
        <label className="icon-button inbox-attach" aria-label="Attach a photo"><ImagePlus size={22} aria-hidden="true" /><input type="file" accept="image/*" disabled={loadingImage} onChange={async (event) => {
          const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
          setLoadingImage(true); setError('');
          try { const result = await resizeAttachment(file); if (mounted.current) setImage(result); } catch { if (mounted.current) { setError('That photo couldn’t be opened. Try a JPG, PNG, or WebP image.'); notify('Photo could not be attached.'); } } finally { if (mounted.current) setLoadingImage(false); }
        }} /></label>
        <textarea ref={textarea} aria-label="Your message" placeholder="Write a message…" value={text} rows={1} maxLength={4000} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} />
        <button type="submit" className="inbox-send" aria-label="Send message" disabled={(!text.trim() && !image) || loadingImage}><ArrowUp size={22} /></button>
      </form>
      <span className="inbox-demo" role="status">{loadingImage ? 'Preparing your photo…' : 'Demo chat · replies are simulated. No messages leave this preview.'}</span>
    </div>
  </section>;
}

/** A mobile inbox and full-screen conversation, expanding to two panes on desktop. */
export function InboxPage({ params }: { params: Record<string, string> }) {
  const { user, data, unreadMessages } = useDemo();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const selected = data.conversations.find((c) => c.id === params.id);
  const conversations = data.conversations.filter((c) => {
    const booking = data.bookings.find((b) => b.id === c.bookingId);
    const query = search.trim().toLowerCase();
    return (!query || `${c.with.name} ${listingById(c.listingId)?.title ?? ''} ${c.messages.at(-1)?.text ?? ''}`.toLowerCase().includes(query)) && (filter === 'all' || (filter === 'unread' && c.unread > 0) || (filter === 'renting' && booking?.role === 'renter') || (filter === 'hosting' && booking?.role === 'owner'));
  }).sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0));
  if (!user) return <AuthRequired title="Your conversations, all together" reason="Sign in to make plans with your neighbors and keep every detail in one place.">{null}</AuthRequired>;
  return <div className={`inbox-page ${params.id ? 'inbox-page--selected' : ''}`}>
    <aside className="inbox-list-pane" aria-label="Conversations">
      <header className="inbox-list-heading"><span className="eyeline">A little hello goes a long way</span><h1>Messages{unreadMessages > 0 && <span>{unreadMessages}<span className="inbox-sr-only"> unread messages</span></span>}</h1><p>Your people. Your plans. All here.</p></header>
      <label className="inbox-search"><Search size={19} aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages" aria-label="Search messages" /></label>
      <Segmented label="Filter conversations" value={filter} options={filters} onChange={setFilter} className="inbox-filters" />
      <div className="inbox-conversations">{conversations.map((c) => {
        const last = c.messages.at(-1);
        return <button type="button" key={c.id} className={`inbox-conversation ${selected?.id === c.id ? 'is-selected' : ''}`} aria-current={selected?.id === c.id ? 'page' : undefined} onClick={() => navigate(`/inbox/${c.id}`)}>
          <div className="inbox-list-avatar"><Avatar name={c.with.name} initials={c.with.initials} size={50} /><ListingThumb listingId={c.listingId} size={27} /></div>
          <div className="inbox-conversation-main"><div><strong>{c.with.name}</strong><time>{last ? relativeTime(last.at) : 'New'}</time></div><span className="inbox-listing-title">{listingById(c.listingId)?.title}</span><p>{last?.text || (last?.image ? 'Shared a photo' : 'Say hello to your neighbor')}</p></div>
          {c.unread > 0 && <span className="inbox-unread" aria-label={`${c.unread} unread messages`} />}
        </button>;
      })}{conversations.length === 0 && <EmptyState icon={<MessageCircle />} title={search || filter !== 'all' ? 'No conversations found' : 'Your next hello is waiting'} body={search || filter !== 'all' ? 'Try another name or filter.' : 'Message an owner from a listing to start planning.'} action={search || filter !== 'all' ? <button className="text-button" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</button> : <Link className="primary-button" href="/">Find something to borrow</Link>} />}</div>
    </aside>
    {selected ? <Thread key={selected.id} conversation={selected} /> : <section className="inbox-select"><EmptyState icon={<MessageCircle size={30} />} title={params.id ? 'Conversation not found' : 'A little more connection.'} body={params.id ? 'This conversation may no longer be available. Choose another from your inbox.' : 'Select a conversation to make a plan, ask a question, or simply say thanks.'} action={params.id ? <Link href="/inbox" className="secondary-button">Back to messages</Link> : undefined} /></section>}
  </div>;
}
