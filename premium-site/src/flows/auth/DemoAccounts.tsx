import { useState } from 'react';
import { ChevronDown, Copy, KeyRound, ShieldCheck } from 'lucide-react';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, ROLE_LABELS } from '../accounts';
import type { DemoAccount } from '../accounts';
import type { AccountRole } from '../model';
import { Avatar, Segmented } from '../ui';

const roles: AccountRole[] = ['user', 'renter', 'owner'];

/** Collapsible list of the 30 local demo accounts. Tapping a row signs in as that account. */
export function DemoAccountsPanel({ onPick, disabled = false }: { onPick: (account: DemoAccount) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<AccountRole>('renter');
  const [copied, setCopied] = useState(false);
  const accounts = DEMO_ACCOUNTS.filter((account) => account.role === role);

  const copyPassword = () => {
    void navigator.clipboard?.writeText(DEMO_PASSWORD).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); }).catch(() => undefined);
  };

  return <section className={`demo-accounts ${open ? 'is-open' : ''}`} aria-label="Demo accounts">
    <button type="button" className="demo-accounts-toggle" aria-expanded={open} aria-controls="demo-accounts-body" onClick={() => setOpen((current) => !current)}>
      <span className="demo-accounts-icon"><KeyRound size={17} /></span>
      <span className="demo-accounts-heading"><strong>Try a demo account</strong><small>30 local accounts · users, renters and owners</small></span>
      <ChevronDown size={18} className="demo-accounts-chevron" />
    </button>
    {open && <div id="demo-accounts-body" className="demo-accounts-body">
      <div className="demo-accounts-password">
        <span>Shared password</span>
        <code>{DEMO_PASSWORD}</code>
        <button type="button" onClick={copyPassword} aria-label="Copy demo password"><Copy size={14} />{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <Segmented label="Account type" value={role} onChange={setRole} options={roles.map((value) => ({ value, label: ROLE_LABELS[value].plural, count: DEMO_ACCOUNTS.filter((account) => account.role === value).length }))} className="demo-accounts-tabs" />
      <p className="demo-accounts-blurb">{ROLE_LABELS[role].blurb}. Tap one to sign in.</p>
      <ul className="demo-accounts-list">
        {accounts.map((account) => {
          const { profile } = account; const name = `${profile.firstName} ${profile.lastName}`;
          return <li key={account.email}><button type="button" className="demo-account-row" disabled={disabled} onClick={() => onPick(account)}>
            <Avatar name={name} size={40} />
            <span className="demo-account-copy"><strong>{name}{profile.idVerified && <ShieldCheck size={13} aria-label="ID verified" />}</strong><small>{account.email}</small></span>
            <span className="demo-account-meta">{profile.rentals > 0 ? `${profile.rentals} ${role === 'owner' ? 'lends' : 'rentals'}` : 'New'}<small>{profile.location.replace(', TX', '')}</small></span>
          </button></li>;
        })}
      </ul>
    </div>}
  </section>;
}
