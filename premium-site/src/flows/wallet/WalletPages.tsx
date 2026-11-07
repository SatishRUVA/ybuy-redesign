import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Building2, ChevronRight, CreditCard, Landmark, Plus, ShieldCheck, Trash2, Wallet as WalletIcon, X } from 'lucide-react';
import { makeId, money, relativeTime } from '../model';
import type { DemoData, PaymentMethod, PayoutMethod, Txn } from '../model';
import { useDemo } from '../store';
import { AuthRequired, EmptyState, Field, PageShell, Pill, Segmented } from '../ui';
import './wallet.css';

type WalletTab = 'Activity' | 'Payment methods' | 'Payouts';
type ActivityFilter = 'All' | 'Money in' | 'Money out' | 'Pending';
type WalletExtra = { available: number; pending: number; credits: number; schedule: string };
type WalletData = DemoData & { walletState?: WalletExtra };
const defaultWallet: WalletExtra = { available: 186.4, pending: 25.92, credits: 250, schedule: 'weekly' };
const getWalletState = (data: DemoData) => ({ ...defaultWallet, ...((data as WalletData).walletState ?? {}) });

/** Wallet activity, saved payment details, and demo payout controls. */
export function WalletPage({ params }: { params: Record<string, string> }) {
  const { data, mutate, notify, pushNotice } = useDemo();
  void params;
  const [tab, setTab] = useState<WalletTab>('Activity');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('All');
  const [selected, setSelected] = useState<Txn | null>(null);
  const [addingCard, setAddingCard] = useState(false);
  const [addingBank, setAddingBank] = useState(false);
  const wallet = getWalletState(data);
  const tabs: { value: WalletTab; label: string }[] = [{ value: 'Activity', label: 'Activity' }, { value: 'Payment methods', label: 'Payment methods' }, { value: 'Payouts', label: 'Payouts' }];
  const grouped = useMemo(() => {
    const groups = new Map<string, Txn[]>();
    const filtered = data.txns.filter((txn) => activityFilter === 'All' || (activityFilter === 'Pending' ? txn.status === 'pending' : activityFilter === 'Money in' ? txn.amount >= 0 : txn.amount < 0));
    [...filtered].sort((a, b) => b.at - a.at).forEach((txn) => {
      const key = new Date(txn.at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      groups.set(key, [...(groups.get(key) ?? []), txn]);
    });
    return [...groups.entries()];
  }, [data.txns, activityFilter]);
  function updateWallet(patch: Partial<WalletExtra>) {
    mutate((current) => ({ ...(current as WalletData), walletState: { ...getWalletState(current), ...patch } }));
  }
  function cashOut() {
    if (wallet.available <= 0) return;
    const amount = wallet.available;
    const txn: Txn = { id: makeId('tx'), kind: 'payout', label: `Cash out to ${data.payout?.bank ?? 'your bank'} ••${data.payout?.last4 ?? '0000'}`, amount: -amount, at: Date.now(), status: 'pending' };
    mutate((current) => ({ ...(current as WalletData), txns: [txn, ...current.txns], walletState: { ...getWalletState(current), available: 0, pending: getWalletState(current).pending + amount } }));
    pushNotice({ type: 'payout', title: 'Cash out requested', body: `${money(amount)} is moving to your payout method.`, href: '/wallet' });
    notify('Cash out requested. Demo only — no money moved.');
  }
  function setDefault(id: string) {
    mutate((current) => ({ ...current, paymentMethods: current.paymentMethods.map((method) => ({ ...method, isDefault: method.id === id })) }));
    notify('Default payment method updated.');
  }
  function removePayment(id: string) {
    const remaining = data.paymentMethods.filter((method) => method.id !== id);
    mutate((current) => ({ ...current, paymentMethods: remaining.map((method, index) => ({ ...method, isDefault: method.isDefault || (index === 0 && !remaining.some((entry) => entry.isDefault)) })) }));
    notify('Payment method removed.');
  }
  return <AuthRequired title="Your wallet" reason="Sign in to see your balance, payment methods, and payouts."><PageShell title="Wallet" subtitle="A clear view of what’s available, what’s on the way, and how you pay." eyebrow="Your money" back="/profile" width="wide">
    <section className="wallet-hero" aria-label="Wallet balance"><div className="wallet-hero-top"><span className="wallet-icon"><WalletIcon size={20} /></span><Pill tone="accent">Demo wallet</Pill></div><p>Available balance</p><strong>{money(wallet.available)}</strong><div className="wallet-balance-row"><span><small>Pending</small><b>{money(wallet.pending)}</b></span><i /><span><small>Test credits</small><b>{money(wallet.credits, false)}</b></span></div><small className="wallet-demo-caption"><ShieldCheck size={14} /> Demo only — no real payments or transfers.</small></section>
    <div className="wallet-tabs"><Segmented options={tabs} value={tab} onChange={setTab} label="Wallet sections" /></div>
    {tab === 'Activity' && <section className="wallet-activity-wrap"><div className="wallet-activity-filters" role="group" aria-label="Filter transactions">{(['All', 'Money in', 'Money out', 'Pending'] as const).map((value) => <button type="button" key={value} aria-pressed={activityFilter === value} className={activityFilter === value ? 'is-active' : ''} onClick={() => setActivityFilter(value)}>{value}</button>)}</div>{grouped.length ? grouped.map(([month, txns]) => <div className="wallet-month-group" key={month}><h2>{month}</h2><div className="card wallet-activity-list">{txns.map((txn) => <button type="button" className="wallet-transaction" key={txn.id} onClick={() => setSelected(txn)}><TxnIcon txn={txn} /><span className="wallet-transaction-copy"><strong>{txn.label}</strong><small>{new Date(txn.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {txn.status === 'pending' ? 'Pending' : relativeTime(txn.at)}</small></span><span className={`wallet-amount ${txn.amount >= 0 ? 'is-in' : 'is-out'}`}>{txn.amount >= 0 ? '+' : '−'}{money(Math.abs(txn.amount), false)}<ChevronRight size={14} /></span></button>)}</div></div>) : <EmptyState icon={<WalletIcon size={20} />} title="Nothing here yet" body="Your rental payments and payouts will appear here." />}</section>}
    {tab === 'Payment methods' && <section className="wallet-method-layout"><div className="wallet-content-heading"><div><h2>Payment methods</h2><p>Saved methods are for demo checkout only.</p></div><button type="button" className="secondary-button" onClick={() => setAddingCard(true)}><Plus size={16} /> Add a card</button></div><div className="wallet-payment-grid">{data.paymentMethods.map((method) => <PaymentCard key={method.id} method={method} onDefault={() => setDefault(method.id)} onRemove={() => removePayment(method.id)} />)}</div>{data.paymentMethods.length === 0 && <EmptyState icon={<CreditCard size={20} />} title="No saved cards" body="Add a card to try the demo checkout flow." action={<button type="button" className="primary-button" onClick={() => setAddingCard(true)}>Add a card</button>} />}<p className="wallet-security-note"><ShieldCheck size={16} /> Card details stay in this browser session. Never enter a real card number.</p></section>}
    {tab === 'Payouts' && <section className="wallet-payout-layout"><div className="wallet-payout-main"><div className="wallet-content-heading"><div><h2>Payout method</h2><p>Where your rental earnings go.</p></div><button type="button" className="secondary-button" onClick={() => setAddingBank(true)}><Plus size={16} /> Add bank</button></div>{data.payout ? <article className="wallet-bank-card"><span className="wallet-bank-mark"><Building2 size={21} /></span><span className="wallet-bank-copy"><strong>{data.payout.bank}</strong><small>Checking account ···· {data.payout.last4}</small><small>{data.payout.holder}</small></span><Pill tone="success">Default</Pill></article> : <EmptyState icon={<Landmark size={20} />} title="Add a payout method" body="Set a demo bank account to try the payout flow." action={<button type="button" className="primary-button" onClick={() => setAddingBank(true)}>Add bank account</button>} />}<div className="card wallet-schedule-card"><div><h3>Payout schedule</h3><p>Choose when eligible earnings are sent.</p></div><label className="sr-only" htmlFor="payout-schedule">Payout schedule</label><select id="payout-schedule" className="control" value={wallet.schedule} onChange={(event) => { updateWallet({ schedule: event.target.value }); notify('Payout schedule updated.'); }}><option value="daily">Daily</option><option value="weekly">Weekly · Fridays</option><option value="monthly">Monthly · 1st</option><option value="manual">Manual only</option></select></div><div className="wallet-payout-available"><span><small>Available to cash out</small><strong>{money(wallet.available)}</strong></span><span>Usually arrives in 2–3 demo business days</span><button type="button" className="primary-button" disabled={!wallet.available || !data.payout} onClick={cashOut}>Cash out</button></div><p className="wallet-demo-note">Demo only — no transfer will be made.</p></div><aside className="card wallet-payout-aside"><span><Landmark size={20} /></span><h3>Made for neighborhood rentals</h3><p>Your balance is a preview of the YBuy demo. No bank or payment provider is connected.</p></aside></section>}
  </PageShell>
  {tab === 'Payouts' && <div className="wallet-mobile-cashout"><span><small>Available</small><strong>{money(wallet.available)}</strong></span><button type="button" className="primary-button" disabled={!wallet.available || !data.payout} onClick={cashOut}>Cash out</button></div>}
  {selected && <div className="wallet-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="wallet-sheet" role="dialog" aria-modal="true" aria-labelledby="txn-title"><button type="button" className="icon-button wallet-sheet-close" aria-label="Close transaction details" onClick={() => setSelected(null)}><X size={20} /></button><TxnIcon txn={selected} large /><h2 id="txn-title">{selected.label}</h2><strong className={`wallet-sheet-amount ${selected.amount >= 0 ? 'is-in' : 'is-out'}`}>{selected.amount >= 0 ? '+' : '−'}{money(Math.abs(selected.amount))}</strong><dl><div><dt>Date</dt><dd>{new Date(selected.at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</dd></div><div><dt>Status</dt><dd>{selected.status === 'pending' ? 'Pending' : 'Complete'}</dd></div><div><dt>Reference</dt><dd>{selected.id.toUpperCase()}</dd></div></dl><p>Demo transaction · no real money was charged or transferred.</p></section></div>}
  {addingCard && <AddCardSheet onClose={() => setAddingCard(false)} onAdd={(method) => { mutate((current) => ({ ...current, paymentMethods: [...current.paymentMethods.map((entry) => ({ ...entry, isDefault: false })), { ...method, id: makeId('pm'), isDefault: current.paymentMethods.length === 0 }] })); notify('Demo card added.'); setAddingCard(false); }} />}
  {addingBank && <AddBankSheet onClose={() => setAddingBank(false)} onAdd={(payout) => { mutate((current) => ({ ...current, payout })); notify('Demo payout account saved.'); setAddingBank(false); }} />}
  </AuthRequired>;
}

function TxnIcon({ txn, large = false }: { txn: Txn; large?: boolean }) {
  const incoming = txn.amount >= 0;
  const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
  return <span className={`wallet-txn-icon ${incoming ? 'is-in' : 'is-out'} ${large ? 'is-large' : ''}`}><Icon size={large ? 22 : 18} /></span>;
}

function PaymentCard({ method, onDefault, onRemove }: { method: PaymentMethod; onDefault: () => void; onRemove: () => void }) {
  return <article className="wallet-card-method"><div className="wallet-card-method-top"><span className={`wallet-card-brand wallet-brand-${method.brand.toLowerCase().replaceAll(' ', '-')}`}><CreditCard size={19} /><b>{method.brand}</b></span>{method.isDefault && <Pill tone="success">Default</Pill>}</div><strong>•••• •••• •••• {method.last4}</strong><small>Expires {method.exp}</small><div className="wallet-card-method-actions">{!method.isDefault && <button type="button" className="text-button" onClick={onDefault}>Set as default</button>}<button type="button" className="wallet-remove-button" aria-label={`Remove ${method.brand} ending ${method.last4}`} onClick={onRemove}><Trash2 size={15} /> Remove</button></div></article>;
}

function AddCardSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (method: Omit<PaymentMethod, 'id' | 'isDefault'>) => void }) {
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const digits = number.replace(/\D/g, '');
  const brand: PaymentMethod['brand'] = digits.startsWith('34') || digits.startsWith('37') ? 'Amex' : digits.startsWith('5') ? 'Mastercard' : 'Visa';
  const formatted = digits.replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (digits.length < 12 || expiry.length < 5) return;
    onAdd({ brand, last4: digits.slice(-4), exp: expiry });
  }
  return <div className="wallet-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="wallet-sheet wallet-form-sheet" role="dialog" aria-modal="true" aria-labelledby="add-card-title"><button type="button" className="icon-button wallet-sheet-close" aria-label="Close" onClick={onClose}><X size={20} /></button><span className="wallet-sheet-icon"><CreditCard size={21} /></span><h2 id="add-card-title">Add a demo card</h2><p>Use a made-up number. No payment is processed.</p><form onSubmit={submit}><Field label="Card number" htmlFor="card-number" hint="Enter any 12–16 digits; this is only saved locally."><input id="card-number" inputMode="numeric" autoComplete="off" required minLength={12} maxLength={19} className="control" value={formatted} onChange={(event) => setNumber(event.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="4242 4242 4242 4242" /></Field><div className="wallet-form-split"><Field label="Expiry" htmlFor="card-expiry"><input id="card-expiry" inputMode="numeric" autoComplete="off" required className="control" maxLength={5} value={expiry} onChange={(event) => { const raw = event.target.value.replace(/\D/g, '').slice(0, 4); setExpiry(raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw); }} placeholder="MM/YY" /></Field><Field label="Security code" htmlFor="card-cvc" hint="Not stored"><input id="card-cvc" inputMode="numeric" autoComplete="off" className="control" maxLength={4} placeholder="•••" /></Field></div><button className="primary-button full-width" type="submit">Save demo card</button></form></section></div>;
}

function AddBankSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (payout: PayoutMethod) => void }) {
  const [bank, setBank] = useState('');
  const [holder, setHolder] = useState('');
  const [routing, setRouting] = useState('');
  const [account, setAccount] = useState('');
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (routing.replace(/\D/g, '').length < 9 || account.replace(/\D/g, '').length < 4) return;
    onAdd({ bank, holder, last4: account.slice(-4) });
  }
  return <div className="wallet-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="wallet-sheet wallet-form-sheet" role="dialog" aria-modal="true" aria-labelledby="add-bank-title"><button type="button" className="icon-button wallet-sheet-close" aria-label="Close" onClick={onClose}><X size={20} /></button><span className="wallet-sheet-icon"><Landmark size={21} /></span><h2 id="add-bank-title">Add a demo bank</h2><p>Use made-up details. No bank connection is made.</p><form onSubmit={submit}><Field label="Bank name" htmlFor="bank-name"><input id="bank-name" autoComplete="off" required className="control" value={bank} onChange={(event) => setBank(event.target.value)} placeholder="Your bank" /></Field><Field label="Account holder" htmlFor="bank-holder"><input id="bank-holder" autoComplete="off" required className="control" value={holder} onChange={(event) => setHolder(event.target.value)} placeholder="Alex Rivera" /></Field><Field label="Routing number" htmlFor="bank-routing"><input id="bank-routing" inputMode="numeric" autoComplete="off" required minLength={9} maxLength={9} className="control" value={routing} onChange={(event) => setRouting(event.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="9 digits" /></Field><Field label="Account number" htmlFor="bank-account"><input id="bank-account" inputMode="numeric" autoComplete="off" required minLength={4} className="control" value={account} onChange={(event) => setAccount(event.target.value.replace(/\D/g, '').slice(0, 17))} placeholder="At least 4 digits" /></Field><button className="primary-button full-width" type="submit">Save demo bank</button></form></section></div>;
}
