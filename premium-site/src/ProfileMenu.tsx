import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CalendarCheck2, ChevronDown, Gavel, Heart, LifeBuoy, LogIn, LogOut, MessageCircle, Plus, UserRound, UserPlus, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar } from './flows/ui';
import type { Profile } from './flows/model';
import './profile-menu.css';

interface ProfileMenuProps {
  user: Profile | null;
  savedCount: number;
  onNavigate: (path: string) => void;
  onStartListing: () => void;
  onHowItWorks: () => void;
  onSignOut: () => void;
}

/** Anchored account dropdown (no modal). Radix handles focus, arrow-key navigation, Escape and outside clicks. */
export default function ProfileMenu({ user, savedCount, onNavigate, onStartListing, onHowItWorks, onSignOut }: ProfileMenuProps) {
  const name = user ? `${user.firstName} ${user.lastName}` : '';
  return <DropdownMenu.Root modal={false}>
    <DropdownMenu.Trigger className={`profile-menu ${user ? '' : 'is-guest'}`} aria-label={user ? `Account menu for ${user.firstName}` : 'Account menu'}>
      <span className="profile-menu-avatar">{user ? <Avatar name={name} photo={user.photo} size={30} /> : <UserRound size={18} />}</span>
      <ChevronDown size={15} className="profile-menu-chevron" aria-hidden="true" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content className="profile-dropdown" align="end" sideOffset={10} collisionPadding={12}>
        {user ? <>
          <div className="profile-dropdown-head">
            <Avatar name={name} photo={user.photo} size={40} />
            <span><strong>{name}</strong><small>{user.email}</small></span>
          </div>
          <DropdownMenu.Separator className="profile-dropdown-sep" />
          <Item icon={<Plus size={17} />} onSelect={onStartListing} accent>List your gear</Item>
          <Item icon={<Gavel size={17} />} onSelect={() => onNavigate('/hosting')}>Hosting dashboard</Item>
          <DropdownMenu.Separator className="profile-dropdown-sep" />
          <Item icon={<UserRound size={17} />} onSelect={() => onNavigate('/profile')}>Profile and account</Item>
          <Item icon={<CalendarCheck2 size={17} />} onSelect={() => onNavigate('/trips')}>Trips and requests</Item>
          <Item icon={<Heart size={17} />} onSelect={() => onNavigate('/saved')} meta={savedCount || undefined}>Saved</Item>
          <Item icon={<Wallet size={17} />} onSelect={() => onNavigate('/wallet')}>Wallet</Item>
          <Item icon={<LifeBuoy size={17} />} onSelect={() => onNavigate('/help')}>Help center</Item>
          <DropdownMenu.Separator className="profile-dropdown-sep" />
          <Item icon={<LogOut size={17} />} onSelect={onSignOut}>Sign out</Item>
        </> : <>
          <Item icon={<LogIn size={17} />} onSelect={() => onNavigate('/signin')}>Log in</Item>
          <Item icon={<UserPlus size={17} />} onSelect={() => onNavigate('/signup')} accent>Sign up</Item>
          <DropdownMenu.Separator className="profile-dropdown-sep" />
          <Item icon={<Heart size={17} />} onSelect={() => onNavigate('/saved')} meta={savedCount || undefined}>Saved finds</Item>
          <Item icon={<MessageCircle size={17} />} onSelect={onHowItWorks}>How it works</Item>
          <Item icon={<LifeBuoy size={17} />} onSelect={() => onNavigate('/help')}>Help center</Item>
          <p className="profile-dropdown-note">Demo accounts only. Nothing leaves this browser tab.</p>
        </>}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>;
}

function Item({ icon, children, onSelect, meta, accent }: { icon: ReactNode; children: ReactNode; onSelect: () => void; meta?: number; accent?: boolean }) {
  return <DropdownMenu.Item className={`profile-dropdown-item${accent ? ' is-accent' : ''}`} onSelect={onSelect}>
    {icon}<span>{children}</span>{meta !== undefined && <em>{meta}</em>}
  </DropdownMenu.Item>;
}
